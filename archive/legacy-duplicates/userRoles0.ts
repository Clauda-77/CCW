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
