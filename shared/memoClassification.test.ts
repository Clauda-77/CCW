import { describe, expect, it } from "vitest";
import {
  classifyMemo,
  memoClassificationHasPrice,
  memoClassificationLabel,
} from "./memoClassification";

describe("تصنيف أنواع المذكرات", () => {
  it("يصنف الاستلام الجديد بسعر", () => {
    expect(classifyMemo({ type: "inbound", notes: "استلام مواد جديدة" })).toBe("purchase");
    expect(memoClassificationLabel("purchase")).toBe("استلام");
    expect(memoClassificationHasPrice("purchase")).toBe(true);
  });

  it("يصنف الإدخال القديم المُرجع بلا سعر", () => {
    expect(classifyMemo({ type: "inbound", notes: "إدخال مواد قديمة (إرجاع)" })).toBe("return");
    expect(memoClassificationLabel("return")).toBe("إدخال");
    expect(memoClassificationHasPrice("return")).toBe(false);
  });

  it("يميز التسليم عن التركيب والتنسيق بلا سعر", () => {
    expect(classifyMemo({ type: "outbound", notes: "تسليم مواد" })).toBe("adjustment");
    expect(classifyMemo({ type: "outbound", notes: "تركيب وتنسيق" })).toBe("transfer");
    expect(memoClassificationHasPrice("adjustment")).toBe(false);
    expect(memoClassificationHasPrice("transfer")).toBe(false);
  });

  it("يعتمد نوع مذكرة الإدخال أو الاستلام على اختيار المسار لا على اسم المادة", () => {
    expect(classifyMemo({ type: "inbound", notes: "استلام مواد جديدة تدخل أول مرة" })).toBe("purchase");
    expect(classifyMemo({ type: "inbound", notes: "إدخال مواد قديمة مُرجعة" })).toBe("return");
  });
});
