import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import mysql from "mysql2/promise";
import {
  buildDriveImportPlan,
  PRESERVED_TABLES,
  REPLACED_TABLES,
  sanitizedReport,
} from "./driveImportCore.mjs";

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => {
  const index = args.findIndex(value => value === name);
  if (index >= 0) return args[index + 1];
  const prefix = `${name}=`;
  const value = args.find(item => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
};

const mode = flag("--replace") ? "replace" : "preview";
const noBackupMode = flag("--no-backup");
const sourceDir = path.resolve(option("--source-dir") ?? "./legacy-drive-data");
const backupDir = path.resolve(option("--backup-dir") ?? "./backups");
const reportArgument = option("--report");
const batchSize = 250;
const APPROVED_EXTRA_SKIP_COUNTS = Object.freeze({
  ambiguous_legacy_material_identity: 32,
  unresolved_detail_material: 128,
  unresolved_balance_scope: 35,
  duplicate_balance_scope: 18,
});

function help() {
  console.log(`
استبدال بيانات المستودع من ملفات Drive — الوضع الافتراضي معاينة فقط.

معاينة دون اتصال بقاعدة البيانات:
  node scripts/driveReplaceImport.mjs --source-dir ./legacy-drive-data

  استبدال محلي بعد نسخة احتياطية كاملة:
  node scripts/driveReplaceImport.mjs --replace --skip-known-213 --source-dir ./legacy-drive-data

  استبدال محلي بلا نسخة احتياطية (لا يمكن التراجع عند الفشل):
  node scripts/driveReplaceImport.mjs --replace --no-backup --skip-known-213 --source-dir ./legacy-drive-data

خيارات:
  --source-dir PATH   مجلد CSV الأصلي (الافتراضي ./legacy-drive-data)
  --backup-dir PATH   مجلد النسخ والتقارير (الافتراضي ./backups)
  --no-backup         تخطي النسخة الاحتياطية؛ يتطلب تأكيدًا خاصًا ولا توجد استعادة آلية
  --report PATH       مسار تقرير JSON
  --skip-known-213    تجاوز وتسجيل الحواجز المعروفة فقط (32+128+35+18)؛ يرفض أي اختلاف بالأعداد
  --allow-remote      السماح بقاعدة بيانات غير محلية (غير موصى به)
  --help              عرض هذه المساعدة

افتراضيًا لا يبدأ الاستبدال إلا بعد نجاح المعاينة والنسخة الاحتياطية والتأكيد اليدوي. مع --no-backup سيطلب كتابة REPLACE WITHOUT BACKUP متبوعًا باسم قاعدة البيانات.
`);
}

if (flag("--help") || flag("-h")) {
  help();
  process.exit(0);
}

function summary(report) {
  const planned = report.planned;
  return {
    status: report.status,
    sourceRecords: report.sourceCounts,
    planned: {
      warehouses: planned.sourceWarehouses,
      parties: planned.parties,
      materials: planned.totalMaterials,
      derivedMaterials: planned.derivedMaterials,
      balances: planned.balances,
      memos: planned.memos,
      memoItems: planned.memoItems,
      stockMovements: planned.stockMovements,
      headerOnlyMemos: planned.headerOnlyMemos,
    },
    sourceWarehouseAudit: report.sourceWarehouseAudit,
    skipped: {
      ambiguousMemoDetails: report.skips.ambiguousMemoDetails,
      missingQuantityDetails: report.skips.missingQuantityDetails,
      total: report.skips.totalDetailsSkipped,
      approvedAdditionalIssues: report.approvedAdditionalSkips?.totalIssues ?? 0,
      additionalMemoDetailsSkipped: report.approvedAdditionalSkips?.memoDetailsSkipped ?? 0,
      additionalBalanceRowsSkipped: report.approvedAdditionalSkips?.balanceRowsSkipped ?? 0,
    },
    blockers: report.blockers.length,
  };
}

function printBlockers(blockers) {
  if (!blockers.length) return;
  console.error("\nتوجد مشكلات تمنع الاستبدال الآمن:");
  for (const item of blockers.slice(0, 30)) {
    console.error(`- ${item.code}${item.file ? ` (${item.file}${item.rowNumber ? `، صف ${item.rowNumber}` : ""})` : ""}`);
  }
  if (blockers.length > 30) console.error(`- ومشكلات أخرى: ${blockers.length - 30}`);
}

function applyKnownSkipPolicy(plan, report) {
  const actualCounts = Object.fromEntries(
    Object.keys(APPROVED_EXTRA_SKIP_COUNTS).map(code => [
      code,
      report.blockers.filter(item => item.code === code).length,
    ])
  );
  const mismatches = Object.entries(APPROVED_EXTRA_SKIP_COUNTS)
    .filter(([code, expected]) => actualCounts[code] !== expected)
    .map(([code, expected]) => `${code}: المتوقع ${expected}، الموجود ${actualCounts[code]}`);
  const allowed = new Set(Object.keys(APPROVED_EXTRA_SKIP_COUNTS));
  const unexpected = report.blockers.filter(item => !allowed.has(item.code));
  if (mismatches.length || unexpected.length) {
    const reasons = [
      ...mismatches,
      ...(unexpected.length ? [`حواجز أخرى غير معتمدة: ${unexpected.length}`] : []),
    ];
    throw new Error(`رفض تجاوز البيانات لأن المعاينة تغيرت أو ظهرت مشكلات جديدة: ${reasons.join("؛ ")}.`);
  }

  const acceptedRows = report.blockers.map(item => ({
    code: item.code,
    file: item.file ?? null,
    rowNumber: item.rowNumber ?? null,
    column: item.column ?? null,
  }));
  const approvedAdditionalSkips = {
    approvedWithFlag: "--skip-known-213",
    totalIssues: acceptedRows.length,
    counts: actualCounts,
    materialIdentitiesSkipped: actualCounts.ambiguous_legacy_material_identity,
    memoDetailsSkipped: actualCounts.unresolved_detail_material,
    balanceRowsSkipped:
      actualCounts.unresolved_balance_scope + actualCounts.duplicate_balance_scope,
    rows: acceptedRows,
  };
  report.approvedAdditionalSkips = approvedAdditionalSkips;
  report.blockers = unexpected;
  report.status = unexpected.length ? "blocked" : "ready";
  plan.report.approvedAdditionalSkips = approvedAdditionalSkips;
  plan.report.blockers = unexpected;
  plan.report.status = report.status;
}

function databaseConfig(databaseUrl) {
  let url;
  try { url = new URL(databaseUrl); }
  catch { throw new Error("DATABASE_URL غير صالح؛ استخدم رابط mysql://user:password@host:port/database."); }
  if (!["mysql:", "mysql2:"].includes(url.protocol)) throw new Error("يجب أن يكون DATABASE_URL من نوع mysql.");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("لم يُحدّد اسم قاعدة البيانات في DATABASE_URL.");
  return {
    host: url.hostname || "localhost",
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    timezone: "Z",
    charset: "utf8mb4",
    decimalNumbers: false,
  };
}

function mysqlOption(value) {
  return `"${String(value ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function makeBackup(config, backupDirPath) {
  fs.mkdirSync(backupDirPath, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(backupDirPath, 0o700); } catch {}
  const backupPath = path.join(backupDirPath, `drive-replace-${timestampSlug()}.sql`);
  const optionFile = path.join(os.tmpdir(), `drive-db-${process.pid}-${Date.now()}.cnf`);
  const optionText = [
    "[client]",
    `host=${mysqlOption(config.host)}`,
    `port=${config.port}`,
    `user=${mysqlOption(config.user)}`,
    `password=${mysqlOption(config.password)}`,
    "protocol=TCP",
    "default-character-set=utf8mb4",
    "",
  ].join("\n");
  fs.writeFileSync(optionFile, optionText, { mode: 0o600, flag: "wx" });
  let lastError = null;
  try {
    for (const command of ["mysqldump", "mariadb-dump"]) {
      const result = spawnSync(command, [
        `--defaults-extra-file=${optionFile}`,
        "--single-transaction",
        "--quick",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        "--result-file",
        backupPath,
        config.database,
      ], { encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
      if (result.error?.code === "ENOENT") {
        lastError = result.error;
        continue;
      }
      if (result.error) throw result.error;
      if (result.status !== 0) {
        const message = (result.stderr || result.stdout || `exit ${result.status}`).trim();
        throw new Error(`فشل النسخ الاحتياطي عبر ${command}: ${message}`);
      }
      if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size < 1024) {
        throw new Error("أُبلغ عن نجاح النسخ لكن ملف النسخة الاحتياطية غير مكتمل.");
      }
      try { fs.chmodSync(backupPath, 0o600); } catch {}
      return backupPath;
    }
    throw new Error(`لم يُعثر على mysqldump أو mariadb-dump في PATH.${lastError ? ` ${lastError.message}` : ""}`);
  } finally {
    try { fs.unlinkSync(optionFile); } catch {}
  }
}

function restoreBackup(config, backupPath) {
  const optionFile = path.join(os.tmpdir(), `drive-restore-${process.pid}-${Date.now()}.cnf`);
  const optionText = [
    "[client]",
    `host=${mysqlOption(config.host)}`,
    `port=${config.port}`,
    `user=${mysqlOption(config.user)}`,
    `password=${mysqlOption(config.password)}`,
    "protocol=TCP",
    "default-character-set=utf8mb4",
    "",
  ].join("\n");
  fs.writeFileSync(optionFile, optionText, { mode: 0o600, flag: "wx" });
  try {
    const dump = fs.readFileSync(backupPath);
    let lastError = null;
    for (const command of ["mysql", "mariadb"]) {
      const result = spawnSync(command, [
        `--defaults-extra-file=${optionFile}`,
        config.database,
      ], { input: dump, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
      if (result.error?.code === "ENOENT") {
        lastError = result.error;
        continue;
      }
      if (result.error) throw result.error;
      if (result.status !== 0) {
        throw new Error((result.stderr || result.stdout || `exit ${result.status}`).trim());
      }
      return;
    }
    throw new Error(`لم يُعثر على mysql أو mariadb لاستعادة النسخة.${lastError ? ` ${lastError.message}` : ""}`);
  } finally {
    try { fs.unlinkSync(optionFile); } catch {}
  }
}

async function askConfirmation(databaseName, backupPath, report, noBackup = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (noBackup) {
      console.log("\nتحذير نهائي: طلبت تنفيذ الاستبدال بلا نسخة احتياطية؛ لا توجد استعادة آلية عند الفشل.");
    } else {
      console.log(`\nتم حفظ نسخة كاملة قبل التغيير: ${backupPath}`);
    }
    console.log(`سيُستبدل محتوى الجداول التشغيلية التالية: ${REPLACED_TABLES.join(", ")}`);
    console.log(`ستُحفظ جداول النظام التالية: ${PRESERVED_TABLES.join(", ")}`);
    console.log(`سيُسجل كتجاوز ${report.skips.totalDetailsSkipped} بندًا معتمدًا سابقًا و${report.approvedAdditionalSkips?.totalIssues ?? 0} مشكلة إضافية، مع استبعاد ${report.approvedAdditionalSkips?.memoDetailsSkipped ?? 0} بند مذكرة و${report.approvedAdditionalSkips?.balanceRowsSkipped ?? 0} صف رصيد.`);
    const expected = noBackup ? `REPLACE WITHOUT BACKUP ${databaseName}` : `REPLACE ${databaseName}`;
    const answer = (await rl.question(`للتأكيد اكتب ${expected}: `)).trim();
    return answer === expected;
  } finally {
    rl.close();
  }
}

function chunks(rows, size = batchSize) {
  const groups = [];
  for (let index = 0; index < rows.length; index += size) groups.push(rows.slice(index, index + size));
  return groups;
}

async function insertRows(connection, table, columns, rows) {
  if (!rows.length) return;
  const quotedTable = `\`${table}\``;
  const quotedColumns = columns.map(column => `\`${column}\``).join(",");
  for (const group of chunks(rows)) {
    const rowPlaceholder = `(${columns.map(() => "?").join(",")})`;
    const placeholders = group.map(() => rowPlaceholder).join(",");
    const values = group.flatMap(row => columns.map(column => row[column]));
    await connection.execute(`INSERT INTO ${quotedTable} (${quotedColumns}) VALUES ${placeholders}`, values);
  }
}

function asSqlDate(isoDate) {
  if (!isoDate) return null;
  return `${isoDate} 00:00:00`;
}

async function clearReplacedData(connection) {
  await connection.beginTransaction();
  try {
    await connection.query("DELETE FROM memoReconciliations");
    await connection.query("DELETE FROM stockMovements");
    await connection.query("DELETE FROM memoItems");
    await connection.query("DELETE FROM memos");
    await connection.query("DELETE FROM inventoryBalances");
    await connection.query("DELETE FROM materials");
    await connection.query("DELETE FROM parties");
    await connection.commit();
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  }
}

async function ensureEmptyTableIdKey(connection, table) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'id'`);
  const idColumn = columns[0];
  if (!idColumn) throw new Error(`الجدول ${table} لا يحتوي عمود id.`);
  const [indexes] = await connection.query(`SHOW INDEX FROM \`${table}\``);
  const primaryColumns = indexes
    .filter(index => index.Key_name === "PRIMARY")
    .sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index))
    .map(index => String(index.Column_name));
  if (primaryColumns.length && (primaryColumns.length !== 1 || primaryColumns[0] !== "id")) {
    throw new Error(`مفتاح PRIMARY في ${table} ليس id وحده؛ تم إيقاف الإصلاح التلقائي.`);
  }
  const hasAutoIncrement = String(idColumn.Extra ?? "").toLowerCase().includes("auto_increment");
  if (hasAutoIncrement && primaryColumns.length === 1) return false;
  const type = String(idColumn.Type ?? "int(11)");
  const modify = `MODIFY COLUMN \`id\` ${type} NOT NULL AUTO_INCREMENT`;
  if (primaryColumns.length === 1) {
    await connection.query(`ALTER TABLE \`${table}\` ${modify}`);
  } else {
    await connection.query(`ALTER TABLE \`${table}\` ${modify}, ADD PRIMARY KEY (\`id\`)`);
  }
  return true;
}

async function prepareReplacedTableKeys(connection) {
  const changed = [];
  for (const table of ["parties", "materials", "memos", "memoItems", "stockMovements", "inventoryBalances"]) {
    if (await ensureEmptyTableIdKey(connection, table)) changed.push(table);
  }
  return changed;
}

async function nextExplicitId(connection, table) {
  const [[row]] = await connection.query(`SELECT COALESCE(MAX(\`id\`),0) + 1 AS nextId FROM \`${table}\``);
  const nextId = Number(row?.nextId);
  if (!Number.isSafeInteger(nextId) || nextId <= 0 || nextId > 2_147_483_647) {
    throw new Error(`تعذر توليد id جديد وآمن في الجدول المحفوظ ${table}.`);
  }
  return nextId;
}

async function syncSourceWarehouses(connection, plan) {
  const [existingRows] = await connection.query("SELECT id FROM warehouses");
  const existingIds = existingRows.map(row => Number(row.id));
  const counts = new Map();
  for (const id of existingIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const invalidIds = [...counts.entries()].filter(([id, count]) => !Number.isInteger(id) || id <= 0 || count > 1);
  if (invalidIds.length) {
    throw new Error("جدول warehouses يحتوي id غير موجب أو مكرر؛ أوقف الاستيراد قبل الحذف ولا تحذف المستودعات.");
  }
  let nextId = Math.max(0, ...existingIds) + 1;
  if (!Number.isSafeInteger(nextId) || nextId > 2_147_483_647) {
    throw new Error("لا يوجد مجال id صحيح لإضافة مستودع مصدر جديد.");
  }

  const idBySourceCode = new Map();
  const codeByResolvedId = new Map();
  for (const warehouse of plan.warehouses) {
    const code = String(warehouse.code ?? "");
    if (!code) throw new Error("يوجد مستودع مصدر بلا كود؛ أُوقف الاستيراد.");
    const [matches] = await connection.execute("SELECT id FROM warehouses WHERE code = ? ORDER BY id", [code]);
    if (matches.length > 1) {
      throw new Error(`كود المستودع ${code} يطابق أكثر من سجل حالي؛ أُوقف الاستيراد قبل الحذف.`);
    }

    let id;
    if (matches.length === 1) {
      id = Number(matches[0].id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`كود المستودع ${code} مرتبط بمعرّف غير موجب؛ أُوقف الاستيراد قبل الحذف.`);
      }
      await connection.execute("UPDATE warehouses SET code = ?, name = ?, isActive = 1 WHERE id = ?", [code, warehouse.name, id]);
    } else {
      if (nextId > 2_147_483_647) throw new Error(`تجاوز id الحد المسموح عند إضافة المستودع ${code}.`);
      id = nextId++;
      await connection.execute("INSERT INTO warehouses (id,code,name,isActive) VALUES (?,?,?,1)", [id, code, warehouse.name]);
    }

    const priorCode = codeByResolvedId.get(id);
    if (priorCode && priorCode !== code) {
      throw new Error(`كودا المستودع ${priorCode} و${code} يطابقان المعرّف نفسه؛ أُوقف الاستيراد قبل الحذف.`);
    }
    codeByResolvedId.set(id, code);
    idBySourceCode.set(code, id);
  }
  return idBySourceCode;
}

async function validateWarehouseMappings(connection, plan) {
  await connection.beginTransaction();
  try {
    const idByCode = await syncSourceWarehouses(connection, plan);
    const referencedCodes = [...new Set([
      ...plan.memos.map(row => String(row.warehouseCode ?? "")),
      ...plan.items.map(row => String(row.warehouseCode ?? "")),
      ...plan.balances.map(row => String(row.warehouseCode ?? "")),
    ])];
    const missing = referencedCodes.filter(code => !idByCode.has(code));
    if (missing.length) {
      throw new Error(`فشل فحص ربط أكواد المستودعات قبل الحذف: ${missing.join(", ")}. لم تُحذف الجداول التشغيلية.`);
    }
    await connection.rollback();
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  }
}

async function replaceData(connection, plan, actorId) {
  await connection.beginTransaction();
  try {
    // Existing warehouse IDs remain untouched; new rows receive explicit IDs above MAX(id).
    const warehouseIdByCode = await syncSourceWarehouses(connection, plan);
    await insertRows(connection, "parties", ["legacyNumber", "name", "type", "phone", "address", "isActive"], plan.parties.map(row => ({ ...row, isActive: 1 })));
    await insertRows(connection, "materials", ["code", "name", "description", "unit", "barcode", "minimumStock", "isActive"], plan.materials.map(row => ({ ...row, isActive: 1 })));

    const [newPartyRows] = await connection.query("SELECT id,legacyNumber FROM parties");
    const partyIdByNumber = new Map(newPartyRows.map(row => [String(row.legacyNumber), Number(row.id)]));
    const [newMaterialRows] = await connection.query("SELECT id,code FROM materials");
    const materialIdByCode = new Map(newMaterialRows.map(row => [String(row.code), Number(row.id)]));

    const memoRows = plan.memos.map(row => ({
      type: row.type,
      memoNumber: row.memoNumber,
      sourceMemoNumber: row.sourceNumber,
      status: "approved",
      warehouseId: warehouseIdByCode.get(row.warehouseCode),
      partyId: row.partyLegacyNumber ? partyIdByNumber.get(String(row.partyLegacyNumber)) ?? null : null,
      folderNumber: row.folderNumber,
      orderNumber: row.orderNumber,
      orderDate: asSqlDate(row.orderDate),
      invoiceNumber: row.invoiceNumber,
      invoiceDate: asSqlDate(row.invoiceDate),
      referenceNumber: row.referenceNumber,
      memoDate: asSqlDate(row.date),
      notes: row.notes,
      createdBy: actorId,
    }));
    if (memoRows.some(row => !row.warehouseId)) throw new Error("تعذر ربط مستودع برأس مذكرة بعد إدخال المستودعات.");
    if (memoRows.some(row => row.partyId === null)) throw new Error("تعذر ربط جهة بأحد رؤوس المذكرات.");
    await insertRows(connection, "memos", ["type", "memoNumber", "sourceMemoNumber", "status", "warehouseId", "partyId", "folderNumber", "orderNumber", "orderDate", "invoiceNumber", "invoiceDate", "referenceNumber", "memoDate", "notes", "createdBy"], memoRows);

    const [newMemoRows] = await connection.query("SELECT id,type,memoNumber,warehouseId,partyId,memoDate FROM memos");
    const memoIdByKey = new Map(newMemoRows.map(row => [`${row.type}|${row.memoNumber}`, Number(row.id)]));

    const balanceRows = plan.balances.map(row => ({
      materialId: materialIdByCode.get(row.materialCode),
      warehouseId: warehouseIdByCode.get(row.warehouseCode),
      partyId: null,
      openingQuantity: row.openingQuantity,
      onHandQuantity: row.onHandQuantity,
      reservedQuantity: row.reservedQuantity,
    }));
    if (balanceRows.some(row => !row.materialId || !row.warehouseId)) throw new Error("تعذر ربط أحد أرصدة المواد بعد الاستيراد.");
    await insertRows(connection, "inventoryBalances", ["materialId", "warehouseId", "partyId", "openingQuantity", "onHandQuantity", "reservedQuantity"], balanceRows);

    const memoItemRows = [];
    const movementRows = [];
    for (const item of plan.items) {
      const memoId = memoIdByKey.get(`${item.type}|${item.memoNumber}`);
      const materialId = materialIdByCode.get(item.materialCode);
      const warehouseId = warehouseIdByCode.get(item.warehouseCode);
      const partyId = item.partyLegacyNumber ? partyIdByNumber.get(String(item.partyLegacyNumber)) ?? null : null;
      if (!memoId || !materialId || !warehouseId || !partyId) throw new Error("تعذر ربط أحد بنود المذكرات بعد الاستيراد.");
      memoItemRows.push({ memoId, materialId, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes });
      movementRows.push({
        materialId,
        warehouseId,
        partyId,
        memoId,
        memoItemId: null,
        movementType: item.type,
        quantityIn: item.type === "inbound" ? item.quantity : "0",
        quantityOut: item.type === "outbound" ? item.quantity : "0",
        occurredAt: asSqlDate(item.memoDate),
        createdBy: actorId,
      });
    }
    await insertRows(connection, "memoItems", ["memoId", "materialId", "quantity", "unitPrice", "notes"], memoItemRows);
    await insertRows(connection, "stockMovements", ["materialId", "warehouseId", "partyId", "memoId", "memoItemId", "movementType", "quantityIn", "quantityOut", "occurredAt", "createdBy"], movementRows);

    const extraSkips = plan.report.approvedAdditionalSkips;
    const skippedSummary = [
      `سطور تفاصيل معتمدة التجاوز سابقًا: ${plan.report.skips.ambiguousMemoDetails} ملتبسة + ${plan.report.skips.missingQuantityDetails} كمية فارغة = ${plan.report.skips.totalDetailsSkipped}`,
      `تجاوزات هذه العملية: ${extraSkips?.materialIdentitiesSkipped ?? 0} هويات مواد ملتبسة، ${extraSkips?.memoDetailsSkipped ?? 0} بند مذكرة غير مربوط، ${extraSkips?.counts?.unresolved_balance_scope ?? 0} رصيد غير مربوط، ${extraSkips?.counts?.duplicate_balance_scope ?? 0} رصيد مكرر النطاق`,
    ].join("؛ ");
    const importedCount = plan.parties.length + plan.materials.length + plan.balances.length + plan.memos.length + memoItemRows.length + movementRows.length;
    // importBatches may contain historical duplicate/zero IDs and is preserved.
    // Allocate a fresh explicit ID without renumbering any legacy rows.
    const batchId = await nextExplicitId(connection, "importBatches");
    await connection.execute(
      "INSERT INTO importBatches (id,category,originalFilename,status,totalRows,importedRows,errorSummary,createdBy,completedAt) VALUES (?,?,?,?,?,?,?,?,NOW())",
      [batchId, "memos", "Drive legacy replacement bundle", "imported", Object.values(plan.report.sourceCounts).reduce((sum, value) => sum + value, 0), importedCount, skippedSummary, actorId],
    );
    const auditDetails = `استبدال بيانات Drive ضمن النطاق التشغيلي؛ ${skippedSummary} جداول النظام والمستخدمين والمالية محفوظة.`;
    const auditId = await nextExplicitId(connection, "adminAuditLogs");
    await connection.execute(
      "INSERT INTO adminAuditLogs (id,actorId,action,entityType,entityId,entityLabel,details) VALUES (?,?,?,?,?,?,?)",
      [auditId, actorId, "import_committed", "import_batch", batchId, "Drive legacy replacement bundle", auditDetails],
    );

    await connection.commit();
    return {
      batchId,
      imported: {
        warehouses: plan.warehouses.length,
        parties: plan.parties.length,
        materials: plan.materials.length,
        derivedMaterials: plan.report.planned.derivedMaterials,
        balances: balanceRows.length,
        memos: memoRows.length,
        memoItems: memoItemRows.length,
        stockMovements: movementRows.length,
      },
      skipped: plan.report.skips.totalDetailsSkipped,
      approvedAdditionalSkips: extraSkips,
    };
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  }
}

async function main() {
  if (args.length && args[0] === "--help") return help();
  if (noBackupMode && mode !== "replace") {
    throw new Error("الخيار --no-backup لا يعمل إلا مع --replace.");
  }
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`مجلد المصدر غير موجود: ${sourceDir}`);
  }
  const plan = buildDriveImportPlan({ sourceDir });
  const report = sanitizedReport(plan);
  if (flag("--skip-known-213")) applyKnownSkipPolicy(plan, report);
  console.log(JSON.stringify(summary(report), null, 2));
  printBlockers(report.blockers);
  if (report.blockers.length) {
    if (mode === "replace") throw new Error("توقف التنفيذ: أصلح مشكلات المعاينة قبل الاستبدال.");
    const previewPath = path.resolve(reportArgument ?? "./drive-import-preflight.json");
    fs.writeFileSync(previewPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.error(`حُفظ تقرير المعاينة: ${previewPath}`);
    process.exitCode = 1;
    return;
  }

  if (mode === "preview") {
    const previewPath = path.resolve(reportArgument ?? "./drive-import-preflight.json");
    fs.writeFileSync(previewPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(`\nالمعاينة جاهزة، ولم تُفتح أي قاعدة بيانات. تقرير JSON: ${previewPath}`);
    return;
  }

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL غير موجود في .env أو متغيرات البيئة.");
  const config = databaseConfig(process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "::1"].includes(config.host) && !flag("--allow-remote")) {
    throw new Error(`قاعدة البيانات ليست محلية (${config.host}). أوقف التنفيذ؛ لا تستخدم --allow-remote إلا بعد مراجعة الهدف.`);
  }
  const connection = await mysql.createConnection(config);
  let backupPath = null;
  let reportPath = null;
  let replacementStarted = false;
  try {
    const [[dbRow]] = await connection.query("SELECT DATABASE() AS databaseName");
    const databaseName = String(dbRow.databaseName ?? "");
    if (databaseName !== config.database) throw new Error("اسم قاعدة البيانات الفعلي لا يطابق DATABASE_URL.");
    const requiredTables = [...new Set([...REPLACED_TABLES, "warehouses", "importBatches", "adminAuditLogs"])];
    const [tableRows] = await connection.query(
      "SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()"
    );
    const tableByName = new Map(tableRows.map(row => [
      String(row.TABLE_NAME).toLowerCase(),
      { actualName: String(row.TABLE_NAME), engine: String(row.ENGINE ?? "").toUpperCase() },
    ]));
    const missingTables = requiredTables.filter(table => !tableByName.has(table.toLowerCase()));
    const nonInnoDbTables = requiredTables
      .filter(table => tableByName.has(table.toLowerCase()))
      .filter(table => tableByName.get(table.toLowerCase()).engine !== "INNODB")
      .map(table => `${table} (${tableByName.get(table.toLowerCase()).engine || "unknown"})`);
    if (missingTables.length || nonInnoDbTables.length) {
      throw new Error(
        `فحص محركات الجداول لم ينجح. جداول مفقودة: ${missingTables.join(", ") || "لا يوجد"}. ` +
        `جداول موجودة لكن محركها ليس InnoDB: ${nonInnoDbTables.join(", ") || "لا يوجد"}. ` +
        "لم يُجرَ حذف أو تعديل للبيانات."
      );
    }
    const [[admin]] = await connection.query("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    if (!admin) throw new Error("لا يوجد مستخدم مدير لاستخدامه في createdBy؛ لم تُجرَ أي كتابة.");
    await validateWarehouseMappings(connection, plan);

    if (!noBackupMode) backupPath = makeBackup(config, backupDir);
    reportPath = path.resolve(reportArgument ?? path.join(backupDir, `drive-replace-report-${timestampSlug()}.json`));
    // Validate the report destination before any destructive table clearing.
    fs.mkdirSync(path.dirname(reportPath), { recursive: true, mode: 0o700 });
    fs.accessSync(path.dirname(reportPath), fs.constants.W_OK);
    const confirmed = await askConfirmation(databaseName, backupPath, report, noBackupMode);
    if (!confirmed) {
      console.log(noBackupMode
        ? "أُلغي الاستبدال؛ لم تُعدّل قاعدة البيانات."
        : "أُلغي الاستبدال؛ لم تُعدّل قاعدة البيانات. بقيت النسخة الاحتياطية كما هي.");
      return;
    }

    replacementStarted = true;
    await clearReplacedData(connection);
    const repairedIdTables = await prepareReplacedTableKeys(connection);
    const execution = await replaceData(connection, plan, Number(admin.id));
    report.status = "completed";
    report.execution = { databaseName, backupPath, backupSkipped: noBackupMode, completedAt: new Date().toISOString(), repairedIdTables, ...execution };
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    } catch (reportError) {
      console.warn(`تم الاستيراد بنجاح لكن تعذرت كتابة التقرير (${reportPath}): ${String(reportError?.message ?? reportError)}`);
    }
    console.log(`\nاكتمل الاستبدال في قاعدة ${databaseName}.`);
    if (backupPath) console.log(`النسخة الاحتياطية الكاملة: ${backupPath}`);
    else console.log("تنبيه: لم تُنشأ نسخة احتياطية حسب الخيار الصريح.");
    console.log(`تقرير التجاوزات والاستيراد: ${reportPath}`);
  } catch (error) {
    let recovery = replacementStarted && noBackupMode ? "no_backup_no_rollback" : "not_needed";
    if (replacementStarted && backupPath) {
      try {
        restoreBackup(config, backupPath);
        recovery = "backup_restored";
      } catch (restoreError) {
        recovery = `restore_failed: ${String(restoreError?.message ?? restoreError)}`;
      }
    }
    if (reportPath) {
      report.status = "failed";
      report.failure = { message: String(error?.message ?? error), backupPath, recovery };
      try {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true, mode: 0o700 });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
      } catch {}
    }
    if (recovery === "backup_restored") {
      throw new Error(`${String(error?.message ?? error)} تمت استعادة قاعدة البيانات من النسخة: ${backupPath}`);
    }
    if (recovery === "no_backup_no_rollback") {
      throw new Error(`${String(error?.message ?? error)} بدأت العملية بلا نسخة احتياطية؛ قد تكون جداول التشغيل فارغة أو جزئية. لا تعاود التشغيل قبل مراجعة قاعدة البيانات يدويًا.`);
    }
    if (recovery.startsWith("restore_failed")) {
      throw new Error(`${String(error?.message ?? error)} وتعذرت الاستعادة الآلية (${recovery}). احتفظ بنسخة ${backupPath} ولا تتابع تشغيل النظام قبل استعادتها يدويًا.`);
    }
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(`\nفشل التنفيذ: ${String(error?.message ?? error)}`);
  process.exitCode = 1;
});
