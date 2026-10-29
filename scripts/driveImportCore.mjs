import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import XLSXModule from "xlsx";

const XLSX = XLSXModule.default ?? XLSXModule;

export const APPROVED_SKIPS = Object.freeze({
  ambiguousMemoDetails: 39,
  missingQuantityDetails: 4,
});

export const REPLACED_TABLES = Object.freeze([
  "memoReconciliations",
  "stockMovements",
  "memoItems",
  "memos",
  "inventoryBalances",
  "materials",
  "parties",
]);

export const PRESERVED_TABLES = Object.freeze([
  "users",
  "userwarehouses",
  "warehouses",
  "financialEntries",
  "colleges",
  "adminAuditLogs",
  "importBatches",
]);

const REQUIRED_COLUMNS = Object.freeze({
  "INVENTRY.csv": ["SERIALNO", "PRTNAME", "WIHDA"],
  "DETINVENTRY.csv": ["SERIALNO", "QUANTITEFRSTPERIODE", "QUANTITEONHAND", "QUANTITEMOUNA", "NUMINV1", "NAMEINV1"],
  "MOUARIDIN.csv": ["NUMERO", "ACCNAME"],
  "MSTBILSRC.csv": ["BILNO", "BILDATE", "ACCNO", "NUMINV1", "NAMEINV1"],
  "DETBILSRC.csv": ["BILNO", "BILDATE", "SERIALNO", "PRTNO", "PRTNAME", "QUANTITE", "WIHDA", "NAMEINV1"],
  "MSTBILCST.csv": ["BILNO", "BILDATE", "ACCNO", "NUMINV1", "NAMEINV1"],
  "DETBILCST.csv": ["BILNO", "BILDATE", "SERIALNO", "PRTNO", "PRTNAME", "QUANTITE", "WIHDA", "NAMEINV1"],
});

const REQUIRED_FILES = Object.freeze(Object.keys(REQUIRED_COLUMNS));
const SOURCE_FILES = Object.freeze({
  SRC: { header: "MSTBILSRC.csv", details: "DETBILSRC.csv", type: "inbound" },
  CST: { header: "MSTBILCST.csv", details: "DETBILCST.csv", type: "outbound" },
});

export function text(value) {
  return String(value ?? "").trim();
}

export function normalizeName(value) {
  return text(value)
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(/[\u0640]/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

export function parseDecimal(value, { allowBlank = false } = {}) {
  const raw = text(value);
  if (!raw) {
    if (allowBlank) return null;
    throw new Error("empty decimal");
  }
  const normalized = raw.replace(/[\s\u00a0]/g, "").replaceAll(",", "");
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error("invalid decimal");
  }
  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new Error("invalid decimal");
  return { value: normalized, number };
}

export function parseLegacyDate(value) {
  const raw = text(value);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T].*)?$/);
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+.*)?$/);
  let year;
  let month;
  let day;
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
    if (year < 100) year += 2000;
  } else {
    const timestamp = Date.parse(raw);
    if (!Number.isFinite(timestamp)) return null;
    const date = new Date(timestamp);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function readCsvFile(filePath, { delimiter = ",", codepage = 1256 } = {}) {
  const bytes = fs.readFileSync(filePath);
  const workbook = XLSX.read(bytes, {
    type: "buffer",
    raw: false,
    codepage,
    FS: delimiter,
    cellDates: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`لا تحتوي ${path.basename(filePath)} على صفوف.`);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });
  return { rows, sha256: sha256(bytes), bytes: bytes.length };
}

export function readDriveSourceDirectory(sourceDir) {
  const files = {};
  const metadata = {};
  const problems = [];
  for (const filename of REQUIRED_FILES) {
    const filePath = path.join(sourceDir, filename);
    if (!fs.existsSync(filePath)) {
      problems.push({ code: "missing_file", file: filename });
      continue;
    }
    try {
      const parsed = readCsvFile(filePath);
      const columns = parsed.rows.length ? Object.keys(parsed.rows[0]) : [];
      const missing = REQUIRED_COLUMNS[filename].filter(column => !columns.includes(column));
      if (missing.length) problems.push({ code: "missing_columns", file: filename, columns: missing });
      if (!parsed.rows.length) problems.push({ code: "empty_file", file: filename });
      files[filename] = parsed.rows;
      metadata[filename] = { rows: parsed.rows.length, bytes: parsed.bytes, sha256: parsed.sha256 };
    } catch (error) {
      problems.push({ code: "read_error", file: filename, message: String(error?.message ?? error) });
    }
  }

  const historyPath = path.join(sourceDir, "HISTORYPRT.txt");
  if (fs.existsSync(historyPath)) {
    try {
      const parsed = readCsvFile(historyPath, { delimiter: "\t" });
      files["HISTORYPRT.txt"] = parsed.rows;
      metadata["HISTORYPRT.txt"] = { rows: parsed.rows.length, bytes: parsed.bytes, sha256: parsed.sha256 };
    } catch (error) {
      problems.push({ code: "history_reference_read_error", file: "HISTORYPRT.txt", message: String(error?.message ?? error) });
    }
  }
  return { files, metadata, problems };
}

function displayCode(value) {
  return `legacy-${text(value)}`;
}

function rowProblem(problems, code, file, rowNumber, column) {
  problems.push({ code, file, rowNumber, column });
}

function sourceLocationPairs(rows, filename, problems) {
  const pairs = [];
  // The audited source's NUMINV2/NAMEINV2 fields are placeholders (0 / "-")
  // on every DETINVENTRY row, not an additional warehouse directory.
  const columns = [["NUMINV1", "NAMEINV1"]];
  rows.forEach((row, index) => {
    for (const [codeColumn, nameColumn] of columns) {
      const code = text(row[codeColumn]);
      const name = text(row[nameColumn]);
      if (!code && !name) continue;
      if (!code || !name) {
        rowProblem(problems, "incomplete_warehouse_pair", filename, index + 2, code ? nameColumn : codeColumn);
        continue;
      }
      // Warehouse codes in the source match warehouses.code as stored in CCW;
      // unlike material serials, they must not receive the legacy- prefix.
      pairs.push({ code, sourceCode: code, name, filename, rowNumber: index + 2 });
    }
  });
  return pairs;
}

function memoKey(source, number, date, warehouseCode) {
  return `${source}|${text(number)}|${date}|${warehouseCode}`;
}

function shortToken(value, fallback) {
  const raw = text(value);
  const safe = raw.replace(/[^\p{L}\p{N}_-]/gu, "");
  const token = safe || fallback;
  if (token.length <= 16) return token;
  const hash = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 6);
  return `${token.slice(0, 9)}-${hash}`;
}

function memoNumber(source, sourceNumber, date, warehouseCode, duplicateOrdinal, used) {
  const number = shortToken(sourceNumber, "empty");
  const warehouse = shortToken(warehouseCode.replace(/^legacy-/, ""), "wh");
  let suffix = duplicateOrdinal > 1 ? `-D${duplicateOrdinal}` : "";
  let candidate = `legacy-${source}-${number}-${date.replaceAll("-", "")}-${warehouse}${suffix}`;
  if (candidate.length > 64) candidate = `${candidate.slice(0, 55)}-${crypto.createHash("sha1").update(candidate).digest("hex").slice(0, 8)}`;
  if (used.has(candidate)) {
    const hash = crypto.createHash("sha1").update(`${source}|${sourceNumber}|${date}|${warehouseCode}|${duplicateOrdinal}`).digest("hex").slice(0, 8);
    candidate = `${candidate.slice(0, 55)}-${hash}`;
  }
  if (used.has(candidate)) throw new Error("تعذر توليد رقم مذكرة فريد.");
  used.add(candidate);
  return candidate;
}

function materialIndex(materialRows, problems) {
  const bySerial = new Map();
  const byPrtName = new Map();
  const materials = [];
  materialRows.forEach((row, index) => {
    const serial = text(row.SERIALNO);
    const name = text(row.PRTNAME);
    const unit = text(row.WIHDA) || "عدد";
    if (!serial || !name) {
      rowProblem(problems, "invalid_material_master_row", "INVENTRY.csv", index + 2, !serial ? "SERIALNO" : "PRTNAME");
      return;
    }
    const code = displayCode(serial);
    if (bySerial.has(serial)) {
      rowProblem(problems, "duplicate_material_serial", "INVENTRY.csv", index + 2, "SERIALNO");
      return;
    }
    let minimumStock;
    try { minimumStock = parseDecimal(row.MINQUANTITE || "0").value; }
    catch { rowProblem(problems, "invalid_material_minimum", "INVENTRY.csv", index + 2, "MINQUANTITE"); minimumStock = "0"; }
    const material = {
      code,
      name,
      description: text(row.DESCRIPTION) || null,
      unit,
      barcode: text(row.BARCODE) || null,
      minimumStock,
      sourceSerial: serial,
      source: "INVENTRY.csv",
    };
    bySerial.set(serial, material);
    materials.push(material);
    const pairKey = `${normalizeName(row.PRTNO)}|${normalizeName(name)}`;
    if (normalizeName(row.PRTNO) && normalizeName(name)) {
      const list = byPrtName.get(pairKey) ?? [];
      list.push(material);
      byPrtName.set(pairKey, list);
    }
  });
  return { bySerial, byPrtName, materials };
}

function candidateMaterials(row, byPrtName) {
  const productNumber = normalizeName(row.PRTNO);
  const name = normalizeName(row.PRTNAME);
  if (!productNumber || !name) return [];
  return byPrtName.get(`${productNumber}|${name}`) ?? [];
}

function buildMaterialPlan(files, problems) {
  const { bySerial, byPrtName, materials } = materialIndex(files["INVENTRY.csv"] ?? [], problems);
  const detailSources = ["DETBILSRC.csv", "DETBILCST.csv"];
  const rowsBySourceSerial = new Map();
  const detailRows = [];
  for (const filename of detailSources) {
    const source = filename.includes("SRC") ? "SRC" : "CST";
    (files[filename] ?? []).forEach((row, index) => {
      const sourceSerial = text(row.SERIALNO);
      const entry = { row, filename, source, rowNumber: index + 2, sourceSerial };
      detailRows.push(entry);
      if (!sourceSerial) {
        rowProblem(problems, "missing_detail_material_serial", filename, index + 2, "SERIALNO");
        return;
      }
      const refs = rowsBySourceSerial.get(sourceSerial) ?? [];
      refs.push(entry);
      rowsBySourceSerial.set(sourceSerial, refs);
    });
  }

  const historyRows = files["HISTORYPRT.txt"] ?? [];
  for (const row of historyRows) {
    const serial = text(row.SERIALNO);
    if (!serial || bySerial.has(serial)) continue;
    const refs = rowsBySourceSerial.get(serial) ?? [];
    refs.push({ row, filename: "HISTORYPRT.txt", source: "HISTORYPRT", rowNumber: null, sourceSerial: serial, historyOnly: true });
    rowsBySourceSerial.set(serial, refs);
  }

  const sourceSerialToMaterial = new Map();
  const derivedMaterials = [];
  for (const [sourceSerial, refs] of rowsBySourceSerial) {
    const direct = bySerial.get(sourceSerial);
    if (direct) {
      sourceSerialToMaterial.set(sourceSerial, direct);
      continue;
    }
    const transactionRefs = refs.filter(ref => !ref.historyOnly);
    const candidateLists = transactionRefs.map(ref => candidateMaterials(ref.row, byPrtName));
    const everyRowUniquelyMapsSame = transactionRefs.length > 0 &&
      candidateLists.every(candidates => candidates.length === 1) &&
      new Set(candidateLists.map(candidates => candidates[0].code)).size === 1;
    if (everyRowUniquelyMapsSame) {
      sourceSerialToMaterial.set(sourceSerial, candidateLists[0][0]);
      continue;
    }

    const names = new Map();
    const units = new Map();
    let description = null;
    let barcode = null;
    for (const ref of refs) {
      const name = text(ref.row.PRTNAME);
      const unit = text(ref.row.WIHDA);
      if (name) names.set(normalizeName(name), name);
      if (unit) units.set(normalizeName(unit), unit);
      if (!description && text(ref.row.DESCRIPTION)) description = text(ref.row.DESCRIPTION);
      if (!barcode && text(ref.row.BARCODE)) barcode = text(ref.row.BARCODE);
    }
    if (names.size !== 1 || units.size > 1) {
      const first = refs.find(ref => ref.filename !== "HISTORYPRT.txt") ?? refs[0];
      rowProblem(problems, "ambiguous_legacy_material_identity", first?.filename ?? "INVENTRY.csv", first?.rowNumber ?? 0, "SERIALNO");
      continue;
    }
    const name = [...names.values()][0];
    const unit = [...units.values()][0] || "عدد";
    const material = {
      code: displayCode(sourceSerial),
      name,
      description,
      unit,
      barcode,
      minimumStock: "0",
      sourceSerial,
      source: "derived-from-original-detail",
    };
    if (bySerial.has(sourceSerial) || materials.some(item => item.code === material.code)) {
      rowProblem(problems, "derived_material_code_collision", "INVENTRY.csv", 0, "SERIALNO");
      continue;
    }
    derivedMaterials.push(material);
    sourceSerialToMaterial.set(sourceSerial, material);
  }

  materials.push(...derivedMaterials);
  const materialByCode = new Map(materials.map(material => [material.code, material]));
  for (const entry of detailRows) {
    if (sourceSerialToMaterial.has(entry.sourceSerial)) continue;
    rowProblem(problems, "unresolved_detail_material", entry.filename, entry.rowNumber, "SERIALNO");
  }

  return { materials, materialByCode, sourceSerialToMaterial, derivedMaterials, detailRows };
}

function buildPlanFromFiles(files, metadata = {}, initialProblems = []) {
  const problems = [...initialProblems];
  const counts = {};
  for (const [filename, rows] of Object.entries(files)) counts[filename] = rows.length;

  const materialsResult = buildMaterialPlan(files, problems);
  const materialsByCode = materialsResult.materialByCode;
  const ignoredSecondaryWarehousePlaceholders = (files["DETINVENTRY.csv"] ?? [])
    .filter(row => text(row.NUMINV2) === "0" && normalizeName(row.NAMEINV2) === "-")
    .length;

  const warehousePairs = [];
  warehousePairs.push(...sourceLocationPairs(files["DETINVENTRY.csv"] ?? [], "DETINVENTRY.csv", problems));
  warehousePairs.push(...sourceLocationPairs(files["MSTBILSRC.csv"] ?? [], "MSTBILSRC.csv", problems));
  warehousePairs.push(...sourceLocationPairs(files["MSTBILCST.csv"] ?? [], "MSTBILCST.csv", problems));
  const warehouseBySourceCode = new Map();
  const warehouseByName = new Map();
  for (const pair of warehousePairs) {
    const existingCode = warehouseBySourceCode.get(pair.code);
    if (existingCode && normalizeName(existingCode.name) !== normalizeName(pair.name)) {
      rowProblem(problems, "warehouse_code_name_conflict", pair.filename, pair.rowNumber, "NAMEINV1");
      continue;
    }
    const existingName = warehouseByName.get(normalizeName(pair.name));
    if (existingName && existingName.code !== pair.code) {
      rowProblem(problems, "warehouse_name_code_ambiguity", pair.filename, pair.rowNumber, "NAMEINV1");
      continue;
    }
    warehouseBySourceCode.set(pair.code, { code: pair.code, name: existingCode?.name ?? pair.name });
    warehouseByName.set(normalizeName(pair.name), { code: pair.code, name: pair.name });
  }
  const warehouses = [...warehouseBySourceCode.values()];

  const parties = [];
  const partyByLegacyNumber = new Map();
  (files["MOUARIDIN.csv"] ?? []).forEach((row, index) => {
    const number = text(row.NUMERO);
    const name = text(row.ACCNAME);
    if (!number || !name) {
      rowProblem(problems, "invalid_party_row", "MOUARIDIN.csv", index + 2, !number ? "NUMERO" : "ACCNAME");
      return;
    }
    if (partyByLegacyNumber.has(number)) {
      rowProblem(problems, "duplicate_party_number", "MOUARIDIN.csv", index + 2, "NUMERO");
      return;
    }
    const party = {
      legacyNumber: number,
      name,
      type: "both",
      phone: text(row.TEL) || null,
      address: text(row.ADDRESS) || null,
    };
    parties.push(party);
    partyByLegacyNumber.set(number, party);
  });

  const memoHeaderGroups = new Map();
  const memoHeaders = [];
  for (const [source, sourceInfo] of Object.entries(SOURCE_FILES)) {
    const rows = files[sourceInfo.header] ?? [];
    rows.forEach((row, index) => {
      const sourceNumber = text(row.BILNO);
      const date = parseLegacyDate(row.BILDATE);
      const warehouseSourceCode = text(row.NUMINV1);
      const warehouseName = text(row.NAMEINV1);
      const warehouse = warehouseSourceCode
        ? warehouseBySourceCode.get(warehouseSourceCode)
        : warehouseByName.get(normalizeName(warehouseName));
      if (!sourceNumber || !date || !warehouse || normalizeName(warehouse.name) !== normalizeName(warehouseName)) {
        rowProblem(problems, "invalid_memo_header", sourceInfo.header, index + 2, !sourceNumber ? "BILNO" : !date ? "BILDATE" : "NAMEINV1");
        return;
      }
      const partyNumber = text(row.ACCNO);
      if (!partyNumber || !partyByLegacyNumber.has(partyNumber)) {
        rowProblem(problems, "unmapped_memo_party", sourceInfo.header, index + 2, "ACCNO");
      }
      const key = memoKey(source, sourceNumber, date, warehouse.code);
      const header = {
        source,
        sourceFile: sourceInfo.header,
        rowNumber: index + 2,
        sourceNumber,
        date,
        type: sourceInfo.type,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        partyLegacyNumber: partyNumber || null,
        folderNumber: text(row.NUMFOLDER) || null,
        orderNumber: text(row.NUMTALAB) || null,
        orderDate: text(row.DATETALAB) ? parseLegacyDate(row.DATETALAB) : null,
        invoiceNumber: text(row.NUMFATOURA) || null,
        invoiceDate: text(row.DATEFATOURA) ? parseLegacyDate(row.DATEFATOURA) : null,
        referenceNumber: text(row.NUMMALI) || null,
        notes: text(row.TYPFATOURA || row.TYPNAME) || null,
        key,
      };
      if (text(row.DATETALAB) && !header.orderDate) rowProblem(problems, "invalid_optional_order_date", sourceInfo.header, index + 2, "DATETALAB");
      if (text(row.DATEFATOURA) && !header.invoiceDate) rowProblem(problems, "invalid_optional_invoice_date", sourceInfo.header, index + 2, "DATEFATOURA");
      const group = memoHeaderGroups.get(key) ?? [];
      group.push(header);
      memoHeaderGroups.set(key, group);
      memoHeaders.push(header);
    });
  }

  const usedMemoNumbers = new Set();
  const memos = [];
  for (const [key, group] of memoHeaderGroups) {
    group.forEach((header, index) => {
      const ordinal = index + 1;
      header.memoNumber = memoNumber(header.source, header.sourceNumber, header.date, header.warehouseCode, group.length > 1 ? ordinal : 1, usedMemoNumbers);
      header.items = [];
      memos.push(header);
    });
  }

  const allItems = [];
  const skippedRows = [];
  const ambiguousCountBySource = { SRC: 0, CST: 0 };
  const missingQuantityCountBySource = { SRC: 0, CST: 0 };
  const orphanDetailRows = [];
  const zeroQuantityRows = [];
  for (const [source, sourceInfo] of Object.entries(SOURCE_FILES)) {
    const rows = files[sourceInfo.details] ?? [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const sourceNumber = text(row.BILNO);
      const date = parseLegacyDate(row.BILDATE);
      const warehouse = warehouseByName.get(normalizeName(row.NAMEINV1));
      if (!sourceNumber || !date || !warehouse) {
        rowProblem(problems, "invalid_memo_detail_key", sourceInfo.details, rowNumber, !sourceNumber ? "BILNO" : !date ? "BILDATE" : "NAMEINV1");
        return;
      }
      const key = memoKey(source, sourceNumber, date, warehouse.code);
      const candidates = memoHeaderGroups.get(key) ?? [];
      if (candidates.length === 0) {
        orphanDetailRows.push({ source, file: sourceInfo.details, rowNumber, sourceNumber, date, warehouseCode: warehouse.code });
        rowProblem(problems, "orphan_memo_detail", sourceInfo.details, rowNumber, "BILNO");
        return;
      }
      if (candidates.length > 1) {
        ambiguousCountBySource[source] += 1;
        skippedRows.push({ source, file: sourceInfo.details, rowNumber, sourceNumber, date, warehouseCode: warehouse.code, reason: "ambiguous_memo_header", candidateHeaders: candidates.length });
        return;
      }
      const rawQuantity = text(row.QUANTITE);
      if (!rawQuantity) {
        missingQuantityCountBySource[source] += 1;
        skippedRows.push({ source, file: sourceInfo.details, rowNumber, sourceNumber, date, warehouseCode: warehouse.code, reason: "missing_quantity", candidateHeaders: 1 });
        return;
      }
      let quantity;
      try { quantity = parseDecimal(rawQuantity); }
      catch {
        rowProblem(problems, "invalid_memo_quantity", sourceInfo.details, rowNumber, "QUANTITE");
        return;
      }
      if (quantity.number < 0) {
        rowProblem(problems, "negative_memo_quantity", sourceInfo.details, rowNumber, "QUANTITE");
        return;
      }
      const material = materialsResult.sourceSerialToMaterial.get(text(row.SERIALNO));
      if (!material) {
        rowProblem(problems, "unresolved_detail_material", sourceInfo.details, rowNumber, "SERIALNO");
        return;
      }
      let unitPrice = null;
      if (text(row.PRICE)) {
        try {
          const parsedPrice = parseDecimal(row.PRICE);
          if (parsedPrice.number < 0) throw new Error("negative price");
          unitPrice = parsedPrice.value;
        } catch {
          rowProblem(problems, "invalid_memo_unit_price", sourceInfo.details, rowNumber, "PRICE");
          return;
        }
      }
      const memo = candidates[0];
      const item = {
        source,
        sourceFile: sourceInfo.details,
        rowNumber,
        memoNumber: memo.memoNumber,
        type: memo.type,
        memoDate: memo.date,
        warehouseCode: memo.warehouseCode,
        partyLegacyNumber: memo.partyLegacyNumber,
        materialCode: material.code,
        quantity: quantity.value,
        unitPrice,
        notes: text(row.REMARQUE) || null,
      };
      if (quantity.number === 0) zeroQuantityRows.push({ file: sourceInfo.details, rowNumber, source, sourceNumber, date, warehouseCode: warehouse.code });
      memo.items.push(item);
      allItems.push(item);
    });
  }

  const balances = [];
  const balanceScopes = new Set();
  (files["DETINVENTRY.csv"] ?? []).forEach((row, index) => {
    const sourceSerial = text(row.SERIALNO);
    const warehouseSourceCode = text(row.NUMINV1);
    const warehouseCode = warehouseSourceCode;
    const material = materialsResult.sourceSerialToMaterial.get(sourceSerial);
    if (!sourceSerial || !material || !warehouseBySourceCode.has(warehouseCode)) {
      rowProblem(problems, "unresolved_balance_scope", "DETINVENTRY.csv", index + 2, !sourceSerial ? "SERIALNO" : !material ? "SERIALNO" : "NUMINV1");
      return;
    }
    const key = `${material.code}|${warehouseCode}`;
    if (balanceScopes.has(key)) {
      rowProblem(problems, "duplicate_balance_scope", "DETINVENTRY.csv", index + 2, "SERIALNO");
      return;
    }
    balanceScopes.add(key);
    const quantities = {};
    for (const [sourceColumn, targetColumn] of [
      ["QUANTITEFRSTPERIODE", "openingQuantity"],
      ["QUANTITEONHAND", "onHandQuantity"],
      ["QUANTITEMOUNA", "reservedQuantity"],
    ]) {
      try {
        quantities[targetColumn] = parseDecimal(row[sourceColumn] || "0").value;
      } catch {
        rowProblem(problems, "invalid_balance_quantity", "DETINVENTRY.csv", index + 2, sourceColumn);
        quantities[targetColumn] = "0";
      }
    }
    balances.push({ materialCode: material.code, warehouseCode, ...quantities });
  });

  const expectedAmbiguous = APPROVED_SKIPS.ambiguousMemoDetails;
  const expectedMissingQuantity = APPROVED_SKIPS.missingQuantityDetails;
  const actualAmbiguous = ambiguousCountBySource.SRC + ambiguousCountBySource.CST;
  const actualMissingQuantity = missingQuantityCountBySource.SRC + missingQuantityCountBySource.CST;
  if (actualAmbiguous !== expectedAmbiguous) {
    problems.push({ code: "approved_ambiguous_skip_count_changed", expected: expectedAmbiguous, actual: actualAmbiguous });
  }
  if (actualMissingQuantity !== expectedMissingQuantity) {
    problems.push({ code: "approved_missing_quantity_skip_count_changed", expected: expectedMissingQuantity, actual: actualMissingQuantity });
  }

  const headerOnlyMemos = memos.filter(memo => memo.items.length === 0).length;
  const report = {
    status: problems.length ? "blocked" : "ready",
    generatedAt: new Date().toISOString(),
    sourceCounts: counts,
    sourceFiles: metadata,
    planned: {
      materialsFromInventory: (files["INVENTRY.csv"] ?? []).length,
      derivedMaterials: materialsResult.derivedMaterials.length,
      totalMaterials: materialsResult.materials.length,
      parties: parties.length,
      sourceWarehouses: warehouses.length,
      balances: balances.length,
      memos: memos.length,
      memoItems: allItems.length,
      stockMovements: allItems.length,
      headerOnlyMemos,
      zeroQuantityItems: zeroQuantityRows.length,
    },
    sourceWarehouseAudit: {
      warehousesFromPrimaryCodes: warehouses.length,
      ignoredSecondaryPlaceholderRows: ignoredSecondaryWarehousePlaceholders,
      reason: "NUMINV2/NAMEINV2 في DETINVENTRY قيم افتراضية (0/-) وليست مستودعات إضافية.",
    },
    skips: {
      ambiguousMemoDetails: actualAmbiguous,
      ambiguousBySource: ambiguousCountBySource,
      missingQuantityDetails: actualMissingQuantity,
      missingQuantityBySource: missingQuantityCountBySource,
      totalDetailsSkipped: skippedRows.length,
      rows: skippedRows,
    },
    unmatchedDetailRows: orphanDetailRows,
    replacedTables: [...REPLACED_TABLES],
    preservedTables: [...PRESERVED_TABLES],
    excludedSourceFiles: [
      { filename: "USERS.csv / USERS.txt / USERS.xls", reason: "تحتوي بيانات اعتماد/كلمات مرور قديمة؛ تُحفظ حسابات النظام الحالية ولا تُنقل كلمات المرور." },
      { filename: "HISTORYPRT.txt", reason: "تقرير حركة مجمّع وليس سجل حركات مُطبّعًا؛ يُستخدم مرجعًا احتياطيًا لبيانات المادة فقط ولا يُستورد كحركات." },
      { filename: "NAMEKOU.csv / DETNAMEKOU.csv", reason: "بنية إضافية غير متوافقة مباشرة مع جداول النظام؛ تبقى محفوظة في المصدر ولا تُحمّل تخمينًا." },
      { filename: "ACCOUNT.csv / ACCOUNTNO.csv / log.txt", reason: "ملفات مساعدة/سجل تصدير بلا جدول تشغيل مطابق في مسار الاستبدال." },
    ],
    blockers: problems,
  };

  return {
    files,
    report,
    warehouses,
    parties,
    materials: materialsResult.materials,
    balances,
    memos,
    items: allItems,
    skippedRows,
  };
}

export function buildDriveImportPlan(input) {
  if (input?.files) return buildPlanFromFiles(input.files, input.metadata ?? {}, input.problems ?? []);
  const loaded = readDriveSourceDirectory(input.sourceDir);
  return buildPlanFromFiles(loaded.files, loaded.metadata, loaded.problems);
}

export function sanitizedReport(plan) {
  return JSON.parse(JSON.stringify(plan.report));
}

export const __test = { memoKey, memoNumber, sourceLocationPairs, materialIndex };
