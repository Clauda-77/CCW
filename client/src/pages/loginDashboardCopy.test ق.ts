import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("./Login.tsx", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");

describe("واجهة لوحة التحكم وتسجيل الدخول", () => {
  it("تزيل عبارة الترحيب المطلوبة من لوحة المتابعة", () => {
    expect(homeSource).not.toContain("صباح الخير، لنراجع حركة المخزون.");
    expect(homeSource).toContain("الصفحة الرئيسية");
    expect(homeSource).not.toContain("لوحة متابعة المستودعات");
    expect(homeSource).not.toContain("أرصدة قيد المتابعة");
    expect(homeSource).not.toContain("مواد منخفضة الرصيد");
    expect(homeSource).not.toContain("واجهة تشغيل عربية");
    expect(homeSource).not.toContain("إصدار التشغيل");
  });

  it("تُبقي صفحة تسجيل الدخول مرئية عند وجود جلسة نشطة وتستخدم النافذة القديمة", () => {
    expect(loginSource).not.toContain('if (isAuthenticated) setLocation("/")');
    expect(loginSource).toContain("تسجيل الدخول");
    expect(loginSource).toContain("legacy-login-window");
    expect(loginSource).toContain("legacy-old-hero");
  });

  it("تعرض تسجيل الدخول بقائمة مستخدمين وزر تسجيل خروج واضحًا دون كلمة محلي", () => {
    expect(loginSource).toContain("users.previewList.useQuery");
    expect(loginSource).toContain("اختر المستخدم");
    expect(loginSource).not.toContain("محلي");
    expect(loginSource).toContain("localLogin.mutate({ userId: Number(localUserId), password: localPassword })");
    expect(loginSource).not.toContain("الدخول بالحساب المعتمد");
    expect(loginSource).not.toContain("startLogin");
    expect(layoutSource).toContain("تسجيل الخروج");
    expect(layoutSource).toContain("<DropdownMenuItem onClick={logout}");
    expect(layoutSource).not.toContain("{user && <Button type=\"button\" onClick={logout}");
  });

  it("تثبت أن الصفحة الرئيسية تستخدم لوحة الهوية القديمة", () => {
    expect(homeSource).toContain("legacy-old-hero");
    expect(homeSource).toContain("legacy-old-metrics");
    expect(homeSource).toContain("مركز الحاسب");
  });

  it("تعرض هوية الموقع الجديدة دون كلمة رصيد", () => {
    expect(indexSource).toContain("<title>مركز الحاسب - المستودعات</title>");
    expect(indexSource).not.toContain("<title>رصيد");
    expect(layoutSource).toContain("مركز الحاسب - المستودعات");
  });
});
