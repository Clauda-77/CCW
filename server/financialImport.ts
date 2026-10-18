import XLSXModule from "xlsx";
import { and, eq, inArray } from "drizzle-orm";
import {
  adminAuditLogs,
  financialEntries,
  importBatches,
  warehouses,
} from "../drizzle/schema";
import { getDb } from "./db";

const XLSX = (XLSXModule as unknown as { default?: typeof XLSXModule }).default ?? XLSXModule;

type FinancialRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  const normalized = text(value).replaceAll(",", "").replaceAll("٬", "").replaceAll("٫", ".");
  const result = Number(normalized);
  return Number.isFinite(result) ? result : NaN;
};

const aliases = {
  entryNumber: ["رقم القيد", "رقم القيد المالي", "ENTRYNO", "ENTRY_NUMBER", "entryNumber"],
  entryDate: ["تاريخ القيد", "التاريخ", "ENTRYDATE", "ENTRY_DATE", "entryDate"],
  invoiceNumber: ["رقم الفاتورة", "الفاتورة", "INVOICENO", "INVOICE_NUMBER", "invoiceNumber"],
  disbursementNumber: ["رقم أمر الصرف", "أمر الصرف", "رقم التصرف", "DISBURSEMENTNO", "DISBURSEMENT_NUMBER", "disbursementNumber"],
  receiptMemoNumber: ["رقم مذكرة الاستلام", "مذكرة الاستلام", "رقم مذكرة الإدخال", "RECEIPT_MEMO_NO", "RECEIPT_MEMO_NUMBER", "receiptMemoNumber"],
  referenceNumber: ["الرقم المالي", "رقم المرجع", "REFERENCE_NO", "REFERENCE_NUMBER", "referenceNumber"],
  amount: ["القيمة", "المبلغ", "الإجمالي", "AMOUNT", "amount"],
  currency: ["العملة", "CURRENCY", "currency"],
  warehouse: ["المستودع", "اسم المستودع", "WAREHOUSE", "WAREHOUSE_NAME", "warehouseName"],
  warehouseCode: ["رمز المستودع", "كود المستودع", "WAREHOUSE_CODE", "warehouseCode"],
  description: ["البيان", "الوصف", "الملاحظات", "DESCRIPTION", "description"],
} as const;

function findValue(row: FinancialRow, names: readonly string[]) {
  const keys = Object.keys(row);
  const key = keys.find(candidate => names.some(name => candidate.trim().toLowerCase() === name.toLowerCase()));
  return key ? row[key] : undefined;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!match) return null;
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  const date = new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1]), 12));
  return Number.isNaN(date.getTime()) ? null : date;
}

function readRows(base64: string) {
  const workbook = XLSX.read(Buffer.from(base64, "base64"), { type: "buffer", raw: false, cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("ملف المالية لا يحتوي على ورقة عمل.");
  const rows = XLSX.utils.sheet_to_json<FinancialRow>(workbook.Sheets[sheetName], { defval: "", raw: false });
  return { sheetName, rows };
}

export function validateFinancialWorkbook(base64: string) {
  const { sheetName, rows } = readRows(base64);
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const has = (field: keyof typeof aliases) => keys.some(key => aliases[field].some(alias => key.trim().toLowerCase() === alias.toLowerCase()));
  const required = ["entryNumber", "entryDate", "amount", "warehouse"] as const;
  const missingColumns = required.filter(field => !has(field)).map(field => aliases[field][0]);
  const warnings: string[] = [];
  if (!has("invoiceNumber") && !has("receiptMemoNumber")) warnings.push("يجب وجود رقم فاتورة أو رقم مذكرة استلام للمطابقة.");
  if (!has("disbursementNumber")) warnings.push("لم يوجد عمود رقم أمر الصرف؛ ستبقى مطابقة أمر الصرف غير متاحة.");
  return {
    isValid: rows.length > 0 && missingColumns.length === 0,
    sheetName,
    totalRows: rows.length,
    columns: keys,
    sample: rows.slice(0, 10),
    missingColumns,
    warnings,
  };
}

export async function commitFinancialWorkbook(input: { base64: string; filename: string; createdBy: number }) {
  const validation = validateFinancialWorkbook(input.base64);
  if (!validation.isValid) throw new Error(`ملف المالية غير صالح. الأعمدة الناقصة: ${validation.missingColumns.join("، ") || "الملف فارغ"}.`);
  const { rows } = readRows(input.base64);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");

  return db.transaction(async tx => {
    const [batch] = await tx.insert(importBatches).values({
      category: "finance",
      originalFilename: `FINANCE: ${input.filename}`.slice(0, 255),
      status: "validating",
      totalRows: rows.length,
      createdBy: input.createdBy,
    });
    const batchId = Number(batch.insertId);
    const warehouseRows = await tx.select({ id: warehouses.id, name: warehouses.name, code: warehouses.code }).from(warehouses);
    const warehouseByName = new Map(warehouseRows.map(row => [text(row.name).toLowerCase(), row.id]));
    const warehouseByCode = new Map(warehouseRows.map(row => [text(row.code).toLowerCase(), row.id]));
    const existing = await tx.select({ entryNumber: financialEntries.entryNumber, warehouseId: financialEntries.warehouseId }).from(financialEntries);
    const existingKeys = new Set(existing.map(row => `${row.warehouseId}|${row.entryNumber}`));
    const seen = new Set<string>();
    const pending: Array<typeof financialEntries.$inferInsert> = [];
    let skipped = 0;
    let unresolved = 0;
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const entryNumber = text(findValue(row, aliases.entryNumber));
      const date = parseDate(findValue(row, aliases.entryDate));
      const amount = numberValue(findValue(row, aliases.amount));
      const warehouseName = text(findValue(row, aliases.warehouse)).toLowerCase();
      const warehouseCode = text(findValue(row, aliases.warehouseCode)).toLowerCase();
      const warehouseId = (warehouseCode && warehouseByCode.get(warehouseCode)) ?? (warehouseName && warehouseByName.get(warehouseName));
      if (!entryNumber || !date || !Number.isFinite(amount) || !warehouseId) {
        unresolved += 1;
        if (errors.length < 20) errors.push(`الصف ${index + 2}: رقم القيد أو التاريخ أو القيمة أو المستودع غير صالح.`);
        return;
      }
      const key = `${warehouseId}|${entryNumber}`;
      if (existingKeys.has(key) || seen.has(key)) { skipped += 1; return; }
      seen.add(key);
      pending.push({
        entryNumber,
        entryDate: date,
        warehouseId,
        invoiceNumber: text(findValue(row, aliases.invoiceNumber)) || null,
        disbursementNumber: text(findValue(row, aliases.disbursementNumber)) || null,
        receiptMemoNumber: text(findValue(row, aliases.receiptMemoNumber)) || null,
        referenceNumber: text(findValue(row, aliases.referenceNumber)) || null,
        amount: String(amount),
        currency: text(findValue(row, aliases.currency)) || "SYP",
        description: text(findValue(row, aliases.description)) || null,
        source: "excel",
        createdBy: input.createdBy,
      });
    });

    if (pending.length) await tx.insert(financialEntries).values(pending);
    const summary = [`جديد: ${pending.length}`, `متجاوز مكرر: ${skipped}`, `غير مرتبط/غير صالح: ${unresolved}`].join(" — ");
    await tx.update(importBatches).set({ status: "imported", importedRows: pending.length, errorSummary: `${summary}${errors.length ? ` — ${errors.join(" | ")}` : ""}`, completedAt: new Date() }).where(eq(importBatches.id, batchId));
    await tx.insert(adminAuditLogs).values({ actorId: input.createdBy, action: "import_committed", entityType: "import_batch", entityId: batchId, entityLabel: input.filename.slice(0, 255), details: `استيراد سجلات المالية: ${summary}.` });
    return { batchId, totalRows: rows.length, inserted: pending.length, skipped, unresolved, summary, errors };
  });
}
