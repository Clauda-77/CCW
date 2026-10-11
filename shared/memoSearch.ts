export type SearchableMemo = {
  memoNumber: string;
  referenceNumber?: string | null;
  folderNumber?: string | null;
  orderNumber?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  partyName?: string | null;
  warehouseName?: string | null;
};

export type MemoSearchFilters = {
  general?: string;
  financialNumber?: string;
  serialNumber?: string;
};

export function filterMemos<T extends SearchableMemo>(memos: T[], filters: MemoSearchFilters, limit = 60): T[] {
  const general = filters.general?.trim().toLowerCase() || "";
  const financial = filters.financialNumber?.trim().toLowerCase() || "";
  const serial = filters.serialNumber?.trim().toLowerCase() || "";

  return memos.filter(memo => {
    const headerText = [memo.memoNumber, memo.referenceNumber, memo.folderNumber, memo.orderNumber, memo.invoiceNumber, memo.notes, memo.partyName, memo.warehouseName].filter(Boolean).join(" ").toLowerCase();
    const matchesGeneral = !general || headerText.includes(general);
    const matchesFinancial = !financial || String(memo.referenceNumber || "").toLowerCase().includes(financial);
    const matchesSerial = !serial || String(memo.memoNumber || "").toLowerCase().includes(serial);
    return matchesGeneral && matchesFinancial && matchesSerial;
  }).slice(0, limit);
}
