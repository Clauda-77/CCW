import XLSXModule from "xlsx";

const XLSX = (XLSXModule as unknown as { default?: typeof XLSXModule }).default ?? XLSXModule;

export const importCategories = ["materials", "balances", "memos", "parties"] as const;
export type ImportCategory = (typeof importCategories)[number];

const requiredColumns: Record<ImportCategory, string[]> = {
  materials: ["SERIALNO", "PRTNAME", "WIHDA"],
  balances: ["SERIALNO", "QUANTITEONHAND"],
  memos: ["BILNO", "BILDATE"],
  parties: ["ACCNAME"],
};

export function validateWorkbook(category: ImportCategory, base64: string) {
  const bytes = Buffer.from(base64, "base64");
  const workbook = XLSX.read(bytes, { type: "buffer", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("لا تحتوي المصنفة على أي ورقة عمل.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "", raw: false });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const missingColumns = requiredColumns[category].filter(column => !columns.includes(column));
  const sample = rows.slice(0, 5).map((row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).slice(0, 8)));
  return { sheetName, totalRows: rows.length, columns, missingColumns, isValid: missingColumns.length === 0 && rows.length > 0, sample };
}

export function validateMemoWorkbooks(headersBase64: string, itemsBase64: string) {
  const inspect = (base64: string) => {
    const workbook = XLSX.read(Buffer.from(base64, "base64"), { type: "buffer", raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("لا تحتوي المصنفة على أي ورقة عمل.");
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "", raw: false });
    return { sheetName, rows, columns: rows.length ? Object.keys(rows[0]) : [] };
  };
  const headers = inspect(headersBase64);
  const items = inspect(itemsBase64);
  const headerRequired = ["BILNO", "BILDATE"];
  const itemRequired = ["BILNO", "SERIALNO", "QUANTITE"];
  const missingHeaderColumns = headerRequired.filter(column => !headers.columns.includes(column));
  const missingItemColumns = itemRequired.filter(column => !items.columns.includes(column));
  const headerNumbers = new Set(headers.rows.map(row => String(row.BILNO ?? "").trim()).filter(Boolean));
  const itemNumbers = new Set(items.rows.map(row => String(row.BILNO ?? "").trim()).filter(Boolean));
  const unresolvedItems = items.rows.filter(row => {
    const number = String(row.BILNO ?? "").trim();
    return number && !headerNumbers.has(number);
  }).length;
  return {
    headers: { sheetName: headers.sheetName, totalRows: headers.rows.length, columns: headers.columns, sample: headers.rows.slice(0, 5) },
    items: { sheetName: items.sheetName, totalRows: items.rows.length, columns: items.columns, sample: items.rows.slice(0, 5) },
    missingHeaderColumns,
    missingItemColumns,
    unresolvedItems,
    isValid: missingHeaderColumns.length === 0 && missingItemColumns.length === 0 && headers.rows.length > 0 && items.rows.length > 0 && unresolvedItems === 0,
    headerNumbers: headerNumbers.size,
    itemNumbers: itemNumbers.size,
  };
}
