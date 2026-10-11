import fs from "node:fs/promises";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is unavailable");

const payload = JSON.parse(await fs.readFile("/home/ubuntu/upload/legacy-normalized-import.json", "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function existingValues(table, column) {
  const [rows] = await connection.query(`SELECT ${column} FROM ${table}`);
  return new Set(rows.map(row => String(row[column])));
}

const materialCodes = payload.materials.map(row => row.code);
const warehouseCodes = payload.warehouses.map(row => row.code);
const partyNumbers = payload.parties.map(row => row.legacyNumber);
const [materialFound, warehouseFound, partyFound] = await Promise.all([
  existingValues("materials", "code"),
  existingValues("warehouses", "code"),
  existingValues("parties", "legacyNumber"),
]);

const output = {
  sourceCounts: { materialRows: materialCodes.length, uniqueMaterialCodes: new Set(materialCodes).size, warehouseRows: warehouseCodes.length, uniqueWarehouseCodes: new Set(warehouseCodes).size, partyRows: partyNumbers.length, uniquePartyNumbers: new Set(partyNumbers).size },
  targetCounts: { materialCodes: materialFound.size, warehouseCodes: warehouseFound.size, partyNumbers: partyFound.size },
  missingMaterials: payload.materials.filter(row => !materialFound.has(String(row.code))),
  extraTargetMaterialCodes: [...materialFound].filter(code => !new Set(materialCodes).has(code)),
  missingWarehouses: payload.warehouses.filter(row => !warehouseFound.has(String(row.code))),
  missingParties: payload.parties.filter(row => !partyFound.has(String(row.legacyNumber))),
};
await connection.end();
await fs.writeFile("/home/ubuntu/upload/legacy-foundation-diff.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify({ ...output.sourceCounts, ...output.targetCounts, missingMaterials: output.missingMaterials.length, missingWarehouses: output.missingWarehouses.length, missingParties: output.missingParties.length }));
