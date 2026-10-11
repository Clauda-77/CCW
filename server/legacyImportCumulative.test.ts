import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const importScript = readFileSync(new URL("../scripts/import-legacy-warehouse.mjs", import.meta.url), "utf8");
const importPage = readFileSync(new URL("../client/src/pages/Import.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const commitSource = readFileSync(new URL("./cumulativeImport.ts", import.meta.url), "utf8");

describe("عقد الاستيراد التراكمي للملفات التاريخية", () => {
  it("يحمى عملية الاستيراد بمعاملة كاملة ويضيف فقط ما لا يتكرر", () => {
    ["await connection.beginTransaction()", "await connection.commit()", "await connection.rollback()", "INSERT IGNORE INTO", "existingItemKeys", "existingMovementKeys"].forEach(fragment => expect(importScript).toContain(fragment));
  });

  it("يغطي المواد والأرصدة والمذكرات والجهات ويعرض فحصًا قبل الاعتماد في الواجهة", () => {
    ["INVENTRY.xls", "DETINVENTRY.xls", "MOUARIDIN.xls", "MSTBILSRC.xls", "DETBILSRC.xls", "MSTBILCST.xls", "DETBILCST.xls"].forEach(filename => expect(importScript).toContain(filename));
    ["دليل المواد", "أرصدة المخزون", "المذكرات", "الجهات", "imports.validate.useMutation", "فحص الأعمدة والصفوف", "لا يتم إدخال أي صف أثناء هذه المعاينة"].forEach(fragment => expect(importPage).toContain(fragment));
  });

  it("يدعم ملفي رؤوس وبنود المذكرات ويجمع رأسًا واحدًا لكل رقم مصدر", () => {
    ["validateMemos", "commitMemos", "commitLinkedMemoImport", "headerBase64", "itemBase64", "headerFilename", "itemFilename", "source: z.enum([\"SRC\", \"CST\"])"].forEach(fragment => expect(routerSource + commitSource).toContain(fragment));
    ["MSTBIL*.xls + DETBIL*.xls", "اختر ملفي MSTBIL للرؤوس وDETBIL للبنود معًا", "رأس واحد لكل رقم", "لن يعتمد النظام رأسًا بلا بنود"].forEach(fragment => expect(importPage).toContain(fragment));
    ["headerByKey", "resolvedMemoNumbers", "existingBySourceKey", "existingItemKeys", "existingMovementKeys", "normalizedMemoNumber"].forEach(fragment => expect(commitSource).toContain(fragment));
  });

  it("يعرض اعتمادًا صريحًا للدفعة ويربطه بـ endpoint إداري تراكمي مع ملخص النتيجة", () => {
    ["commit: administratorProcedure", "commitCumulativeImport", "filename:"].forEach(fragment => expect(routerSource).toContain(fragment));
    ["trpc.imports.commit.useMutation", "اعتماد الدفعة التراكمية", "commitResult", "متجاوزة مكررة", "غير مرتبطة"].forEach(fragment => expect(importPage).toContain(fragment));
    ["importBatches", "status: \"imported\"", "tx.insert", "لا يعتمد النظام ملفًا منفردًا للمذكرات"].forEach(fragment => expect(commitSource).toContain(fragment));
    ["adminAuditLogs", "import_committed", "memo_import_committed"].forEach(fragment => expect(commitSource).toContain(fragment));
  });
});
