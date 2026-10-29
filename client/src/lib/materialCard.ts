import { classifyMemo } from "@shared/memoClassification";

export type MaterialCardMovement = {
  memoNumber: string | null;
  memoType?: "inbound" | "outbound" | null;
  memoNotes?: string | null;
  folderNumber?: string | null;
  referenceNumber?: string | null;
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

function formatDocumentNumber(movement: MaterialCardMovement) {
  const memoType =
    movement.memoType ??
    (movement.movementType === "outbound" || movement.movementType === "transfer_out"
      ? "outbound"
      : "inbound");
  const classification = classifyMemo({
    type: memoType,
    notes: movement.memoNotes,
  });
  const usesFinancialNumber =
    classification === "purchase" || classification === "transfer";
  const documentNumber = usesFinancialNumber
    ? movement.referenceNumber?.trim() || movement.memoNumber || ""
    : movement.memoNumber || "";
  const folderNumber = movement.folderNumber?.trim() || "";

  return [folderNumber, documentNumber.trim()].filter(Boolean).join(" / ");
}

export function buildMaterialCardRows(movements: MaterialCardMovement[], openingQuantity: string | number, fromDate?: string, toDate?: string) {
  let balance = Number(openingQuantity || 0);
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  const isInbound = (movement: MaterialCardMovement) =>
    movement.movementType === "inbound" || movement.movementType === "transfer_in";
  const isOutbound = (movement: MaterialCardMovement) =>
    movement.movementType === "outbound" || movement.movementType === "transfer_out";
  const sorted = [...movements].sort((left, right) => {
    const leftTime = new Date(left.occurredAt).getTime();
    const rightTime = new Date(right.occurredAt).getTime();
    const leftDay = new Date(leftTime).setHours(0, 0, 0, 0);
    const rightDay = new Date(rightTime).setHours(0, 0, 0, 0);
    if (leftDay !== rightDay) return leftTime - rightTime;

    const leftIsOpening = left.movementType === "opening";
    const rightIsOpening = right.movementType === "opening";
    if (leftIsOpening !== rightIsOpening) return leftIsOpening ? -1 : 1;
    if (isInbound(left) && isOutbound(right)) return -1;
    if (isOutbound(left) && isInbound(right)) return 1;
    return leftTime - rightTime;
  });
  const rows: Array<Array<string | number | null>> = [];
  for (const movement of sorted) {
    const quantityIn = Number(movement.quantityIn || 0);
    const quantityOut = Number(movement.quantityOut || 0);
    balance += quantityIn - quantityOut;
    const occurredAt = new Date(movement.occurredAt).getTime();
    if (occurredAt < from || occurredAt > to) continue;
    rows.push([rows.length + 1, movementLabel[movement.movementType], formatDocumentNumber(movement), movement.memoDate ? new Date(movement.memoDate).toLocaleDateString("ar-SY") : "", quantityIn || "", quantityOut || "", balance, new Date(movement.occurredAt).toLocaleDateString("ar-SY"), movement.partyName || "", movement.notes || ""]);
  }
  return rows;
}
