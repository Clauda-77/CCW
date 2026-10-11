import { describe, expect, it } from "vitest";
import { filterMemos } from "./memoSearch";

describe("البحث في رأس المذكرة", () => {
  const memos = [
    { memoNumber: "CST-617-2024-10-15", referenceNumber: "1344", folderNumber: "13", orderNumber: null, invoiceNumber: null, notes: "محضر تركيب وتنسيق", partyName: "علي الأخرس", warehouseName: "كلية الآداب" },
    { memoNumber: "CST-616-2024-10-15", referenceNumber: "1343", folderNumber: "13", orderNumber: null, invoiceNumber: null, notes: "محضر تركيب وتنسيق", partyName: "علي الأخرس", warehouseName: "كلية الآداب" },
  ];

  it("يبحث بالرقم المالي للمذكرة من referenceNumber", () => {
    expect(filterMemos(memos, { financialNumber: "1344" }).map(memo => memo.memoNumber)).toEqual(["CST-617-2024-10-15"]);
  });

  it("يبحث بالرقم المتسلسل للمذكرة من memoNumber", () => {
    expect(filterMemos(memos, { serialNumber: "616" }).map(memo => memo.memoNumber)).toEqual(["CST-616-2024-10-15"]);
  });

  it("يصفّي الرأس كاملًا ولا يعتمد على مواد المذكرة", () => {
    expect(filterMemos(memos, { general: "علي الأخرس", financialNumber: "1343" })).toHaveLength(1);
    expect(filterMemos(memos, { general: "كلية الآداب" })).toHaveLength(2);
  });
});
