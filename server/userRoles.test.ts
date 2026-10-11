import { describe, expect, it } from "vitest";
import { assertRoleChangeAllowed } from "./userRoles";

describe("حماية تعديل أدوار المستخدمين", () => {
  it("تسمح للمدير بتعديل دور مستخدم آخر غير مالك النظام", () => {
    expect(() => assertRoleChangeAllowed({ actorId: 1, targetId: 2, targetOpenId: "employee-2", ownerOpenId: "owner-1", role: "reviewer" })).not.toThrow();
  });

  it("تمنع المدير من خفض دوره من جلسته الحالية", () => {
    expect(() => assertRoleChangeAllowed({ actorId: 1, targetId: 1, targetOpenId: "admin-1", ownerOpenId: "owner-1", role: "data_entry" })).toThrow("لا يمكن للمدير تغيير دوره");
  });

  it("تحافظ على دور مالك النظام كمدير", () => {
    expect(() => assertRoleChangeAllowed({ actorId: 2, targetId: 1, targetOpenId: "owner-1", ownerOpenId: "owner-1", role: "warehouse_keeper" })).toThrow("مالك النظام");
  });
});
