import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import mysql from "mysql2/promise";
import { buildDriveImportPlan, normalizeName } from "./driveImportCore.mjs";

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => {
  const index = args.findIndex(value => value === name);
  return index >= 0 ? args[index + 1] : null;
};
const sourceDir = path.resolve(option("--source-dir") ?? "C:/CCW_db_source_files");
const isApply = flag("--apply");
const approvedIssueCounts = Object.freeze({
  ambiguous_legacy_material_identity: 32,
  unresolved_detail_material: 128,
  unresolved_balance_scope: 35,
  duplicate_balance_scope: 18,
});

function databaseConfig(databaseUrl) {
  let url;
  try { url = new URL(databaseUrl); }
  catch { throw new Error("DATABASE_URL غير صالح؛ المتوقع mysql://user:password@host:port/database."); }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database || !["mysql:", "mysql2:"].includes(url.protocol)) throw new Error("DATABASE_URL يجب أن يحدد قاعدة MySQL.");
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

function validateKnownSourceIssues(plan) {
  const observed = Object.fromEntries(Object.keys(approvedIssueCounts).map(code => [
    code,
    plan.report.blockers.filter(item => item.code === code).length,
  ]));
  const unknown = plan.report.blockers.filter(item => !Object.hasOwn(approvedIssueCounts, item.code));
  const changed = Object.entries(approvedIssueCounts).filter(([code, expected]) => observed[code] !== expected);
  if (unknown.length || changed.length) {
    throw new Error(`حواجز المصدر تغيرت؛ unknown=${unknown.length}; countChanges=${changed.map(([c,e]) => `${c}:${observed[c]}/${e}`).join(",")}.`);
  }
}

async function askExactConfirmation(databaseName) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`للتطبيق اكتب REPAIR IMPORTED DATA ${databaseName}: `);
    return answer.trim() === `REPAIR IMPORTED DATA ${databaseName}`;
  } finally {
    rl.close();
  }
}

async function main() {
  if (!fs.existsSync(sourceDir)) throw new Error(`مجلد المصدر غير موجود: ${sourceDir}`);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL غير موجود في .env.");
  const plan = buildDriveImportPlan({ sourceDir });
  validateKnownSourceIssues(plan);
  if (plan.warehouses.length !== 26) throw new Error(`المتوقع 26 مستودعًا فعليًا، الموجود ${plan.warehouses.length}. أوقف الإصلاح.`);
  const config = databaseConfig(process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "::1"].includes(config.host)) throw new Error(`قاعدة البيانات ليست محلية (${config.host})؛ أوقف الإصلاح.`);

  const connection = await mysql.createConnection(config);
  try {
    const [[dbRow]] = await connection.query("SELECT DATABASE() AS databaseName");
    const databaseName = String(dbRow.databaseName ?? "");
    const required = ["memos", "warehouses", "userwarehouses", "financialEntries", "inventoryBalances", "stockMovements"];
    const [tableRows] = await connection.query("SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()");
    const tableByName = new Map(tableRows.map(row => [String(row.TABLE_NAME).toLowerCase(), row]));
    const missingTables = required.filter(name => !tableByName.has(name.toLowerCase()));
    const nonInnoDb = required.filter(name => tableByName.has(name.toLowerCase()) && String(tableByName.get(name.toLowerCase()).ENGINE).toUpperCase() !== "INNODB");
    if (missingTables.length || nonInnoDb.length) throw new Error(`جداول مفقودة/غير InnoDB: missing=${missingTables.join(",")}; nonInnoDB=${nonInnoDb.join(",")}.`);

    const [sourceColumn] = await connection.query("SHOW COLUMNS FROM memos LIKE 'sourceMemoNumber'");
    if (!sourceColumn.length) throw new Error("عمود sourceMemoNumber غير موجود؛ نفّذ SQL الموجود في drizzle/0002_add_source_memo_number.sql أولًا.");

    const [dbMemos] = await connection.query("SELECT id,type,memoNumber,sourceMemoNumber FROM memos ORDER BY id");
    const dbMemoByKey = new Map();
    for (const row of dbMemos) {
      const key = `${row.type}\u0000${row.memoNumber}`;
      if (dbMemoByKey.has(key)) throw new Error(`مفتاح مذكرة مكرر: ${row.type}/${row.memoNumber}.`);
      dbMemoByKey.set(key, row);
    }
    const memoUpdates = [];
    const absentMemos = [];
    for (const sourceMemo of plan.memos) {
      const current = dbMemoByKey.get(`${sourceMemo.type}\u0000${sourceMemo.memoNumber}`);
      if (!current) absentMemos.push({ type: sourceMemo.type, memoNumber: sourceMemo.memoNumber });
      else if (String(current.sourceMemoNumber ?? "") !== String(sourceMemo.sourceNumber)) {
        memoUpdates.push({ id: Number(current.id), type: sourceMemo.type, memoNumber: sourceMemo.memoNumber, sourceMemoNumber: sourceMemo.sourceNumber });
      }
    }
    if (absentMemos.length) throw new Error(`تعذر مطابقة ${absentMemos.length} مذكرة مع ملفات المصدر؛ لم يُجرَ أي تعديل.`);

    const [warehouseRows] = await connection.query("SELECT id,code,name,isActive FROM warehouses ORDER BY id");
    const sourceByCode = new Map(plan.warehouses.map(row => [String(row.code), row]));
    const dbByCode = new Map();
    for (const row of warehouseRows) {
      const code = String(row.code ?? "");
      if (dbByCode.has(code)) throw new Error(`كود مستودع مكرر: ${code}.`);
      dbByCode.set(code, row);
    }
    const missingSourceCodes = [...sourceByCode.keys()].filter(code => !dbByCode.has(code));
    if (missingSourceCodes.length) throw new Error(`أكواد المستودعات المصدرية غير موجودة في القاعدة: ${missingSourceCodes.join(", ")}.`);

    const officialRows = [...sourceByCode.keys()].map(code => dbByCode.get(code));
    const officialNameToIds = new Map();
    for (const row of officialRows) {
      const key = normalizeName(row.name);
      const ids = officialNameToIds.get(key) ?? [];
      ids.push(Number(row.id));
      officialNameToIds.set(key, ids);
    }

    const extraRows = warehouseRows.filter(row => !sourceByCode.has(String(row.code ?? "")));
    const extras = [];
    const blockers = [];
    for (const row of extraRows) {
      const candidates = officialNameToIds.get(normalizeName(row.name)) ?? [];
      const targetId = candidates.length === 1 ? candidates[0] : null;
      const [counts] = await connection.execute(
        `SELECT
          (SELECT COUNT(*) FROM userwarehouses uw JOIN users u ON u.id=uw.userId WHERE uw.warehouseId=? AND u.role<>'admin') AS userAssignments,
          (SELECT COUNT(*) FROM userwarehouses uw JOIN users u ON u.id=uw.userId WHERE uw.warehouseId=? AND u.role='admin') AS adminAssignments,
          (SELECT COUNT(*) FROM financialEntries WHERE warehouseId=?) AS financialEntries,
          (SELECT COUNT(*) FROM memos WHERE warehouseId=?) AS memos,
          (SELECT COUNT(*) FROM inventoryBalances WHERE warehouseId=?) AS balances,
          (SELECT COUNT(*) FROM stockMovements WHERE warehouseId=?) AS movements`,
        [row.id, row.id, row.id, row.id, row.id, row.id],
      );
      const refs = Object.fromEntries(Object.entries(counts[0]).map(([key, value]) => [key, Number(value)]));
      const totalRefs = Object.values(refs).reduce((sum, value) => sum + value, 0);
      const blockingRefs = totalRefs - refs.adminAssignments;
      const mapping = candidates.length === 1
        ? "exact-name"
        : candidates.length > 1
          ? "ambiguous-name"
          : blockingRefs
            ? "unmapped-referenced"
            : refs.adminAssignments
              ? "admin-assignment-delete"
              : "unreferenced-delete";
      const extra = { id: Number(row.id), code: String(row.code), name: String(row.name), refs, totalRefs, blockingRefs, targetId, mapping };
      extras.push(extra);
      if (blockingRefs && !targetId) blockers.push(extra);
    }

    const financeConflicts = [];
    const balanceConflicts = [];
    for (const mapping of extras.filter(row => row.targetId)) {
      const [financial] = await connection.execute(
        "SELECT old.entryNumber FROM financialEntries old JOIN financialEntries target ON target.entryNumber=old.entryNumber AND target.warehouseId=? WHERE old.warehouseId=? LIMIT 20",
        [mapping.targetId, mapping.id],
      );
      if (financial.length) financeConflicts.push({ oldWarehouseId: mapping.id, targetWarehouseId: mapping.targetId, entryNumbers: financial.map(row => row.entryNumber) });
      const [balances] = await connection.execute("SELECT materialId,partyId FROM inventoryBalances WHERE warehouseId=?", [mapping.id]);
      for (const balance of balances) {
        const [existing] = await connection.execute(
          "SELECT id FROM inventoryBalances WHERE materialId=? AND warehouseId=? AND partyId <=> ? LIMIT 1",
          [balance.materialId, mapping.targetId, balance.partyId],
        );
        if (existing.length) balanceConflicts.push({ oldWarehouseId: mapping.id, targetWarehouseId: mapping.targetId, materialId: Number(balance.materialId), partyId: balance.partyId === null ? null : Number(balance.partyId) });
      }
    }
    const allBlockers = [
      ...blockers,
      ...financeConflicts.map(row => ({ mapping: "financial-unique-conflict", ...row })),
      ...balanceConflicts.map(row => ({ mapping: "balance-unique-conflict", ...row })),
    ];
    const result = {
      mode: isApply ? "apply" : "preview",
      databaseName,
      sourceWarehouses: plan.warehouses.length,
      currentWarehouses: warehouseRows.length,
      expectedAfterRepair: plan.warehouses.length,
      importedMemos: dbMemos.length,
      sourceMemoNumbersToBackfill: memoUpdates.length,
      missingMemos: absentMemos.length,
      extraWarehouses: extras,
      blockers: allBlockers,
      canApply: allBlockers.length === 0 && absentMemos.length === 0,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!isApply) {
      console.log("\nمعاينة فقط؛ لم يتم تعديل قاعدة البيانات. راجع الخريطة قبل تمرير --apply.");
      return;
    }
    if (allBlockers.length || absentMemos.length) throw new Error("توجد روابط غير قابلة للربط أو تصادمات؛ لم يبدأ التطبيق.");
    if (!await askExactConfirmation(databaseName)) throw new Error("لم تتطابق عبارة التأكيد؛ لم يبدأ التطبيق.");

    const snapshotDir = path.resolve("./backups");
    fs.mkdirSync(snapshotDir, { recursive: true, mode: 0o700 });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const snapshotPath = path.join(snapshotDir, `repair-drive-metadata-${stamp}.json`);
    const [userWarehouseRows] = await connection.query("SELECT * FROM userwarehouses");
    const [financialRows] = await connection.query("SELECT * FROM financialEntries");
    const [memoSnapshot] = await connection.query("SELECT id,type,memoNumber,sourceMemoNumber,warehouseId FROM memos");
    const [balanceRows] = await connection.query("SELECT * FROM inventoryBalances");
    const [movementRows] = await connection.query("SELECT * FROM stockMovements");
    fs.writeFileSync(snapshotPath, JSON.stringify({ createdAt: new Date().toISOString(), databaseName, warehouses: warehouseRows, userwarehouses: userWarehouseRows, financialEntries: financialRows, memos: memoSnapshot, inventoryBalances: balanceRows, stockMovements: movementRows }, null, 2), { mode: 0o600 });

    await connection.beginTransaction();
    try {
      for (const update of memoUpdates) await connection.execute("UPDATE memos SET sourceMemoNumber=? WHERE id=?", [update.sourceMemoNumber, update.id]);
      for (const mapping of extras.filter(row => row.targetId)) {
        const [assignments] = await connection.execute("SELECT id,userId FROM userwarehouses WHERE warehouseId=?", [mapping.id]);
        for (const assignment of assignments) {
          const [duplicate] = await connection.execute("SELECT id FROM userwarehouses WHERE userId=? AND warehouseId=? LIMIT 1", [assignment.userId, mapping.targetId]);
          if (duplicate.length) await connection.execute("DELETE FROM userwarehouses WHERE id=?", [assignment.id]);
          else await connection.execute("UPDATE userwarehouses SET warehouseId=? WHERE id=?", [mapping.targetId, assignment.id]);
        }
        for (const table of ["financialEntries", "memos", "inventoryBalances", "stockMovements"]) {
          await connection.execute(`UPDATE \`${table}\` SET warehouseId=? WHERE warehouseId=?`, [mapping.targetId, mapping.id]);
        }
      }
      for (const extra of extras) {
        if (!extra.targetId && extra.refs.adminAssignments) {
          // Admin permissions are global; this legacy association is not needed for access.
          // Remove only the user-warehouse link, never the admin account.
          await connection.execute(
            "DELETE uw FROM userwarehouses uw JOIN users u ON u.id=uw.userId WHERE uw.warehouseId=? AND u.role='admin'",
            [extra.id],
          );
        }
        const [remaining] = await connection.execute(
          `SELECT
            (SELECT COUNT(*) FROM userwarehouses WHERE warehouseId=?) +
            (SELECT COUNT(*) FROM financialEntries WHERE warehouseId=?) +
            (SELECT COUNT(*) FROM memos WHERE warehouseId=?) +
            (SELECT COUNT(*) FROM inventoryBalances WHERE warehouseId=?) +
            (SELECT COUNT(*) FROM stockMovements WHERE warehouseId=?) AS count`,
          [extra.id, extra.id, extra.id, extra.id, extra.id],
        );
        if (Number(remaining[0].count) !== 0) throw new Error(`بقيت مراجع على المستودع id=${extra.id}؛ تم التراجع عن المعاملة.`);
        await connection.execute("DELETE FROM warehouses WHERE id=?", [extra.id]);
      }
      const [after] = await connection.query("SELECT COUNT(*) AS count FROM warehouses");
      if (Number(after[0].count) !== plan.warehouses.length) throw new Error(`العدد بعد التنظيف ${after[0].count} وليس ${plan.warehouses.length}؛ تم التراجع.`);
      await connection.commit();
    } catch (error) {
      try { await connection.rollback(); } catch {}
      throw error;
    }
    console.log(`\nاكتمل الإصلاح. عدد المستودعات ${plan.warehouses.length}. نسخة JSON للصفوف قبل التعديل: ${snapshotPath}`);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(`\nفشل الإصلاح: ${error?.message ?? error}`);
  process.exitCode = 1;
});
