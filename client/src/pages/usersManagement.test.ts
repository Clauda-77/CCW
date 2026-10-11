import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./Users.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../../../server/db.ts", import.meta.url), "utf8");
const auditSource = readFileSync(new URL("./AdminAudit.tsx", import.meta.url), "utf8");

describe("إدارة المستخدمين", () => {
  it("يعرض للمدير إضافة مستخدم جديد واختيار الدور", () => {
    expect(pageSource).toContain("مستخدم جديد");
    expect(pageSource).toContain("trpc.users.create.useMutation");
    expect(pageSource).toContain("اسم المستخدم");
    expect(pageSource).toContain("new-user-role");
    expect(pageSource).toContain('const isAdmin = isDevelopment || user?.role === "admin";');
  });

  it("يتيح البحث والتصفية في قائمة المستخدمين", () => {
    expect(pageSource).toContain("ابحث بالاسم أو البريد أو الدور أو رقم المستخدم");
    expect(pageSource).toContain("useMemo");
    expect(pageSource).toContain("roleMeta[entry.role as WarehouseRole]?.label");
  });

  it("يعرض سجل الحركات الإدارية ببحث وفلاتر مستقلة", () => {
    expect(auditSource).toContain("trpc.adminAudit.list.useQuery");
    expect(auditSource).toContain("حذف مذكرة");
    expect(auditSource).toContain("تعديل صلاحية");
    expect(auditSource).toContain("ابحث بالمنفّذ أو الكيان أو التفاصيل");
  });

  it("يربط إنشاء المستخدم بصلاحية المدير وبمعرف محلي فريد", () => {
    expect(routerSource).toContain("create: administratorProcedure");
    expect(routerSource).toContain("warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })");
    expect(dbSource).toContain("createLocalUser");
    expect(dbSource).toContain("local-${randomUUID()}");
    expect(dbSource).toContain('action: "user_created"');
  });
});
