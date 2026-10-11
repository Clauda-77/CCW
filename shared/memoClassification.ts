export type MemoClassification = "purchase" | "adjustment" | "transfer" | "return";

export type MemoClassificationInput = {
  type: "inbound" | "outbound";
  classification?: MemoClassification | null;
  notes?: string | null;
};

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export function classifyMemo(input: MemoClassificationInput): MemoClassification {
  if (input.classification) return input.classification;
  const notes = normalize(input.notes);
  if (input.type === "outbound") {
    return /تركيب|تنسيق|تحويل/.test(notes) ? "transfer" : "adjustment";
  }
  return /إدخال مواد قديمة|إرجاع|مرتجع/.test(notes) ? "return" : "purchase";
}

export function memoClassificationLabel(classification: MemoClassification): string {
  switch (classification) {
    case "purchase":
      return "استلام";
    case "adjustment":
      return "تسليم";
    case "transfer":
      return "تركيب وتنسيق";
    case "return":
      return "إدخال";
  }
}

export function memoClassificationDescription(classification: MemoClassification): string {
  switch (classification) {
    case "purchase":
      return "استلام مواد جديدة تدخل أول مرة إلى المستودع";
    case "adjustment":
      return "تسليم مواد إلى الجهة المستلمة";
    case "transfer":
      return "تركيب وتنسيق دون سعر";
    case "return":
      return "إدخال مواد قديمة مُرجعة دون سعر";
  }
}

export function memoClassificationHasPrice(classification: MemoClassification): boolean {
  return classification === "purchase";
}
