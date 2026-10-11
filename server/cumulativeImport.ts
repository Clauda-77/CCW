import XLSXModule from "xlsx";
import { and, eq, inArray } from "drizzle-orm";
import { adminAuditLogs, importBatches, inventoryBalances, materials, parties, warehouses, memos, memoItems, stockMovements } from "../drizzle/schema";
import { getDb } from "./db";
import { validateMemoWorkbooks, validateWorkbook, type ImportCategory } from "./importValidator";

const XLSX = (XLSXModule as unknown as { default?: typeof XLSXModule }).default ?? XLSXModule;
const text = (value: unknown) => String(value ?? "").trim();
const decimal = (value: unknown) => {
  const parsed = Number(text(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function readRows(base64: string) {
  const workbook = XLSX.read(Buffer.from(base64, "base64"), { type: "buffer", raw: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("لا تحتوي المصنفة على أي ورقة عمل.");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "", raw: false });
}

export async function commitCumulativeImport(input: { category: ImportCategory; base64: string; filename: string; createdBy: number }) {
  const validation = validateWorkbook(input.category, input.base64);
  if (!validation.isValid) throw new Error(`لا يمكن اعتماد الملف قبل معالجة الأعمدة المطلوبة: ${validation.missingColumns.join("، ") || "الملف فارغ"}.`);
  if (input.category === "memos") throw new Error("تتطلب المذكرات ملفي الرؤوس والبنود معًا للحفاظ على الترابط؛ لا يعتمد النظام ملفًا منفردًا للمذكرات.");
  const rows = readRows(input.base64);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");

  return db.transaction(async tx => {
    const batchResult = await tx.insert(importBatches).values({ category: input.category, originalFilename: input.filename.slice(0, 255), status: "validating", totalRows: rows.length, createdBy: input.createdBy });
    const batchId = Number(batchResult[0].insertId);
    let inserted = 0;
    let skipped = 0;
    let unresolved = 0;

    if (input.category === "materials") {
      const candidates = rows.map(row => ({ code: text(row.SERIALNO), name: text(row.PRTNAME), description: text(row.DESCRIPTION) || null, unit: text(row.WIHDA) || "عدد", barcode: text(row.BARCODE) || null, minimumStock: String(decimal(row.MINQUANTITE)), isActive: true })).filter(row => row.code && row.name);
      const unique = new Map<string, typeof candidates[number]>();
      candidates.forEach(row => unique.set(row.code, row));
      const codes = Array.from(unique.keys());
      const existing = codes.length ? await tx.select({ code: materials.code }).from(materials).where(inArray(materials.code, codes)) : [];
      const known = new Set(existing.map(row => row.code));
      const pending = Array.from(unique.values()).filter(row => !known.has(row.code));
      inserted = pending.length;
      skipped = candidates.length - pending.length;
      if (pending.length) await tx.insert(materials).values(pending);
    }

    if (input.category === "parties") {
      const candidates = rows.map(row => ({ legacyNumber: text(row.NUMERO) || null, name: text(row.ACCNAME), type: "both" as const, phone: text(row.TEL) || null, address: text(row.ADDRESS) || null, isActive: true })).filter(row => row.name);
      const unique = new Map<string, typeof candidates[number]>();
      candidates.forEach(row => unique.set(row.name, row));
      const names = Array.from(unique.keys());
      const existing = names.length ? await tx.select({ name: parties.name }).from(parties).where(inArray(parties.name, names)) : [];
      const known = new Set(existing.map(row => row.name));
      const pending = Array.from(unique.values()).filter(row => !known.has(row.name));
      inserted = pending.length;
      skipped = candidates.length - pending.length;
      if (pending.length) await tx.insert(parties).values(pending);
    }

    if (input.category === "balances") {
      const materialCodes = Array.from(new Set(rows.map(row => text(row.SERIALNO)).filter(Boolean)));
      const warehouseNames = Array.from(new Set(rows.map(row => text(row.NAMEINV1 || row.NAMEINV)).filter(Boolean)));
      const materialRows = materialCodes.length ? await tx.select({ id: materials.id, code: materials.code }).from(materials).where(inArray(materials.code, materialCodes)) : [];
      const warehouseRows = warehouseNames.length ? await tx.select({ id: warehouses.id, name: warehouses.name }).from(warehouses).where(inArray(warehouses.name, warehouseNames)) : [];
      const materialByCode = new Map(materialRows.map(row => [row.code, row.id]));
      const warehouseByName = new Map(warehouseRows.map(row => [row.name, row.id]));
      const existingRows = await tx.select({ materialId: inventoryBalances.materialId, warehouseId: inventoryBalances.warehouseId, partyId: inventoryBalances.partyId }).from(inventoryBalances);
      const existing = new Set(existingRows.filter(row => row.partyId === null).map(row => `${row.materialId}|${row.warehouseId}`));
      const pending = [] as Array<{ materialId: number; warehouseId: number; partyId: null; openingQuantity: string; onHandQuantity: string; reservedQuantity: string }>;
      const seen = new Set<string>();
      for (const row of rows) {
        const materialId = materialByCode.get(text(row.SERIALNO));
        const warehouseId = warehouseByName.get(text(row.NAMEINV1 || row.NAMEINV));
        if (!materialId || !warehouseId) { unresolved += 1; continue; }
        const key = `${materialId}|${warehouseId}`;
        if (existing.has(key) || seen.has(key)) { skipped += 1; continue; }
        seen.add(key);
        pending.push({ materialId, warehouseId, partyId: null, openingQuantity: String(decimal(row.QUANTITEFRSTPERIODE)), onHandQuantity: String(decimal(row.QUANTITEONHAND)), reservedQuantity: String(decimal(row.QUANTITEMOUNA)) });
      }
      inserted = pending.length;
      if (pending.length) await tx.insert(inventoryBalances).values(pending);
    }

    const summary = [`جديد: ${inserted}`, `متجاوز: ${skipped}`, `غير مرتبط: ${unresolved}`].join(" — ");
    await tx.update(importBatches).set({ status: "imported", importedRows: inserted, errorSummary: summary, completedAt: new Date() }).where(eq(importBatches.id, batchId));
    await tx.insert(adminAuditLogs).values({ actorId: input.createdBy, action: "import_committed", entityType: "import_batch", entityId: batchId, entityLabel: input.filename.slice(0, 255), details: `اعتماد استيراد ${input.category}: ${summary}.` });
    return { batchId, category: input.category, totalRows: rows.length, inserted, skipped, unresolved, summary };
  });
}

const legacyDate = (value: unknown) => {
  const raw = text(value);
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  const date = new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date;
};

const legacyMemoNumber = (sourceNumber: string, memoDate: Date) => /^\d+-\d{8}$/.test(sourceNumber) ? sourceNumber : `${sourceNumber}-${memoDate.toISOString().slice(0, 10).replaceAll("-", "")}`;

export async function commitLinkedMemoImport(input: { headerBase64: string; itemBase64: string; headerFilename: string; itemFilename: string; createdBy: number; source: "SRC" | "CST" }) {
  const validation = validateMemoWorkbooks(input.headerBase64, input.itemBase64);
  if (!validation.isValid) throw new Error(`لا يمكن اعتماد ملفات المذكرات: أعمدة الرؤوس الناقصة (${validation.missingHeaderColumns.join("، ") || "لا يوجد"})، أعمدة البنود الناقصة (${validation.missingItemColumns.join("، ") || "لا يوجد"})، بنود غير مرتبطة (${validation.unresolvedItems}).`);
  const headers = readRows(input.headerBase64);
  const items = readRows(input.itemBase64);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [batchResult] = await tx.insert(importBatches).values({ category: "memos", originalFilename: `${input.headerFilename} + ${input.itemFilename}`.slice(0, 255), status: "validating", totalRows: headers.length + items.length, createdBy: input.createdBy });
    const batchId = Number(batchResult.insertId);
    const materialsRows = await tx.select({ id: materials.id, code: materials.code }).from(materials);
    const warehousesRows = await tx.select({ id: warehouses.id, name: warehouses.name }).from(warehouses);
    const partiesRows = await tx.select({ id: parties.id, name: parties.name }).from(parties);
    const materialMap = new Map<string, number>();
    materialsRows.forEach(row => { const code = text(row.code); materialMap.set(code, row.id); materialMap.set(code.replace(/^legacy[-_]/i, ""), row.id); });
    const warehouseMap = new Map(warehousesRows.map(row => [text(row.name), row.id]));
    const partyMap = new Map(partiesRows.map(row => [text(row.name), row.id]));
    const existing = await tx.select({ id: memos.id, type: memos.type, memoNumber: memos.memoNumber, memoDate: memos.memoDate, warehouseId: memos.warehouseId, partyId: memos.partyId }).from(memos);
    const existingKeys = new Set(existing.map(row => `${row.type}|${row.memoNumber}`));
    const itemMemoNumbers = new Set(items.map(row => text(row.BILNO)).filter(Boolean));
    const headerByKey = new Map<string, Record<string, unknown>>();
    const resolvedMemoNumbers = new Map<string, string>();
    let skippedHeaders = 0;
    let unresolvedHeaders = 0;
    for (const row of headers) {
      const sourceNumber = text(row.BILNO);
      if (!itemMemoNumbers.has(sourceNumber)) { skippedHeaders += 1; continue; }
      const memoDate = legacyDate(row.BILDATE);
      const label = text(row.TYPFATOURA);
      const type = input.source === "SRC" ? "inbound" : "outbound";
      const warehouseName = text(row.NAMEINV1 || row.NAMEINV1CST || row.NAMEINV);
      const warehouseId = warehouseMap.get(warehouseName);
      if (!sourceNumber || !memoDate || !warehouseId) { unresolvedHeaders += 1; continue; }
      const memoNumber = legacyMemoNumber(sourceNumber, memoDate);
      const key = `${type}|${memoNumber}`;
      if (headerByKey.has(key) || existingKeys.has(key)) { skippedHeaders += 1; continue; }
      headerByKey.set(key, { ...row, __type: type, __sourceNumber: sourceNumber, __memoNumber: memoNumber, __memoDate: memoDate, __warehouseId: warehouseId, __partyId: partyMap.get(text(row.ACCNAME1 || row.ACCNAME)) ?? null, __label: label });
    }
    const memoRows: Array<typeof memos.$inferInsert> = [];
    for (const row of Array.from(headerByKey.values())) {
      const memoNumber = String(row.__memoNumber);
      resolvedMemoNumbers.set(`${row.__type}|${String(row.__sourceNumber)}`, memoNumber);
      memoRows.push({ type: row.__type as "inbound" | "outbound", memoNumber, status: "approved", warehouseId: Number(row.__warehouseId), partyId: row.__partyId as number | null, folderNumber: text(row.NUMFOLDER) || null, orderNumber: text(row.NUMTALAB) || null, orderDate: legacyDate(row.DATETALAB), invoiceNumber: text(row.NUMFATOURA) || null, invoiceDate: legacyDate(row.DATEFATOURA), referenceNumber: text(row.NUMMALI) || null, memoDate: row.__memoDate as Date, notes: text(row.__label) || null, createdBy: input.createdBy });
    }
    if (memoRows.length) await tx.insert(memos).values(memoRows);
    const insertedRows = await tx.select({ id: memos.id, type: memos.type, memoNumber: memos.memoNumber, warehouseId: memos.warehouseId, partyId: memos.partyId, memoDate: memos.memoDate }).from(memos);
    const memoMap = new Map(insertedRows.map(row => [`${row.type}|${row.memoNumber}`, row]));
    const existingItemRows = await tx.select({ memoId: memoItems.memoId, materialId: memoItems.materialId }).from(memoItems);
    const existingItemKeys = new Set(existingItemRows.map(row => `${row.memoId}|${row.materialId}`));
    const existingMovementRows = await tx.select({ memoId: stockMovements.memoId, materialId: stockMovements.materialId, movementType: stockMovements.movementType }).from(stockMovements);
    const existingMovementKeys = new Set(existingMovementRows.map(row => `${row.memoId}|${row.materialId}|${row.movementType}`));
    const itemRows: Array<typeof memoItems.$inferInsert> = [];
    const movementRows: Array<typeof stockMovements.$inferInsert> = [];
    let skippedItems = 0;
    let unresolvedItems = 0;
    const seenItemKeys = new Set<string>();
    for (const row of items) {
      const memoNumber = text(row.BILNO);
      const memoType = input.source === "SRC" ? "inbound" : "outbound";
      const memo = memoMap.get(`${memoType}|${resolvedMemoNumbers.get(`${memoType}|${memoNumber}`) ?? memoNumber}`);
      const materialKey = text(row.SERIALNO) || text(row.PRTNO);
      const materialId = materialMap.get(materialKey) ?? materialMap.get(materialKey.replace(/^legacy[-_]/i, ""));
      const quantity = decimal(row.QUANTITE);
      if (!memo || !materialId || quantity <= 0) { unresolvedItems += 1; continue; }
      const itemKey = `${memo.id}|${materialId}`;
      const movementKey = `${memo.id}|${materialId}|${memo.type}`;
      if (existingItemKeys.has(itemKey) || existingMovementKeys.has(movementKey)) { skippedItems += 1; continue; }
      existingItemKeys.add(itemKey); existingMovementKeys.add(movementKey);
      itemRows.push({ memoId: memo.id, materialId, quantity: String(quantity), unitPrice: decimal(row.PRICE) ? String(decimal(row.PRICE)) : null, notes: text(row.REMARQUE) || null });
      movementRows.push({ materialId, warehouseId: memo.warehouseId, partyId: memo.partyId, memoId: memo.id, memoItemId: null, movementType: memo.type, quantityIn: memo.type === "inbound" ? String(quantity) : "0", quantityOut: memo.type === "outbound" ? String(quantity) : "0", occurredAt: memo.memoDate, createdBy: input.createdBy });
    }
    if (itemRows.length) await tx.insert(memoItems).values(itemRows);
    if (movementRows.length) await tx.insert(stockMovements).values(movementRows);
    const inserted = memoRows.length;
    const skipped = skippedHeaders + skippedItems;
    const unresolved = unresolvedHeaders + unresolvedItems;
    const summary = [`مذكرات جديدة: ${inserted}`, `متجاوزة: ${skipped}`, `غير مرتبطة: ${unresolved}`, `بنود مضافة: ${itemRows.length}`].join(" — ");
    await tx.update(importBatches).set({ status: "imported", importedRows: inserted + itemRows.length, errorSummary: summary, completedAt: new Date() }).where(eq(importBatches.id, batchId));
    await tx.insert(adminAuditLogs).values({ actorId: input.createdBy, action: "memo_import_committed", entityType: "import_batch", entityId: batchId, entityLabel: `${input.headerFilename} + ${input.itemFilename}`.slice(0, 255), details: `اعتماد استيراد مذكرات ${input.source}: ${summary}.` });
    return { batchId, source: input.source, headers: headers.length, items: items.length, inserted, insertedItems: itemRows.length, skipped, unresolved, summary };
  });
}
