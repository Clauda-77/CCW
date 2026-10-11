import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const inputPath = "/home/ubuntu/upload/legacy-normalized-import.json";
const resultPath = "/home/ubuntu/upload/legacy-import-result.json";
const mode = process.argv[2] ?? "all";
const allowedModes = new Set(["foundation", "balances", "memos", "empty-memos", "all"]);

if (!allowedModes.has(mode)) {
  throw new Error(`Unsupported import mode: ${mode}`);
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not available for the import.");
}

const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const batchSize = 250;
const result = { mode, startedAt: new Date().toISOString(), before: {}, stages: {}, after: {}, sourceSummary: payload.summary };

const chunks = (items, size = batchSize) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const emptyToNull = value => value === undefined || value === null || value === "" ? null : value;

async function tableCounts() {
  const [rows] = await connection.query(`
    SELECT 'warehouses' AS table_name, COUNT(*) AS row_count FROM warehouses
    UNION ALL SELECT 'parties', COUNT(*) FROM parties
    UNION ALL SELECT 'materials', COUNT(*) FROM materials
    UNION ALL SELECT 'inventoryBalances', COUNT(*) FROM inventoryBalances
    UNION ALL SELECT 'memos', COUNT(*) FROM memos
    UNION ALL SELECT 'memoItems', COUNT(*) FROM memoItems
    UNION ALL SELECT 'stockMovements', COUNT(*) FROM stockMovements
  `);
  return Object.fromEntries(rows.map(row => [row.table_name, Number(row.row_count)]));
}

async function insertValues(sqlPrefix, rows, columns, makeValues) {
  for (const group of chunks(rows)) {
    const placeholders = group.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
    const values = group.flatMap(makeValues);
    await connection.execute(`${sqlPrefix} VALUES ${placeholders}`, values);
  }
}

async function importFoundation() {
  await connection.beginTransaction();
  try {
    await insertValues(
      "INSERT IGNORE INTO warehouses (code,name,kind,isActive)",
      payload.warehouses,
      ["code", "name", "kind", "isActive"],
      row => [row.code, row.name, row.kind, 1],
    );

    const [partyRows] = await connection.query("SELECT legacyNumber FROM parties WHERE legacyNumber IS NOT NULL");
    const existingPartyNumbers = new Set(partyRows.map(row => String(row.legacyNumber)));
    const newParties = payload.parties.filter(row => !existingPartyNumbers.has(String(row.legacyNumber)));
    await insertValues(
      "INSERT INTO parties (legacyNumber,name,type,phone,address,isActive)",
      newParties,
      ["legacyNumber", "name", "type", "phone", "address", "isActive"],
      row => [row.legacyNumber, row.name, row.type, emptyToNull(row.phone), emptyToNull(row.address), 1],
    );

    await insertValues(
      "INSERT IGNORE INTO materials (code,name,description,unit,barcode,minimumStock,isActive)",
      payload.materials,
      ["code", "name", "description", "unit", "barcode", "minimumStock", "isActive"],
      row => [row.code, row.name, emptyToNull(row.description), row.unit, emptyToNull(row.barcode), row.minimumStock, 1],
    );
    await connection.commit();
    result.stages.foundation = { sourceWarehouses: payload.warehouses.length, sourceParties: payload.parties.length, sourceMaterials: payload.materials.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function maps() {
  const [warehouseRows] = await connection.query("SELECT id, code FROM warehouses");
  const [materialRows] = await connection.query("SELECT id, code FROM materials");
  const [partyRows] = await connection.query("SELECT id, legacyNumber FROM parties WHERE legacyNumber IS NOT NULL");
  return {
    warehouse: new Map(warehouseRows.map(row => [String(row.code), Number(row.id)])),
    material: new Map(materialRows.map(row => [String(row.code), Number(row.id)])),
    party: new Map(partyRows.map(row => [String(row.legacyNumber), Number(row.id)])),
  };
}

async function importBalances() {
  const ids = await maps();
  const [existingRows] = await connection.query("SELECT materialId, warehouseId, partyId FROM inventoryBalances");
  const existing = new Set(existingRows.map(row => `${row.materialId}|${row.warehouseId}|${row.partyId ?? "null"}`));
  const prepared = [];
  for (const row of payload.balances) {
    const materialId = ids.material.get(`legacy-${row.materialLegacyId}`);
    const warehouseId = ids.warehouse.get(`legacy-${row.warehouseLegacyId}`);
    const partyId = null;
    const key = `${materialId}|${warehouseId}|null`;
    if (!materialId || !warehouseId || existing.has(key)) continue;
    prepared.push([materialId, warehouseId, partyId, row.openingQuantity, row.onHandQuantity, row.reservedQuantity]);
    existing.add(key);
  }
  await connection.beginTransaction();
  try {
    for (const group of chunks(prepared)) {
      const placeholders = group.map(() => "(?,?,?,?,?,?)").join(",");
      await connection.execute(`INSERT INTO inventoryBalances (materialId,warehouseId,partyId,openingQuantity,onHandQuantity,reservedQuantity) VALUES ${placeholders}`, group.flat());
    }
    await connection.commit();
    result.stages.balances = { sourceBalances: payload.balances.length, insertedCandidates: prepared.length, skippedExisting: payload.balances.length - prepared.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function importMemos() {
  const ids = await maps();
  const [existingRows] = await connection.query("SELECT type, memoNumber FROM memos");
  const existing = new Set(existingRows.map(row => `${row.type}|${row.memoNumber}`));
  const [users] = await connection.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  if (!users.length) throw new Error("An administrator account is required to preserve the mandatory imported-by reference.");
  const importerUserId = Number(users[0].id);
  const documents = payload.memos.filter(document => document.items.length > 0 && !existing.has(`${document.type}|${document.memoNumber}`));
  let insertedMemos = 0;
  let insertedItems = 0;
  let insertedMovements = 0;
  let skippedUnmapped = 0;

  for (const group of chunks(documents, 100)) {
    await connection.beginTransaction();
    try {
      const preparedDocuments = group.map(document => ({
        ...document,
        warehouseId: ids.warehouse.get(`legacy-${document.warehouseLegacyId}`),
        partyId: document.partyLegacyNumber ? ids.party.get(String(document.partyLegacyNumber)) ?? null : null,
      })).filter(document => Boolean(document.warehouseId));
      skippedUnmapped += group.length - preparedDocuments.length;
      if (preparedDocuments.length) {
        const memoPlaceholders = preparedDocuments.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
        const memoValues = preparedDocuments.flatMap(document => [
          document.type, document.memoNumber, "approved", document.warehouseId, document.partyId, emptyToNull(document.folderNumber), emptyToNull(document.orderNumber), emptyToNull(document.orderDate), emptyToNull(document.invoiceNumber), emptyToNull(document.invoiceDate), emptyToNull(document.referenceNumber), document.memoDate, emptyToNull(document.notes), importerUserId,
        ]);
        await connection.execute(`INSERT INTO memos (type,memoNumber,status,warehouseId,partyId,folderNumber,orderNumber,orderDate,invoiceNumber,invoiceDate,referenceNumber,memoDate,notes,createdBy) VALUES ${memoPlaceholders}`, memoValues);
        insertedMemos += preparedDocuments.length;

        const memoIds = new Map();
        for (const type of ["inbound", "outbound"]) {
          const numbers = preparedDocuments.filter(document => document.type === type).map(document => document.memoNumber);
          if (!numbers.length) continue;
          const [memoRows] = await connection.execute(`SELECT id, memoNumber FROM memos WHERE type = ? AND memoNumber IN (${numbers.map(() => "?").join(",")})`, [type, ...numbers]);
          memoRows.forEach(row => memoIds.set(`${type}|${row.memoNumber}`, Number(row.id)));
        }

        const preparedItems = [];
        for (const document of preparedDocuments) {
          const memoId = memoIds.get(`${document.type}|${document.memoNumber}`);
          if (!memoId) {
            skippedUnmapped += 1;
            continue;
          }
          for (const item of document.items) {
            const materialId = ids.material.get(`legacy-${item.materialLegacyId}`);
            if (!materialId) {
              skippedUnmapped += 1;
              continue;
            }
            preparedItems.push({ memoId, materialId, warehouseId: document.warehouseId, partyId: document.partyId, type: document.type, memoDate: document.memoDate, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes });
          }
        }
        for (const itemGroup of chunks(preparedItems)) {
          const itemPlaceholders = itemGroup.map(() => "(?,?,?,?,?)").join(",");
          const itemValues = itemGroup.flatMap(item => [item.memoId, item.materialId, item.quantity, emptyToNull(item.unitPrice), emptyToNull(item.notes)]);
          await connection.execute(`INSERT INTO memoItems (memoId,materialId,quantity,unitPrice,notes) VALUES ${itemPlaceholders}`, itemValues);
          const movementPlaceholders = itemGroup.map(() => "(?,?,?,?,?,?,?,?,?,?)").join(",");
          const movementValues = itemGroup.flatMap(item => [item.materialId, item.warehouseId, item.partyId, item.memoId, null, item.type === "inbound" ? "inbound" : "outbound", item.type === "inbound" ? item.quantity : 0, item.type === "outbound" ? item.quantity : 0, item.memoDate, importerUserId]);
          await connection.execute(`INSERT INTO stockMovements (materialId,warehouseId,partyId,memoId,memoItemId,movementType,quantityIn,quantityOut,occurredAt,createdBy) VALUES ${movementPlaceholders}`, movementValues);
          insertedItems += itemGroup.length;
          insertedMovements += itemGroup.length;
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
  result.stages.memos = { sourceMemos: payload.memos.length, insertedMemos, insertedItems, insertedMovements, skippedExisting: payload.memos.length - documents.length, skippedUnmapped };
}

async function importEmptyMemoHeaders() {
  const ids = await maps();
  const [existingRows] = await connection.query("SELECT type, memoNumber FROM memos");
  const existing = new Set(existingRows.map(row => `${row.type}|${row.memoNumber}`));
  const [users] = await connection.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  if (!users.length) throw new Error("An administrator account is required to preserve the mandatory imported-by reference.");
  const importerUserId = Number(users[0].id);
  const headers = payload.memos.filter(document => document.items.length === 0 && !existing.has(`${document.type}|${document.memoNumber}`));
  let insertedHeaders = 0;
  let skippedUnmapped = 0;
  for (const group of chunks(headers, 250)) {
    const prepared = group.map(document => ({
      ...document,
      warehouseId: ids.warehouse.get(`legacy-${document.warehouseLegacyId}`),
      partyId: document.partyLegacyNumber ? ids.party.get(String(document.partyLegacyNumber)) ?? null : null,
    })).filter(document => Boolean(document.warehouseId));
    skippedUnmapped += group.length - prepared.length;
    if (!prepared.length) continue;
    await connection.beginTransaction();
    try {
      const placeholders = prepared.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
      const values = prepared.flatMap(document => [
        document.type, document.memoNumber, "approved", document.warehouseId, document.partyId, emptyToNull(document.folderNumber), emptyToNull(document.orderNumber), emptyToNull(document.orderDate), emptyToNull(document.invoiceNumber), emptyToNull(document.invoiceDate), emptyToNull(document.referenceNumber), document.memoDate, emptyToNull(document.notes), importerUserId,
      ]);
      await connection.execute(`INSERT INTO memos (type,memoNumber,status,warehouseId,partyId,folderNumber,orderNumber,orderDate,invoiceNumber,invoiceDate,referenceNumber,memoDate,notes,createdBy) VALUES ${placeholders}`, values);
      await connection.commit();
      insertedHeaders += prepared.length;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
  result.stages.emptyMemos = { sourceEmptyHeaders: headers.length, insertedHeaders, skippedUnmapped };
}

try {
  result.before = await tableCounts();
  if (mode === "foundation" || mode === "all") await importFoundation();
  if (mode === "balances" || mode === "all") await importBalances();
  if (mode === "memos" || mode === "all") await importMemos();
  if (mode === "empty-memos" || mode === "all") await importEmptyMemoHeaders();
  result.after = await tableCounts();
  result.completedAt = new Date().toISOString();
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await connection.end();
}
