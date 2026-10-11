export type MaterialCardMovement = {
  memoNumber: string | null;
  memoDate: Date | string | null;
  occurredAt: Date | string;
  movementType: "opening" | "inbound" | "outbound" | "adjustment" | "transfer_in" | "transfer_out";
  quantityIn: string | number;
  quantityOut: string | number;
  partyName: string | null;
  notes: string | null;
};

const movementLabel: Record<MaterialCardMovement["movementType"], string> = {
  opening: "رصيد افتتاحي",
  inbound: "مذكرة استلام",
  outbound: "مذكرة تسليم",
  adjustment: "مذكرة تسوية",
  transfer_in: "تحويل وارد",
  transfer_out: "تحويل صادر",
};

export function buildMaterialCardRows(movements: MaterialCardMovement[], openingQuantity: string | number, fromDate?: string, toDate?: string) {
  let balance = Number(openingQuantity || 0);
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  const sorted = [...movements].sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime());
  const rows: Array<Array<string | number | null>> = [];
  for (const movement of sorted) {
    const quantityIn = Number(movement.quantityIn || 0);
    const quantityOut = Number(movement.quantityOut || 0);
    balance += quantityIn - quantityOut;
    const occurredAt = new Date(movement.occurredAt).getTime();
    if (occurredAt < from || occurredAt > to) continue;
    rows.push([rows.length + 1, movementLabel[movement.movementType], movement.memoNumber || "", movement.memoDate ? new Date(movement.memoDate).toLocaleDateString("ar-SY") : "", quantityIn || "", quantityOut || "", balance, new Date(movement.occurredAt).toLocaleDateString("ar-SY"), movement.partyName || "", movement.notes || ""]);
  }
  return rows;
}
