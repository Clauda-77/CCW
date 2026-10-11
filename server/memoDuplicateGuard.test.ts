import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("حماية تكرار رقم المذكرة", () => {
  it("يفحص رقم المذكرة ونوعها داخل المعاملة قبل أي إدراج جديد", () => {
    expect(dbSource).toContain("const [existing] = await tx.select");
    expect(dbSource).toContain("and(eq(memos.type, input.type), eq(memos.memoNumber, memoNumber))");
    expect(dbSource).toContain("موجود مسبقًا ضمن هذا النوع");
  });
});
