 import type { WarehouseRole } from "../drizzle/schema";

type RoleChangeGuardInput = {
  actorId: number;
  targetId: number;
  targetOpenId: string;
  ownerOpenId: string;
  role: WarehouseRole;
};

export function assertRoleChangeAllowed(input: RoleChangeGuardInput) {
  if (input.actorId === input.targetId) {
    throw new Error("لا يمكن للمدير تغيير دوره من حسابه الحالي. استخدم حساب مدير آخر عند الحاجة.");
  }
  if (input.targetOpenId === input.ownerOpenId && input.role !== "admin") {
    throw new Error("لا يمكن خفض صلاحية مالك النظام عن دور المدير.");
  }
}

// ─────────────────────────────────────────────────
// ✅ صلاحيات المستودعات
// ─────────────────────────────────────────────────

/** هل يشوف كل المستودعات؟ */
export function canViewAllWarehouses(role: WarehouseRole): boolean {
  return role === "admin";
}

/** هل يقدر ينشئ/يعدّل مذكرات؟ */
export function canManageMemos(role: WarehouseRole): boolean {
  return role === "admin" || role === "warehouse_keeper" || role === "data_entry";
}

/** هل يقدر يعتمد المذكرات؟ */
export function canApproveMemos(role: WarehouseRole): boolean {
  return role === "admin" || role === "reviewer";
}

/** هل يقدر يعدّل المواد؟ */
export function canManageMaterials(role: WarehouseRole): boolean {
  return role === "admin";
}

/** هل يقدر يدير المستخدمين والمستودعات؟ */
export function canManageUsers(role: WarehouseRole): boolean {
  return role === "admin";
}

/** هل يقدر يقرأ فقط؟ */
export function isReadOnly(role: WarehouseRole): boolean {
  return role === "user";
}

// ─────────────────────────────────────────────────
// ✅ فلترة المستودعات حسب صلاحية المستخدم
// ─────────────────────────────────────────────────

/**
 * إذا رجع `null` → المستخدم يشوف كل المستودعات (admin/reviewer)
 * إذا رجع مصفوفة → المستخدم يشوف بس المستودعات بهذي القائمة
 */
export function filterWarehouseScope(
  role: WarehouseRole,
  allowedIds: number[]
): number[] | null {
  if (canViewAllWarehouses(role)) return null;
  return allowedIds;
}

/** تحقق إذا المستخدم يقدر يوصل لمستودع معين */
export function canAccessWarehouse(
  role: WarehouseRole,
  allowedIds: number[],
  warehouseId: number
): boolean {
  if (canViewAllWarehouses(role)) return true;
  return allowedIds.includes(warehouseId);
}

// ─────────────────────────────────────────────────
// ✅ أسماء الأدوار بالعربي
// ─────────────────────────────────────────────────

export const roleLabels: Record<WarehouseRole, string> = {
  user: "مستخدم",
  warehouse_keeper: "أمين مستودع",
  data_entry: "مدخل بيانات",
  reviewer: "مراقب مستودع",
  admin: "مدير النظام",
};

export function getRoleLabel(role: WarehouseRole): string {
  return roleLabels[role] ?? role;
}
