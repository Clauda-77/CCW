import fs from "node:fs/promises";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is unavailable");

const payload = JSON.parse(await fs.readFile("/home/ubuntu/upload/legacy-normalized-import.json", "utf8"));
const foundation = JSON.parse(await fs.readFile("/home/ubuntu/upload/legacy-foundation-diff.json", "utf8"));
const provenance = JSON.parse(await fs.readFile("/home/ubuntu/upload/legacy-extra-material-provenance.json", "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [counts] = await connection.query(`
  SELECT
    (SELECT COUNT(*) FROM warehouses) AS warehouses,
    (SELECT COUNT(*) FROM parties) AS parties,
    (SELECT COUNT(*) FROM materials) AS materials,
    (SELECT COUNT(*) FROM inventoryBalances) AS balances,
    (SELECT COUNT(*) FROM memos) AS memos,
    (SELECT COUNT(*) FROM memoItems) AS memoItems,
    (SELECT COUNT(*) FROM stockMovements) AS stockMovements,
    (SELECT COUNT(*) FROM memos m LEFT JOIN memoItems mi ON mi.memoId = m.id WHERE mi.id IS NULL) AS memosWithoutItems,
    (SELECT COUNT(*) FROM inventoryBalances b LEFT JOIN materials m ON m.id = b.materialId WHERE m.id IS NULL) AS invalidBalanceMaterials,
    (SELECT COUNT(*) FROM inventoryBalances b LEFT JOIN warehouses w ON w.id = b.warehouseId WHERE w.id IS NULL) AS invalidBalanceWarehouses,
    (SELECT COUNT(*) FROM memoItems mi LEFT JOIN memos m ON m.id = mi.memoId WHERE m.id IS NULL) AS invalidMemoItemMemos,
    (SELECT COUNT(*) FROM memoItems mi LEFT JOIN materials mt ON mt.id = mi.materialId WHERE mt.id IS NULL) AS invalidMemoItemMaterials,
    (SELECT COUNT(*) FROM stockMovements sm LEFT JOIN memos m ON m.id = sm.memoId WHERE sm.memoId IS NOT NULL AND m.id IS NULL) AS invalidMovementMemos,
    (SELECT COUNT(*) FROM stockMovements sm LEFT JOIN materials mt ON mt.id = sm.materialId WHERE mt.id IS NULL) AS invalidMovementMaterials
`);

const [movementRows] = await connection.query("SELECT movementType, COUNT(*) AS movementCount, COALESCE(SUM(quantityIn), 0) AS quantityIn, COALESCE(SUM(quantityOut), 0) AS quantityOut FROM stockMovements GROUP BY movementType");
const expected = payload.memos.reduce((summary, memo) => {
  if (!memo.items.length) summary.emptyMemoHeaders += 1;
  for (const item of memo.items) {
    summary.items += 1;
    if (memo.type === "inbound") summary.inboundQuantity += Number(item.quantity);
    else summary.outboundQuantity += Number(item.quantity);
  }
  return summary;
}, { items: 0, emptyMemoHeaders: 0, inboundQuantity: 0, outboundQuantity: 0 });

const report = {
  source: { normalized: payload.summary, expected },
  target: { ...counts[0], unexpectedMemosWithoutItems: Number(counts[0].memosWithoutItems) - expected.emptyMemoHeaders },
  movementTotals: movementRows,
  preservedNonCanonicalMaterialCodes: foundation.extraTargetMaterialCodes ?? [],
  preservedNonCanonicalMaterialProvenance: provenance,
  rejectedBalanceRowsWithoutVerifiableMaterialDetails: payload.rejections.balances,
  rejectedMemoLinesWithoutVerifiableMaterialDetails: payload.rejections.lines,
};
await connection.end();
await fs.writeFile("/home/ubuntu/upload/legacy-import-reconciliation.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ target: report.target, expected, movementTotals: report.movementTotals, rejectedBalances: report.rejectedBalanceRowsWithoutVerifiableMaterialDetails.length, rejectedLines: report.rejectedMemoLinesWithoutVerifiableMaterialDetails.length }));
