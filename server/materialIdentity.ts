export type MaterialIdentitySource = {
  id: number;
  code: string;
  isActive?: boolean;
};

export type MaterialIdentityGroup<T extends MaterialIdentitySource> = {
  key: string;
  canonical: T;
  rows: T[];
};

/**
 * Material codes are the stable catalog identity. Old imports may retain the
 * synthetic `legacy-` prefix that create/update already remove, and MySQL's
 * default collation is commonly case-insensitive, so the display identity
 * follows both rules while preserving the original code for display.
 */
export function normalizeMaterialIdentityCode(code: string) {
  return code
    .trim()
    .replace(/^legacy[-_\s]*/i, "")
    .trim()
    .toLocaleLowerCase("en-US");
}

function identityKey(code: string, fallbackId: number) {
  const normalizedCode = normalizeMaterialIdentityCode(code);
  return normalizedCode ? `code:${normalizedCode}` : `id:${fallbackId}`;
}

function canonicalRank(material: MaterialIdentitySource) {
  const normalizedCode = normalizeMaterialIdentityCode(material.code);
  const storedCode = material.code.trim().toLocaleLowerCase("en-US");
  return [
    material.isActive === false ? 1 : 0,
    storedCode === normalizedCode ? 0 : 1,
    material.id,
  ] as const;
}

function compareCanonical(
  left: MaterialIdentitySource,
  right: MaterialIdentitySource
) {
  const leftRank = canonicalRank(left);
  const rightRank = canonicalRank(right);
  for (let index = 0; index < leftRank.length; index += 1) {
    if (leftRank[index] !== rightRank[index])
      return leftRank[index] - rightRank[index];
  }
  return 0;
}

export function groupMaterialsByCode<T extends MaterialIdentitySource>(
  rows: T[]
): MaterialIdentityGroup<T>[] {
  const groups = new Map<string, MaterialIdentityGroup<T>>();
  for (const row of rows) {
    const key = identityKey(row.code, row.id);
    const group = groups.get(key);
    if (group) {
      group.rows.push(row);
      if (compareCanonical(row, group.canonical) < 0) group.canonical = row;
    } else {
      groups.set(key, { key, canonical: row, rows: [row] });
    }
  }
  return Array.from(groups.values()).sort(
    (left, right) => left.canonical.id - right.canonical.id
  );
}

export type InventoryIdentityRow = {
  id: number;
  materialId: number;
  code: string;
  name: string;
  unit: string;
  minimumStock: string;
  openingQuantity: string;
  onHandQuantity: string;
  inboundQuantity: string;
  receiptQuantity: string;
  returnQuantity: string;
  outboundQuantity: string;
  warehouseName: string;
  materialIds?: number[];
  warehouseId: number;
  partyId: number | null;
};

const inventoryQuantityFields = [
  "openingQuantity",
  "onHandQuantity",
  "inboundQuantity",
  "receiptQuantity",
  "returnQuantity",
  "outboundQuantity",
] as const;

/**
 * Collapses inventory rows representing one catalog code. Quantities are
 * summed across the source material IDs so the display does not hide stock.
 */
export function mergeInventoryRowsByMaterialCode<
  T extends InventoryIdentityRow,
>(rows: T[]): Array<T & { materialIds: number[] }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = identityKey(row.code, row.materialId);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  return Array.from(groups.values()).map(groupRows => {
    const canonical = [...groupRows].sort((left, right) =>
      compareCanonical(
        { id: left.materialId, code: left.code },
        { id: right.materialId, code: right.code }
      )
    )[0];
    const materialIds = Array.from(
      new Set(groupRows.flatMap(row => row.materialIds ?? [row.materialId]))
    ).sort((left, right) => left - right);
    const locations = Array.from(
      new Set(groupRows.map(row => row.warehouseName).filter(Boolean))
    );
    const merged = {
      ...canonical,
      materialId: canonical.materialId,
      materialIds,
      minimumStock: String(
        Math.max(...groupRows.map(row => Number(row.minimumStock) || 0))
      ),
      warehouseName:
        locations.length > 1
          ? "متعدد الجهات / المستودعات"
          : (locations[0] ?? ""),
    } as T & { materialIds: number[] };

    for (const field of inventoryQuantityFields) {
      const total = groupRows.reduce(
        (sum, row) => sum + (Number(row[field]) || 0),
        0
      );
      (merged as Record<(typeof inventoryQuantityFields)[number], string>)[
        field
      ] = String(total);
    }
    return merged;
  });
}
