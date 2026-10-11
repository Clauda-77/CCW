import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildMemoPrintHtml } from "@/lib/memoPrint";

const evidenceSource = readFileSync(new URL("./PrintPreviewEvidence.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("دليل معاينة الطباعة الرسمية", () => {
  it("يربط مسار المراجعة بالقالب المولد نفسه وبالصفحة الأولى", () => {
    expect(appSource).toContain('path={"/_print-preview-evidence"}');
    expect(evidenceSource).toContain("srcDoc={buildMemoPrintHtml(referenceMemo)}");
    const markup = buildMemoPrintHtml({ type: "inbound", memoNumber: "22", memoDate: "2026-07-27", warehouseName: "المستودع المركزي", items: [] });
    expect(markup.match(/class="memo-sheet/g)).toHaveLength(1);
    expect(markup).toContain("memo-first-page");
    expect(markup).toContain("قيمة مجموعها");
    expect(markup).toContain("إرسال إلى الطابعة");
  });
});
