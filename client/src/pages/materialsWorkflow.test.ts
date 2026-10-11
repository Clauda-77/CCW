import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./Materials.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");

describe("عقد إدارة دليل المواد", () => {
  it("يوفر إضافة وتعديلًا للحقول التشغيلية الأساسية مع بحث مباشر", () => {
    ["إضافة مادة", "تعديل المادة", "رمز المادة", "اسم المادة", "الوصف", "الوحدة", "الحد الأدنى", "الباركود", "ابحث بالاسم أو الرمز أو الباركود", "materials.create.useMutation", "materials.update.useMutation"].forEach(label => expect(pageSource).toContain(label));
  });

  it("يوفر حذفًا نهائيًا مشروطًا بالمدير ويحمي المادة المرتبطة", () => {
    expect(pageSource).toContain("materials.delete.useMutation");
    expect(pageSource).toContain("تم حذف المادة نهائيًا");
    expect(pageSource).toContain("مرتبطة بمذكرة أو رصيد أو حركة مخزون");
    expect(pageSource).toContain("const usePreview = isDevelopment && !isAuthenticated");
    expect(pageSource).toContain("const query = usePreview ? previewQuery : liveQuery");
    expect(pageSource).toContain("await utils.materials.previewList.invalidate()");
    expect(routerSource).toContain("delete: administratorProcedure");
    expect(routerSource).toContain("warehouseDb.deleteMaterial(input.id, ctx.user.id)");
    expect(routerSource).toContain("warehouseDb.createMaterial(input, ctx.user.id)");
    expect(routerSource).not.toContain("delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => warehouseDb.deleteMaterial");
  });
});
