export type SearchableMaterial = {
  id: number;
  code: string;
  name: string;
  barcode?: string | null;
};

export type MaterialSearchFilters = {
  general?: string;
  financialNumber?: string;
  serialNumber?: string;
};

export function filterMaterials<T extends SearchableMaterial>(materials: T[], filters: MaterialSearchFilters, limit = 60): T[] {
  const general = filters.general?.trim().toLowerCase() || "";
  const financial = filters.financialNumber?.trim().toLowerCase() || "";
  const serial = filters.serialNumber?.trim().toLowerCase() || "";

  return materials.filter(material => {
    const matchesGeneral = !general || `${material.code} ${material.name} ${material.barcode || ""}`.toLowerCase().includes(general);
    const matchesFinancial = !financial || String(material.barcode || "").toLowerCase().includes(financial);
    const matchesSerial = !serial || String(material.code || "").toLowerCase().includes(serial);
    return matchesGeneral && matchesFinancial && matchesSerial;
  }).slice(0, limit);
}
