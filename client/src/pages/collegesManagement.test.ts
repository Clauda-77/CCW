import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const collegePage = readFileSync(new URL("./Colleges.tsx", import.meta.url), "utf8");
const warehousesPage = readFileSync(new URL("./Warehouses.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../../../drizzle/schema.ts", import.meta.url), "utf8");

describe("عقد دليل الكليات والموردين", () => {
  it("يوفر واجهة كليات مرتبطة بإجراءات البحث والإضافة والتعديل والتعطيل", () => {
    ["أسماء الكليات", "كلية جديدة", "اسم الكلية", "entities.listColleges.useQuery", "entities.createCollege.useMutation", "entities.updateCollege.useMutation", "entities.deactivateCollege.useMutation"].forEach(label => expect(collegePage).toContain(label));
    ["listColleges", "createCollege", "updateCollege", "deactivateCollege"].forEach(label => expect(routerSource).toContain(label));
    expect(schemaSource).toContain('mysqlTable("colleges"');
  });

  it("يوفر رقم المورد والعنوان وزر جهة جديدة في صفحة الجهات", () => {
    ["جهة جديدة / مورد جديد", "رقم المورد", "party-legacy-number", "party-address", "legacyNumber"].forEach(label => expect(warehousesPage).toContain(label));
    expect(routerSource).toContain("legacyNumber: z.string().trim().max(64).optional()");
  });

  it("يبقي مسار الكليات وبياناته متاحين دون عرضه في قائمة التنقل", () => {
    expect(collegePage).toContain("أسماء الكليات");
    expect(layoutSource).not.toContain('label: "أسماء الكليات", path: "/colleges"');
  });
});
