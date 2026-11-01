import { describe, expect, it } from "vitest";
import {
  assertRoleChangeAllowed,
  canAccessWarehouse,
  canApproveMemos,
  canManageMaterials,
  canManageMemos,
  canManageUsers,
  canViewAllWarehouses,
  filterWarehouseScope,
  isReadOnly,
} from "./userRoles";

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

describe("مصفوفة صلاحيات الأدوار", () => {
  it("يحصر الإدارة الكاملة والبيانات المرجعية بحساب المدير", () => {
    expect(canViewAllWarehouses("admin")).toBe(true);
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageMaterials("admin")).toBe(true);
    expect(canManageUsers("warehouse_keeper")).toBe(false);
    expect(canManageMaterials("data_entry")).toBe(false);
  });

  it("يسمح بالإنشاء لأمين المستودع ومدخل البيانات فقط دون المراجع", () => {
    expect(canManageMemos("admin")).toBe(true);
    expect(canManageMemos("warehouse_keeper")).toBe(true);
    expect(canManageMemos("data_entry")).toBe(true);
    expect(canManageMemos("reviewer")).toBe(false);
    expect(canManageMemos("user")).toBe(false);
  });

  it("يحصر الاعتماد النهائي بالمراجع والمدير", () => {
    expect(canApproveMemos("reviewer")).toBe(true);
    expect(canApproveMemos("admin")).toBe(true);
    expect(canApproveMemos("warehouse_keeper")).toBe(false);
    expect(canApproveMemos("data_entry")).toBe(false);
  });

  it("يقيد جميع الأدوار غير الإدارية بالمستودعات المسندة", () => {
    expect(filterWarehouseScope("admin", [2])).toBeNull();
    expect(filterWarehouseScope("reviewer", [2])).toEqual([2]);
    expect(canAccessWarehouse("reviewer", [2], 2)).toBe(true);
    expect(canAccessWarehouse("reviewer", [2], 3)).toBe(false);
    expect(isReadOnly("user")).toBe(true);
    expect(isReadOnly("data_entry")).toBe(false);
  });
});
