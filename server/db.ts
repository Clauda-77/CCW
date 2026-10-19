import { randomUUID } from "node:crypto";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  adminAuditLogs,
  financialEntries,
  colleges,
  inventoryBalances,
  materials,
  memoItems,
  memos,
  memoReconciliations,
  parties,
  stockMovements,
  users,
  userWarehouses,
  warehouses,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { assertRoleChangeAllowed } from "./userRoles";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const [existing] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.openId, user.openId))
    .limit(1);
  const incomingName = typeof user.name === "string" ? user.name.trim() : "";
  const safeName = incomingName || existing?.name?.trim() || "";
  if (!safeName) throw new Error("لا يمكن حفظ المستخدم لأن اسمه غير متوفر.");

  const values: InsertUser = {
    openId: user.openId,
    name: safeName,
    lastSignedIn: new Date(),
  };
  const updateSet: Record<string, unknown> = {
    name: safeName,
    lastSignedIn: new Date(),
  };
  for (const field of ["email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

/** تحديث آخر دخول للمستخدم الموجود فقط؛ لا ينشئ سجلاً جديداً. */
export async function touchUserLastSignedIn(openId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.openId, openId));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getWarehouseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: warehouses.id,
      code: warehouses.code,
      name: warehouses.name,
      isActive: warehouses.isActive,
    })
    .from(warehouses)
    .where(eq(warehouses.id, id))
    .limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      warehouseId: sql<number | null>`(select \`uw\`.\`warehouseId\` from \`userwarehouses\` as \`uw\` where \`uw\`.\`userId\` = \`users\`.\`id\` order by \`uw\`.\`id\` desc limit 1)`.as(
        "warehouseId"
      ),
      warehouseName: sql<string | null>`(select \`w\`.\`name\` from \`userwarehouses\` as \`uw\` inner join \`warehouses\` as \`w\` on \`w\`.\`id\` = \`uw\`.\`warehouseId\` where \`uw\`.\`userId\` = \`users\`.\`id\` order by \`uw\`.\`id\` desc limit 1)`.as(
        "warehouseName"
      ),
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn), desc(users.id));
}

export async function listUserWarehouses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: warehouses.id,
      code: warehouses.code,
      name: warehouses.name,
      isActive: warehouses.isActive,
    })
    .from(userWarehouses)
    .innerJoin(warehouses, eq(userWarehouses.warehouseId, warehouses.id))
    .where(eq(userWarehouses.userId, userId))
    .orderBy(warehouses.name);
}

export async function createLocalUser(input: {
  name: string;
  email?: string;
  role: import("../drizzle/schema").WarehouseRole;
  warehouseId: number;
  actorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const warehouse = await getWarehouseById(input.warehouseId);
  if (!warehouse || !warehouse.isActive)
    throw new Error("المستودع المحدد غير موجود أو غير نشط.");
  const normalizedEmail = input.email?.trim() || null;
  if (normalizedEmail) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing) throw new Error("يوجد مستخدم بهذا البريد الإلكتروني.");
  }
  return db.transaction(async tx => {
    const result = await tx.insert(users).values({
      openId: `local-${randomUUID()}`,
      name: input.name.trim(),
      email: normalizedEmail,
      loginMethod: "local",
      role: input.role,
    });
    const id = Number(result[0].insertId);
    await tx.insert(userWarehouses).values({
      userId: id,
      warehouseId: warehouse.id,
      assignedBy: input.actorId,
      assignedAt: new Date(),
    });
    await writeAdminAudit(tx, {
      actorId: input.actorId,
      action: "user_created",
      entityType: "user",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `إضافة مستخدم محلي جديد بالدور ${input.role} والمستودع ${warehouse.name} (#${warehouse.id}).`,
    });
    return { success: true as const, id };
  });
}

export async function updateUserRole(input: {
  id: number;
  role: import("../drizzle/schema").WarehouseRole;
  actorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [target] = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);
  if (!target) throw new Error("المستخدم غير موجود.");
  assertRoleChangeAllowed({
    actorId: input.actorId,
    targetId: target.id,
    targetOpenId: target.openId,
    ownerOpenId: ENV.ownerOpenId,
    role: input.role,
  });
  await db.transaction(async tx => {
    await tx
      .update(users)
      .set({ role: input.role })
      .where(eq(users.id, input.id));
    await tx.insert(adminAuditLogs).values({
      actorId: input.actorId,
      action: "user_role_changed",
      entityType: "user",
      entityId: target.id,
      entityLabel: target.name ?? `#${target.id}`,
      details: `الدور السابق: ${target.role}؛ الدور الجديد: ${input.role}`,
    });
  });
  return { success: true } as const;
}

export async function updateUserWarehouse(input: {
  id: number;
  warehouseId: number;
  actorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const warehouse = await getWarehouseById(input.warehouseId);
  if (!warehouse || !warehouse.isActive) {
    throw new Error("المستودع المحدد غير موجود أو غير نشط.");
  }
  const [target] = await db
    .select({ id: users.id, openId: users.openId, name: users.name })
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);
  if (!target) throw new Error("المستخدم غير موجود.");

  await db.transaction(async tx => {
    await tx.delete(userWarehouses).where(eq(userWarehouses.userId, input.id));
    await tx.insert(userWarehouses).values({
      userId: input.id,
      warehouseId: input.warehouseId,
      assignedBy: input.actorId,
      assignedAt: new Date(),
    });
    await tx.insert(adminAuditLogs).values({
      actorId: input.actorId,
      action: "user_role_changed",
      entityType: "user",
      entityId: target.id,
      entityLabel: target.name ?? `#${target.id}`,
      details: `تغيير المستودع المسند إلى: ${warehouse.name} (#${warehouse.id}).`,
    });
  });
  return { success: true } as const;
}

export async function listAdminAuditLogs(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: adminAuditLogs.id,
      action: adminAuditLogs.action,
      entityType: adminAuditLogs.entityType,
      entityId: adminAuditLogs.entityId,
      entityLabel: adminAuditLogs.entityLabel,
      details: adminAuditLogs.details,
      createdAt: adminAuditLogs.createdAt,
      actorId: users.id,
      actorName: users.name,
    })
    .from(adminAuditLogs)
    .innerJoin(users, eq(adminAuditLogs.actorId, users.id))
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(limit);
}

type AdminAuditInput = {
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  entityLabel: string;
  details: string;
};
async function writeAdminAudit(tx: any, input: AdminAuditInput) {
  await tx.insert(adminAuditLogs).values(input);
}

export async function getWarehouseStatistics(
  input: { fromDate?: Date; toDate?: Date } = {}
) {
  const db = await getDb();
  if (!db)
    return {
      topRequested: [],
      topConsumers: [],
      peakMonths: [],
      coordinationDamage: [],
      criticalMaterials: [],
    };
  const dateConditions = [
    ...(input.fromDate ? [gte(memos.memoDate, input.fromDate)] : []),
    ...(input.toDate ? [lte(memos.memoDate, input.toDate)] : []),
  ];
  const [outboundRows, inboundRows, balanceRows, movementRows] =
    await Promise.all([
      db
        .select({
          memoId: memos.id,
          memoDate: memos.memoDate,
          partyId: memos.partyId,
          partyName: parties.name,
          materialId: materials.id,
          code: materials.code,
          name: materials.name,
          unit: materials.unit,
          quantity: memoItems.quantity,
          notes: memos.notes,
        })
        .from(memoItems)
        .innerJoin(memos, eq(memoItems.memoId, memos.id))
        .innerJoin(materials, eq(memoItems.materialId, materials.id))
        .leftJoin(parties, eq(memos.partyId, parties.id))
        .where(
          and(
            eq(memos.type, "outbound"),
            eq(memos.status, "approved"),
            ...dateConditions
          )
        )
        .limit(50_000),
      db
        .select({
          memoId: memos.id,
          memoDate: memos.memoDate,
          materialId: materials.id,
          quantity: memoItems.quantity,
        })
        .from(memoItems)
        .innerJoin(memos, eq(memoItems.memoId, memos.id))
        .innerJoin(materials, eq(memoItems.materialId, materials.id))
        .where(
          and(
            eq(memos.type, "inbound"),
            eq(memos.status, "approved"),
            ...dateConditions
          )
        )
        .limit(100_000),
      db
        .select({
          materialId: materials.id,
          code: materials.code,
          name: materials.name,
          unit: materials.unit,
          minimumStock: materials.minimumStock,
          balance: sql<string>`coalesce(sum(${inventoryBalances.onHandQuantity}), 0)`,
        })
        .from(materials)
        .leftJoin(
          inventoryBalances,
          eq(inventoryBalances.materialId, materials.id)
        )
        .where(eq(materials.isActive, true))
        .groupBy(
          materials.id,
          materials.code,
          materials.name,
          materials.unit,
          materials.minimumStock
        ),
      db
        .select({ materialId: stockMovements.materialId })
        .from(stockMovements)
        .limit(100_000),
    ]);
  const isCoordinationOrDamage = (notes: string | null) =>
    /تركيب|تنسيق|تلف|عطل|إتلاف/.test(notes ?? "");
  const deliveryRows = outboundRows.filter(
    row => !isCoordinationOrDamage(row.notes)
  );
  const aggregateMaterial = (rows: typeof outboundRows) => {
    const map = new Map<
      number,
      {
        materialId: number;
        code: string;
        name: string;
        unit: string;
        quantity: number;
        memoCount: number;
      }
    >();
    for (const row of rows) {
      const current = map.get(row.materialId) ?? {
        materialId: row.materialId,
        code: row.code,
        name: row.name,
        unit: row.unit,
        quantity: 0,
        memoCount: 0,
      };
      current.quantity += Number(row.quantity ?? 0);
      current.memoCount += 1;
      map.set(row.materialId, current);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.quantity - a.quantity || b.memoCount - a.memoCount
    );
  };
  const consumerMap = new Map<
    number,
    {
      partyId: number | null;
      name: string | null;
      quantity: number;
      memoIds: Set<number>;
    }
  >();
  for (const row of deliveryRows) {
    const key = row.partyId ?? 0;
    const current = consumerMap.get(key) ?? {
      partyId: row.partyId,
      name: row.partyName,
      quantity: 0,
      memoIds: new Set<number>(),
    };
    current.quantity += Number(row.quantity ?? 0);
    current.memoIds.add(row.memoId);
    consumerMap.set(key, current);
  }
  const monthMap = new Map<
    string,
    { month: string; inbound: number; outbound: number; total: number }
  >();
  const addMonth = (
    date: Date | string,
    kind: "inbound" | "outbound",
    quantity: number
  ) => {
    const d = new Date(date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const current = monthMap.get(month) ?? {
      month,
      inbound: 0,
      outbound: 0,
      total: 0,
    };
    current[kind] += quantity;
    current.total += quantity;
    monthMap.set(month, current);
  };
  for (const row of inboundRows)
    addMonth(row.memoDate, "inbound", Number(row.quantity ?? 0));
  for (const row of deliveryRows)
    addMonth(row.memoDate, "outbound", Number(row.quantity ?? 0));
  const movementMaterialIds = new Set(movementRows.map(row => row.materialId));
  const periodMaterialIds = new Set([
    ...outboundRows.map(row => row.materialId),
    ...inboundRows.map(row => row.materialId),
  ]);
  const criticalMaterials = balanceRows
    .map(row => ({
      materialId: row.materialId,
      code: row.code,
      name: row.name,
      balance: Number(row.balance ?? 0),
      minimumStock: Number(row.minimumStock ?? 0),
      isCritical: Number(row.balance ?? 0) <= Number(row.minimumStock ?? 0),
      isStagnant: !movementMaterialIds.has(row.materialId),
    }))
    .filter(
      row =>
        ((!input.fromDate && !input.toDate) ||
          periodMaterialIds.has(row.materialId)) &&
        (row.isCritical || row.isStagnant) &&
        row.balance > 0
    )
    .sort(
      (a, b) =>
        Number(b.isCritical) - Number(a.isCritical) || a.balance - b.balance
    )
    .slice(0, 20);
  return {
    topRequested: aggregateMaterial(deliveryRows).slice(0, 5),
    topConsumers: Array.from(consumerMap.values())
      .map(row => ({
        partyId: row.partyId,
        name: row.name,
        quantity: row.quantity,
        memoCount: row.memoIds.size,
      }))
      .sort((a, b) => b.quantity - a.quantity),
    peakMonths: Array.from(monthMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 12),
    coordinationDamage: aggregateMaterial(
      outboundRows.filter(row => isCoordinationOrDamage(row.notes))
    ).slice(0, 10),
    criticalMaterials,
  };
}

export async function getDeliveredQuantityStatistics(
  input: {
    partyId?: number;
    materialId?: number;
    fromDate?: Date;
    toDate?: Date;
  } = {}
) {
  const db = await getDb();
  if (!db) return { quantity: 0, memoCount: 0, itemCount: 0 };
  const conditions = [eq(memos.type, "outbound"), eq(memos.status, "approved")];
  if (input.partyId) conditions.push(eq(memos.partyId, input.partyId));
  if (input.materialId)
    conditions.push(eq(memoItems.materialId, input.materialId));
  if (input.fromDate) conditions.push(gte(memos.memoDate, input.fromDate));
  if (input.toDate) conditions.push(lte(memos.memoDate, input.toDate));
  const rows = await db
    .select({ memoId: memos.id, quantity: memoItems.quantity })
    .from(memoItems)
    .innerJoin(memos, eq(memoItems.memoId, memos.id))
    .where(and(...conditions))
    .limit(50_000);
  return {
    quantity: rows.reduce((total, row) => total + Number(row.quantity ?? 0), 0),
    memoCount: new Set(rows.map(row => row.memoId)).size,
    itemCount: rows.length,
  };
}
export async function getWarehouseDashboard() {
  const db = await getDb();
  if (!db) {
    return {
      available: false,
      materialCount: 0,
      balanceCount: 0,
      lowStockCount: 0,
      latestMemos: [],
      lowStock: [],
    };
  }

  const [
    materialTotal,
    warehouseTotal,
    balanceTotal,
    memoTotal,
    lowStockTotal,
    latestMemos,
    lowStock,
    mostUsedMaterials,
  ] = await Promise.all([
    db.select({ value: count() }).from(materials),
    db.select({ value: count() }).from(warehouses),
    db.select({ value: count() }).from(inventoryBalances),
    db.select({ value: count() }).from(memos),
    db
      .select({ value: count() })
      .from(materials)
      .innerJoin(
        inventoryBalances,
        eq(inventoryBalances.materialId, materials.id)
      )
      .where(lt(inventoryBalances.onHandQuantity, materials.minimumStock)),
    db
      .select({
        id: memos.id,
        memoNumber: memos.memoNumber,
        type: memos.type,
        status: memos.status,
        memoDate: memos.memoDate,
        partyName: parties.name,
      })
      .from(memos)
      .leftJoin(parties, eq(memos.partyId, parties.id))
      .orderBy(desc(memos.memoDate))
      .limit(6),
    db
      .select({
        id: materials.id,
        code: materials.code,
        name: materials.name,
        unit: materials.unit,
        balance: inventoryBalances.onHandQuantity,
        minimumStock: materials.minimumStock,
      })
      .from(inventoryBalances)
      .innerJoin(materials, eq(inventoryBalances.materialId, materials.id))
      .where(
        and(
          eq(materials.isActive, true),
          lt(inventoryBalances.onHandQuantity, materials.minimumStock)
        )
      )
      .limit(8),
    db
      .select({
        id: materials.id,
        code: materials.code,
        name: materials.name,
        unit: materials.unit,
        usageQuantity: sql<string>`coalesce(sum(${stockMovements.quantityOut}), 0)`,
        movementCount: count(stockMovements.id),
      })
      .from(stockMovements)
      .innerJoin(materials, eq(stockMovements.materialId, materials.id))
      .where(
        and(eq(materials.isActive, true), gt(stockMovements.quantityOut, "0"))
      )
      .groupBy(materials.id, materials.code, materials.name, materials.unit)
      .orderBy(
        desc(sql`sum(${stockMovements.quantityOut})`),
        desc(count(stockMovements.id))
      )
      .limit(8),
  ]);

  return {
    available: true,
    materialCount: materialTotal[0]?.value ?? 0,
    warehouseCount: warehouseTotal[0]?.value ?? 0,
    balanceCount: balanceTotal[0]?.value ?? 0,
    memoCount: memoTotal[0]?.value ?? 0,
    lowStockCount: lowStockTotal[0]?.value ?? 0,
    latestMemos,
    lowStock,
    mostUsedMaterials,
  };
}

export async function listMaterials(search = "", limit = 60) {
  const db = await getDb();
  if (!db) return [];
  const columns = {
    id: materials.id,
    code: materials.code,
    name: materials.name,
    description: materials.description,
    unit: materials.unit,
    barcode: materials.barcode,
    minimumStock: materials.minimumStock,
    isActive: materials.isActive,
  };
  const query = search.trim();
  const materialRows = query
    ? await db
        .select(columns)
        .from(materials)
        .where(
          or(
            like(materials.code, `%${query}%`),
            like(materials.name, `%${query}%`),
            like(materials.barcode, `%${query}%`)
          )
        )
        .limit(limit)
    : await db.select(columns).from(materials).limit(limit);
  if (!materialRows.length) return [];

  const balanceRows = await db
    .select({
      materialId: inventoryBalances.materialId,
      onHandQuantity: inventoryBalances.onHandQuantity,
    })
    .from(inventoryBalances)
    .where(
      inArray(
        inventoryBalances.materialId,
        materialRows.map(row => row.id)
      )
    );
  const currentQuantities = new Map<number, number>();
  for (const balance of balanceRows) {
    currentQuantities.set(
      balance.materialId,
      (currentQuantities.get(balance.materialId) ?? 0) +
        Number(balance.onHandQuantity ?? 0)
    );
  }
  return materialRows.map(material => ({
    ...material,
    currentQuantity: String(currentQuantities.get(material.id) ?? 0),
  }));
}

export async function createMaterial(
  input: {
    code: string;
    name: string;
    description?: string;
    unit: string;
    barcode?: string;
    minimumStock: number;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(materials).values({
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unit: input.unit.trim(),
      barcode: input.barcode?.trim() || null,
      minimumStock: String(input.minimumStock),
      isActive: true,
    });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, {
      actorId,
      action: "material_created",
      entityType: "material",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `إضافة مادة جديدة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.`,
    });
    return { success: true as const, id };
  });
}

export async function updateMaterial(
  id: number,
  input: {
    code: string;
    name: string;
    description?: string;
    unit: string;
    barcode?: string;
    minimumStock: number;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx
      .update(materials)
      .set({
        code: input.code.trim(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        unit: input.unit.trim(),
        barcode: input.barcode?.trim() || null,
        minimumStock: String(input.minimumStock),
      })
      .where(eq(materials.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "material_updated",
      entityType: "material",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `تعديل بيانات المادة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.`,
    });
    return { success: true as const };
  });
}

export async function deactivateMaterial(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [material] = await tx
      .select({ id: materials.id, name: materials.name, code: materials.code })
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);
    if (!material) throw new Error("المادة غير موجودة.");
    await tx
      .update(materials)
      .set({ isActive: false })
      .where(eq(materials.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "material_deactivated",
      entityType: "material",
      entityId: id,
      entityLabel: material.name,
      details: `تعطيل المادة ذات الرمز ${material.code} دون حذف سجلها أو حركاتها التاريخية.`,
    });
    return { success: true as const };
  });
}

export async function deleteMaterial(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [material] = await tx
      .select({ id: materials.id, name: materials.name, code: materials.code })
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);
    if (!material) throw new Error("المادة غير موجودة.");
    const [memoItem] = await tx
      .select({ id: memoItems.id })
      .from(memoItems)
      .where(eq(memoItems.materialId, id))
      .limit(1);
    const [balance] = await tx
      .select({ id: inventoryBalances.id })
      .from(inventoryBalances)
      .where(eq(inventoryBalances.materialId, id))
      .limit(1);
    const [movement] = await tx
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .where(eq(stockMovements.materialId, id))
      .limit(1);
    if (memoItem || balance || movement)
      throw new Error(
        "لا يمكن حذف هذه المادة نهائيًا لأنها مرتبطة بمذكرة أو رصيد أو حركة مخزون تاريخية. تبقى محمية للحفاظ على سلامة السجل."
      );
    await tx.delete(materials).where(eq(materials.id, id));
    await writeAdminAudit(tx, {
      actorId: deletedBy,
      action: "material_deleted",
      entityType: "material",
      entityId: id,
      entityLabel: material.name,
      details: `حذف نهائي لمادة غير مرتبطة: الرمز ${material.code}.`,
    });
    return { success: true as const };
  });
}

export async function getEntitiesOverview() {
  const db = await getDb();
  if (!db) return { warehouses: [], parties: [] };
  const [warehouseRows, partyRows] = await Promise.all([
    db
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        kind: warehouses.kind,
        isActive: warehouses.isActive,
      })
      .from(warehouses)
      .limit(80),
    db
      .select({
        id: parties.id,
        legacyNumber: parties.legacyNumber,
        name: parties.name,
        type: parties.type,
        phone: parties.phone,
        isActive: parties.isActive,
      })
      .from(parties)
      .limit(80),
  ]);
  return { warehouses: warehouseRows, parties: partyRows };
}

export async function listWarehouses(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const columns = {
    id: warehouses.id,
    code: warehouses.code,
    name: warehouses.name,
    kind: warehouses.kind,
    notes: warehouses.notes,
    isActive: warehouses.isActive,
  };
  const term = search.trim();
  return term
    ? db
        .select(columns)
        .from(warehouses)
        .where(
          or(
            like(warehouses.code, `%${term}%`),
            like(warehouses.name, `%${term}%`)
          )
        )
        .limit(limit)
    : db.select(columns).from(warehouses).limit(limit);
}

export async function listParties(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const columns = {
    id: parties.id,
    legacyNumber: parties.legacyNumber,
    name: parties.name,
    type: parties.type,
    phone: parties.phone,
    address: parties.address,
    isActive: parties.isActive,
  };
  const term = search.trim();
  return term
    ? db
        .select(columns)
        .from(parties)
        .where(
          or(
            like(parties.name, `%${term}%`),
            like(parties.legacyNumber, `%${term}%`),
            like(parties.phone, `%${term}%`)
          )
        )
        .limit(limit)
    : db.select(columns).from(parties).limit(limit);
}

export async function createWarehouse(
  input: {
    code: string;
    name: string;
    kind: "central" | "branch" | "storage";
    notes?: string;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(warehouses).values({
      code: input.code.trim(),
      name: input.name.trim(),
      kind: input.kind,
      notes: input.notes?.trim() || null,
      isActive: true,
    });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, {
      actorId,
      action: "warehouse_created",
      entityType: "warehouse",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `إضافة مستودع جديد: الرمز ${input.code.trim()}؛ النوع ${input.kind}.`,
    });
    return { success: true as const, id };
  });
}

export async function updateWarehouse(
  id: number,
  input: {
    code: string;
    name: string;
    kind: "central" | "branch" | "storage";
    notes?: string;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx
      .update(warehouses)
      .set({
        code: input.code.trim(),
        name: input.name.trim(),
        kind: input.kind,
        notes: input.notes?.trim() || null,
      })
      .where(eq(warehouses.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "warehouse_updated",
      entityType: "warehouse",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `تعديل المستودع: الرمز ${input.code.trim()}؛ النوع ${input.kind}.`,
    });
    return { success: true as const };
  });
}

export async function deactivateWarehouse(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [warehouse] = await tx
      .select({ name: warehouses.name, code: warehouses.code })
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);
    if (!warehouse) throw new Error("المستودع غير موجود.");
    await tx
      .update(warehouses)
      .set({ isActive: false })
      .where(eq(warehouses.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "warehouse_deactivated",
      entityType: "warehouse",
      entityId: id,
      entityLabel: warehouse.name,
      details: `تعطيل المستودع ذي الرمز ${warehouse.code} دون حذف سجلاته.`,
    });
    return { success: true as const };
  });
}

export async function deleteWarehouse(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [warehouse] = await tx
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
      })
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);
    if (!warehouse) throw new Error("المستودع غير موجود.");
    const [memo] = await tx
      .select({ id: memos.id })
      .from(memos)
      .where(eq(memos.warehouseId, id))
      .limit(1);
    const [balance] = await tx
      .select({ id: inventoryBalances.id })
      .from(inventoryBalances)
      .where(eq(inventoryBalances.warehouseId, id))
      .limit(1);
    const [movement] = await tx
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .where(eq(stockMovements.warehouseId, id))
      .limit(1);
    if (memo || balance || movement)
      throw new Error(
        "لا يمكن حذف هذا المستودع نهائيًا لأنه مرتبط بمذكرة أو رصيد أو حركة مخزون تاريخية."
      );
    await tx.delete(warehouses).where(eq(warehouses.id, id));
    await writeAdminAudit(tx, {
      actorId: deletedBy,
      action: "warehouse_deleted",
      entityType: "warehouse",
      entityId: id,
      entityLabel: warehouse.name,
      details: `حذف نهائي لمستودع غير مرتبط: الرمز ${warehouse.code}.`,
    });
    return { success: true as const };
  });
}

export async function createParty(
  input: {
    legacyNumber?: string;
    name: string;
    type: "supplier" | "recipient" | "both" | "internal";
    phone?: string;
    address?: string;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(parties).values({
      legacyNumber: input.legacyNumber?.trim() || null,
      name: input.name.trim(),
      type: input.type,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      isActive: true,
    });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, {
      actorId,
      action: "party_created",
      entityType: "party",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `إضافة جهة جديدة من نوع ${input.type}.`,
    });
    return { success: true as const, id };
  });
}

export async function updateParty(
  id: number,
  input: {
    legacyNumber?: string;
    name: string;
    type: "supplier" | "recipient" | "both" | "internal";
    phone?: string;
    address?: string;
  },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx
      .update(parties)
      .set({
        legacyNumber: input.legacyNumber?.trim() || null,
        name: input.name.trim(),
        type: input.type,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
      })
      .where(eq(parties.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "party_updated",
      entityType: "party",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `تعديل جهة من نوع ${input.type}.`,
    });
    return { success: true as const };
  });
}

export async function listColleges(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const term = search.trim();
  const columns = {
    id: colleges.id,
    code: colleges.code,
    name: colleges.name,
    notes: colleges.notes,
    isActive: colleges.isActive,
  };
  return term
    ? db
        .select(columns)
        .from(colleges)
        .where(
          or(like(colleges.name, `%${term}%`), like(colleges.code, `%${term}%`))
        )
        .limit(limit)
    : db.select(columns).from(colleges).limit(limit);
}

export async function createCollege(
  input: { code?: string; name: string; notes?: string },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(colleges).values({
      code: input.code?.trim() || null,
      name: input.name.trim(),
      notes: input.notes?.trim() || null,
      isActive: true,
    });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, {
      actorId,
      action: "college_created",
      entityType: "college",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `إضافة كلية جديدة: الرمز ${input.code?.trim() || "غير محدد"}.`,
    });
    return { success: true as const, id };
  });
}

export async function updateCollege(
  id: number,
  input: { code?: string; name: string; notes?: string },
  actorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx
      .update(colleges)
      .set({
        code: input.code?.trim() || null,
        name: input.name.trim(),
        notes: input.notes?.trim() || null,
      })
      .where(eq(colleges.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "college_updated",
      entityType: "college",
      entityId: id,
      entityLabel: input.name.trim(),
      details: `تعديل كلية: الرمز ${input.code?.trim() || "غير محدد"}.`,
    });
    return { success: true as const };
  });
}

export async function deactivateCollege(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [college] = await tx
      .select({ name: colleges.name, code: colleges.code })
      .from(colleges)
      .where(eq(colleges.id, id))
      .limit(1);
    if (!college) throw new Error("الكلية غير موجودة.");
    await tx
      .update(colleges)
      .set({ isActive: false })
      .where(eq(colleges.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "college_deactivated",
      entityType: "college",
      entityId: id,
      entityLabel: college.name,
      details: `تعطيل كلية: الرمز ${college.code || "غير محدد"}.`,
    });
    return { success: true as const };
  });
}

export async function deactivateParty(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [party] = await tx
      .select({ name: parties.name })
      .from(parties)
      .where(eq(parties.id, id))
      .limit(1);
    if (!party) throw new Error("الجهة غير موجودة.");
    await tx.update(parties).set({ isActive: false }).where(eq(parties.id, id));
    await writeAdminAudit(tx, {
      actorId,
      action: "party_deactivated",
      entityType: "party",
      entityId: id,
      entityLabel: party.name,
      details: "تعطيل الجهة دون حذف مذكراتها أو سجلاتها التاريخية.",
    });
    return { success: true as const };
  });
}

type MemoClassification = "purchase" | "adjustment" | "transfer" | "return";

const legacyMemoClassification = (
  type: "inbound" | "outbound",
  notes?: string | null
): MemoClassification => {
  const value = notes ?? "";
  if (type === "outbound")
    return /تركيب|تنسيق|تحويل/.test(value) ? "transfer" : "adjustment";
  return /إدخال مواد قديمة|إرجاع|مرتجع/.test(value) ? "return" : "purchase";
};

export async function listMemos(type: "inbound" | "outbound", limit = 60) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: memos.id,
      memoNumber: memos.memoNumber,
      type: memos.type,
      notes: memos.notes,
      status: memos.status,
      memoDate: memos.memoDate,
      folderNumber: memos.folderNumber,
      orderNumber: memos.orderNumber,
      invoiceNumber: memos.invoiceNumber,
      referenceNumber: memos.referenceNumber,
      warehouseId: memos.warehouseId,
      partyName: parties.name,
      partyType: parties.type,
      warehouseName: warehouses.name,
    })
    .from(memos)
    .leftJoin(parties, eq(memos.partyId, parties.id))
    .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
    .where(eq(memos.type, type))
    .orderBy(desc(memos.memoDate))
    .limit(limit);
  return rows.map(row => ({
    ...row,
    classification: legacyMemoClassification(row.type, row.notes),
  }));
}

export async function createFinancialEntry(input: {
  entryNumber: string;
  entryDate: Date;
  warehouseId: number;
  invoiceNumber?: string;
  referenceNumber?: string;
  amount: number;
  currency?: string;
  description?: string;
  source?: "manual" | "excel" | "legacy";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(financialEntries).values({
      entryNumber: input.entryNumber.trim(),
      entryDate: input.entryDate,
      warehouseId: input.warehouseId,
      invoiceNumber: input.invoiceNumber?.trim() || null,
      referenceNumber: input.referenceNumber?.trim() || null,
      amount: String(input.amount),
      currency: input.currency?.trim() || "SYP",
      description: input.description?.trim() || null,
      source: input.source ?? "manual",
      createdBy: input.createdBy,
    });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, {
      actorId: input.createdBy,
      action: "financial_entry_created",
      entityType: "import_batch",
      entityId: id,
      entityLabel: input.entryNumber.trim(),
      details: `إضافة قيد مالي بقيمة ${input.amount} ${input.currency ?? "SYP"}.`,
    });
    return { success: true as const, id };
  });
}

export async function listFinancialEntries(warehouseIds?: number[] | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = warehouseIds?.length
    ? [inArray(financialEntries.warehouseId, warehouseIds)]
    : [];
  return db
    .select({
      id: financialEntries.id,
      entryNumber: financialEntries.entryNumber,
      entryDate: financialEntries.entryDate,
      warehouseId: financialEntries.warehouseId,
      invoiceNumber: financialEntries.invoiceNumber,
      disbursementNumber: financialEntries.disbursementNumber,
      receiptMemoNumber: financialEntries.receiptMemoNumber,
      referenceNumber: financialEntries.referenceNumber,
      amount: financialEntries.amount,
      currency: financialEntries.currency,
      description: financialEntries.description,
      source: financialEntries.source,
      warehouseName: warehouses.name,
    })
    .from(financialEntries)
    .innerJoin(warehouses, eq(financialEntries.warehouseId, warehouses.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(financialEntries.entryDate), desc(financialEntries.id));
}

export async function reconcileMemo(memoId: number, matchedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select({
        id: memos.id,
        warehouseId: memos.warehouseId,
        memoNumber: memos.memoNumber,
        invoiceNumber: memos.invoiceNumber,
        referenceNumber: memos.referenceNumber,
      })
      .from(memos)
      .where(eq(memos.id, memoId))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    const [totals] = await tx
      .select({ total: sql<string>`coalesce(sum(${memoItems.quantity} * coalesce(${memoItems.unitPrice}, 0)), 0)` })
      .from(memoItems)
      .where(eq(memoItems.memoId, memoId));
    const keys = [memo.invoiceNumber, memo.referenceNumber, memo.memoNumber]
      .filter(Boolean)
      .map(value => String(value));
    const candidates = await tx
      .select()
      .from(financialEntries)
      .where(
        and(
          eq(financialEntries.warehouseId, memo.warehouseId),
          or(
            ...keys.flatMap(key => [
              eq(financialEntries.entryNumber, key),
              eq(financialEntries.invoiceNumber, key),
              eq(financialEntries.referenceNumber, key),
              eq(financialEntries.receiptMemoNumber, key),
            ])
          )
        )
      )
      .limit(1);
    const entry = candidates[0];
    const memoTotal = Number(totals?.total ?? 0);
    const entryAmount = Number(entry?.amount ?? 0);
    const receiptMemoMatches = !entry?.receiptMemoNumber || entry.receiptMemoNumber === memo.memoNumber;
    const status = !entry
      ? "not_found"
      : receiptMemoMatches && Math.abs(memoTotal - entryAmount) < 0.01
        ? "matched"
        : "mismatch";
    const differenceAmount = entry ? memoTotal - entryAmount : memoTotal;
    await tx.delete(memoReconciliations).where(eq(memoReconciliations.memoId, memoId));
    await tx.insert(memoReconciliations).values({
      memoId,
      financialEntryId: entry?.id ?? null,
      status,
      differenceAmount: String(differenceAmount),
      matchedBy,
      matchedAt: new Date(),
      notes: status === "not_found"
        ? "لم يتم العثور على قيد مالي مطابق."
        : !receiptMemoMatches
          ? `رقم مذكرة الاستلام في المالية (${entry?.receiptMemoNumber}) لا يطابق مذكرة المستودع (${memo.memoNumber}).`
          : null,
    });
    await writeAdminAudit(tx, {
      actorId: matchedBy,
      action: "memo_reconciled",
      entityType: "memo",
      entityId: memoId,
      entityLabel: memo.memoNumber,
      details: `نتيجة المطابقة المالية: ${status}؛ الفرق ${differenceAmount}.`,
    });
    return {
      status,
      memoTotal,
      financialTotal: entry ? entryAmount : null,
      differenceAmount,
      financialEntry: entry ?? null,
    };
  });
}

export async function getMemoReconciliation(memoId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      id: memoReconciliations.id,
      memoId: memoReconciliations.memoId,
      financialEntryId: memoReconciliations.financialEntryId,
      status: memoReconciliations.status,
      differenceAmount: memoReconciliations.differenceAmount,
      matchedAt: memoReconciliations.matchedAt,
      notes: memoReconciliations.notes,
      entryNumber: financialEntries.entryNumber,
      financialAmount: financialEntries.amount,
    })
    .from(memoReconciliations)
    .leftJoin(financialEntries, eq(memoReconciliations.financialEntryId, financialEntries.id))
    .where(eq(memoReconciliations.memoId, memoId))
    .limit(1);
  return row ?? null;
}

export async function getNextMemoSerialNumber() {
  const db = await getDb();
  if (!db) return "1";
  const rows = await db.select({ memoNumber: memos.memoNumber }).from(memos);
  const latestSerial = rows.reduce((highest, row) => {
    const value = String(row.memoNumber).trim();
    return /^\d+$/.test(value) ? Math.max(highest, Number(value)) : highest;
  }, 0);
  return String(latestSerial + 1);
}

export async function getNextMemoId() {
  const db = await getDb();
  if (!db) return "1";
  const [latestMemo] = await db
    .select({ id: memos.id })
    .from(memos)
    .orderBy(desc(memos.id))
    .limit(1);
  return String((latestMemo?.id ?? 0) + 1);
}

export async function listJournalLines(input: {
  type: "inbound" | "outbound";
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memos.type, input.type), eq(memos.status, "approved")];
  if (input.fromDate) conditions.push(gte(memos.memoDate, input.fromDate));
  if (input.toDate) conditions.push(lte(memos.memoDate, input.toDate));
  return db
    .select({
      id: memoItems.id,
      memoId: memos.id,
      memoNumber: memos.memoNumber,
      memoDate: memos.memoDate,
      memoStatus: memos.status,
      notes: memos.notes,
      materialCode: materials.code,
      materialName: materials.name,
      materialDescription: materials.description,
      unit: materials.unit,
      warehouseId: memos.warehouseId,
      quantity: memoItems.quantity,
      partyName: parties.name,
      warehouseName: warehouses.name,
    })
    .from(memoItems)
    .innerJoin(memos, eq(memoItems.memoId, memos.id))
    .innerJoin(materials, eq(memoItems.materialId, materials.id))
    .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
    .leftJoin(parties, eq(memos.partyId, parties.id))
    .where(and(...conditions))
    .orderBy(memos.memoDate, memos.id, memoItems.id)
    .limit(input.limit ?? 10_000);
}

export async function createMemo(input: {
  type: "inbound" | "outbound";
  classification: MemoClassification;
  memoNumber: string;
  warehouseId: number;
  partyId?: number;
  folderNumber?: string;
  orderNumber?: string;
  orderDate?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  referenceNumber?: string;
  memoDate: Date;
  notes?: string;
  createdBy: number;
  items: Array<{
    materialId: number;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (input.items.length === 0)
    throw new Error("أضف بند مادة واحدًا على الأقل إلى المذكرة.");
  return db.transaction(async tx => {
    const status =
      input.type === "outbound"
        ? ("pending_review" as const)
        : ("draft" as const);
    const memoNumber = input.memoNumber.trim();
    if (input.partyId) {
      const [party] = await tx
        .select({ type: parties.type })
        .from(parties)
        .where(eq(parties.id, input.partyId))
        .limit(1);
      const allowed =
        input.classification === "purchase"
          ? ["supplier", "both"]
          : input.classification === "transfer"
            ? ["internal", "both"]
            : ["recipient", "internal", "both"];
      if (!party || !allowed.includes(party.type))
        throw new Error("نوع الجهة المختارة لا يطابق نوع المذكرة.");
    }
    const [existing] = await tx
      .select({ id: memos.id, status: memos.status })
      .from(memos)
      .where(and(eq(memos.type, input.type), eq(memos.memoNumber, memoNumber)))
      .limit(1);
    if (existing)
      throw new Error(
        `رقم المذكرة ${memoNumber} موجود مسبقًا ضمن هذا النوع وحالتها «${existing.status}». افتح السجل الموجود للمعاينة بدل إنشاء نسخة مكررة.`
      );
    const financialNumber =
      input.classification === "purchase" || input.classification === "transfer"
        ? memoNumber
        : null;
    const result = await tx.insert(memos).values({
      type: input.type,
      memoNumber,
      status,
      warehouseId: input.warehouseId,
      partyId: input.partyId ?? null,
      folderNumber: input.folderNumber?.trim() || null,
      orderNumber: input.orderNumber?.trim() || null,
      orderDate: input.orderDate ?? null,
      invoiceNumber: input.invoiceNumber?.trim() || null,
      invoiceDate: input.invoiceDate ?? null,
      referenceNumber: financialNumber,
      memoDate: input.memoDate,
      notes: input.notes?.trim() || null,
      createdBy: input.createdBy,
    });
    const memoId = Number(result[0].insertId);
    await tx.insert(memoItems).values(
      input.items.map(item => ({
        memoId,
        materialId: item.materialId,
        quantity: String(item.quantity),
        unitPrice: item.unitPrice === undefined ? null : String(item.unitPrice),
        notes: item.notes?.trim() || null,
      }))
    );
    await writeAdminAudit(tx, {
      actorId: input.createdBy,
      action: "memo_created",
      entityType: "memo",
      entityId: memoId,
      entityLabel: memoNumber,
      details: `إنشاء مذكرة ${input.type === "inbound" ? "إدخال" : "تسليم"} بعدد ${input.items.length} مادة؛ الحالة ${status}.`,
    });
    return { success: true as const, id: memoId, status };
  });
}

export async function getMemoDetails(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [header] = await db
    .select({
      id: memos.id,
      type: memos.type,
      memoNumber: memos.memoNumber,
      status: memos.status,
      warehouseId: memos.warehouseId,
      partyId: memos.partyId,
      memoDate: memos.memoDate,
      folderNumber: memos.folderNumber,
      orderNumber: memos.orderNumber,
      orderDate: memos.orderDate,
      invoiceNumber: memos.invoiceNumber,
      invoiceDate: memos.invoiceDate,
      referenceNumber: memos.referenceNumber,
      notes: memos.notes,
      partyName: parties.name,
      partyType: parties.type,
      warehouseName: warehouses.name,
    })
    .from(memos)
    .leftJoin(parties, eq(memos.partyId, parties.id))
    .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
    .where(eq(memos.id, id))
    .limit(1);
  if (!header) throw new Error("المذكرة غير موجودة.");
  const items = await db
    .select({
      id: memoItems.id,
      materialId: memoItems.materialId,
      code: materials.code,
      name: materials.name,
      unit: materials.unit,
      quantity: memoItems.quantity,
      unitPrice: memoItems.unitPrice,
      notes: memoItems.notes,
    })
    .from(memoItems)
    .innerJoin(materials, eq(memoItems.materialId, materials.id))
    .where(eq(memoItems.memoId, id));
  return { ...header, items };
}

export async function updateMemo(input: {
  id: number;
  classification: MemoClassification;
  memoNumber: string;
  warehouseId: number;
  partyId?: number;
  folderNumber?: string;
  orderNumber?: string;
  orderDate?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  referenceNumber?: string;
  memoDate: Date;
  notes?: string;
  updatedBy: number;
  items: Array<{
    materialId: number;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (!input.items.length)
    throw new Error("أضف بند مادة واحدًا على الأقل إلى المذكرة.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select({ id: memos.id, type: memos.type, status: memos.status })
      .from(memos)
      .where(eq(memos.id, input.id))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status !== "draft" && memo.status !== "pending_review")
      throw new Error("يمكن تعديل المذكرات قبل الاعتماد فقط.");
    if (input.partyId) {
      const [party] = await tx
        .select({ type: parties.type })
        .from(parties)
        .where(eq(parties.id, input.partyId))
        .limit(1);
      const allowed =
        input.classification === "purchase"
          ? ["supplier", "both"]
          : input.classification === "transfer"
            ? ["internal", "both"]
            : ["recipient", "internal", "both"];
      if (!party || !allowed.includes(party.type))
        throw new Error("نوع الجهة المختارة لا يطابق نوع المذكرة.");
    }
    const duplicate = await tx
      .select({ id: memos.id })
      .from(memos)
      .where(
        and(
          eq(memos.type, memo.type),
          eq(memos.memoNumber, input.memoNumber.trim()),
          sql`${memos.id} <> ${input.id}`
        )
      )
      .limit(1);
    if (duplicate.length)
      throw new Error(`رقم المذكرة ${input.memoNumber.trim()} موجود مسبقًا.`);
    const financialNumber =
      input.classification === "purchase" || input.classification === "transfer"
        ? input.memoNumber.trim()
        : null;
    await tx
      .update(memos)
      .set({
        memoNumber: input.memoNumber.trim(),
        warehouseId: input.warehouseId,
        partyId: input.partyId ?? null,
        folderNumber: input.folderNumber?.trim() || null,
        orderNumber: input.orderNumber?.trim() || null,
        orderDate: input.orderDate ?? null,
        invoiceNumber: input.invoiceNumber?.trim() || null,
        invoiceDate: input.invoiceDate ?? null,
        referenceNumber: financialNumber,
        memoDate: input.memoDate,
        notes: input.notes?.trim() || null,
      })
      .where(eq(memos.id, input.id));
    await tx.delete(memoItems).where(eq(memoItems.memoId, input.id));
    await tx.insert(memoItems).values(
      input.items.map(item => ({
        memoId: input.id,
        materialId: item.materialId,
        quantity: String(item.quantity),
        unitPrice: item.unitPrice === undefined ? null : String(item.unitPrice),
        notes: item.notes?.trim() || null,
      }))
    );
    await writeAdminAudit(tx, {
      actorId: input.updatedBy,
      action: "memo_created",
      entityType: "memo",
      entityId: input.id,
      entityLabel: input.memoNumber.trim(),
      details: `تعديل المذكرة: تحديث الرأس واستبدال ${input.items.length} مادة.`,
    });
    return { success: true as const, id: input.id };
  });
}

export async function reviewMemo(id: number, reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select({ memoNumber: memos.memoNumber })
      .from(memos)
      .where(eq(memos.id, id))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    const result = await tx
      .update(memos)
      .set({ reviewedBy, reviewedAt: new Date(), status: "pending_review" })
      .where(eq(memos.id, id));
    await writeAdminAudit(tx, {
      actorId: reviewedBy,
      action: "memo_reviewed",
      entityType: "memo",
      entityId: id,
      entityLabel: memo.memoNumber,
      details: "إرسال المذكرة أو مراجعتها ضمن مسار الاعتماد.",
    });
    return { success: true as const, affected: result[0].affectedRows };
  });
}

export async function cancelMemo(id: number, cancelledBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select({
        id: memos.id,
        memoNumber: memos.memoNumber,
        status: memos.status,
        notes: memos.notes,
      })
      .from(memos)
      .where(eq(memos.id, id))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status === "approved")
      throw new Error(
        "لا يمكن إلغاء مذكرة معتمدة؛ حفاظًا على سلامة الرصيد والحركة التاريخية."
      );
    await tx
      .update(memos)
      .set({
        status: "cancelled",
        reviewedBy: cancelledBy,
        reviewedAt: new Date(),
        notes: `${memo.notes || ""}${memo.notes ? " — " : ""}أُلغيت إداريًا دون حذف السجل.`,
      })
      .where(eq(memos.id, id));
    await writeAdminAudit(tx, {
      actorId: cancelledBy,
      action: "memo_cancelled",
      entityType: "memo",
      entityId: id,
      entityLabel: memo.memoNumber,
      details: "إلغاء إداري للمذكرة من دون حذف سجلها.",
    });
    return { success: true as const };
  });
}

export async function approveMemo(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select()
      .from(memos)
      .where(eq(memos.id, id))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status === "approved")
      return { success: true as const, alreadyApproved: true };
    const items = await tx
      .select()
      .from(memoItems)
      .where(eq(memoItems.memoId, id));
    for (const item of items) {
      const quantity = Number(item.quantity);
      const [balance] = await tx
        .select()
        .from(inventoryBalances)
        .where(
          and(
            eq(inventoryBalances.materialId, item.materialId),
            eq(inventoryBalances.warehouseId, memo.warehouseId)
          )
        )
        .limit(1);
      if (
        memo.type === "outbound" &&
        (!balance || Number(balance.onHandQuantity) < quantity)
      )
        throw new Error("لا يتوفر رصيد كافٍ لاعتماد إحدى مواد المذكرة.");
      if (balance) {
        const updatedQuantity =
          memo.type === "inbound"
            ? sql`${inventoryBalances.onHandQuantity} + ${quantity}`
            : sql`${inventoryBalances.onHandQuantity} - ${quantity}`;
        await tx
          .update(inventoryBalances)
          .set({ onHandQuantity: updatedQuantity })
          .where(eq(inventoryBalances.id, balance.id));
      } else {
        await tx.insert(inventoryBalances).values({
          materialId: item.materialId,
          warehouseId: memo.warehouseId,
          partyId: memo.partyId,
          openingQuantity: "0",
          onHandQuantity: String(quantity),
          reservedQuantity: "0",
        });
      }
      await tx.insert(stockMovements).values({
        materialId: item.materialId,
        warehouseId: memo.warehouseId,
        partyId: memo.partyId,
        memoId: memo.id,
        memoItemId: item.id,
        movementType: memo.type,
        quantityIn: String(memo.type === "inbound" ? quantity : 0),
        quantityOut: String(memo.type === "outbound" ? quantity : 0),
        occurredAt: memo.memoDate,
        createdBy: approvedBy,
      });
    }
    await tx
      .update(memos)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
      })
      .where(eq(memos.id, id));
    await writeAdminAudit(tx, {
      actorId: approvedBy,
      action: "memo_approved",
      entityType: "memo",
      entityId: id,
      entityLabel: memo.memoNumber,
      details: `اعتماد المذكرة وإنشاء ${items.length} حركة مخزون مرتبطة بها.`,
    });
    return { success: true as const, alreadyApproved: false };
  });
}

export async function listInventoryBalances(options?: {
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  onlyMoved?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = options?.limit ?? 10_000;
  const term = options?.search?.trim();
  const materialSearch = term
    ? or(
        like(materials.code, `%${term}%`),
        like(materials.name, `%${term}%`),
        like(materials.barcode, `%${term}%`)
      )
    : undefined;
  const pageMaterials = await db
    .select({
      id: materials.id,
      code: materials.code,
      name: materials.name,
      description: materials.description,
      unit: materials.unit,
      minimumStock: materials.minimumStock,
    })
    .from(materials)
    .where(materialSearch)
    .orderBy(materials.code, materials.id)
    .limit(limit)
    .offset(options?.offset ?? 0);
  if (!pageMaterials.length) return [];

  const materialIds = pageMaterials.map(material => material.id);
  const movementFilters = [inArray(stockMovements.materialId, materialIds)];
  if (options?.fromDate)
    movementFilters.push(gte(stockMovements.occurredAt, options.fromDate));
  if (options?.toDate)
    movementFilters.push(lte(stockMovements.occurredAt, options.toDate));
  const openingMovementFilters = [
    inArray(stockMovements.materialId, materialIds),
  ];
  if (options?.fromDate)
    openingMovementFilters.push(
      lt(stockMovements.occurredAt, options.fromDate)
    );
  const [balanceRows, movementRows, openingMovementRows] = await Promise.all([
    db
      .select({
        id: inventoryBalances.id,
        materialId: inventoryBalances.materialId,
        warehouseId: inventoryBalances.warehouseId,
        partyId: inventoryBalances.partyId,
        openingQuantity: inventoryBalances.openingQuantity,
        onHandQuantity: inventoryBalances.onHandQuantity,
        warehouseName: warehouses.name,
        partyName: parties.name,
      })
      .from(inventoryBalances)
      .leftJoin(warehouses, eq(inventoryBalances.warehouseId, warehouses.id))
      .leftJoin(parties, eq(inventoryBalances.partyId, parties.id))
      .where(inArray(inventoryBalances.materialId, materialIds)),
    db
      .select({
        materialId: stockMovements.materialId,
        movementType: stockMovements.movementType,
        quantityIn: stockMovements.quantityIn,
        quantityOut: stockMovements.quantityOut,
        notes: memos.notes,
      })
      .from(stockMovements)
      .leftJoin(memos, eq(stockMovements.memoId, memos.id))
      .where(and(...movementFilters)),
    db
      .select({
        materialId: stockMovements.materialId,
        quantityIn: stockMovements.quantityIn,
        quantityOut: stockMovements.quantityOut,
      })
      .from(stockMovements)
      .where(and(...openingMovementFilters)),
  ]);

  return pageMaterials
    .map(material => {
      const balances = balanceRows.filter(
        row => row.materialId === material.id
      );
      const movements = movementRows.filter(
        row => row.materialId === material.id
      );
      const openingMovements = openingMovementRows.filter(
        row => row.materialId === material.id
      );
      const quantities = movements.reduce(
        (total, row) => {
          const quantityIn = Number(row.quantityIn ?? 0);
          const quantityOut = Number(row.quantityOut ?? 0);
          const notes = row.notes ?? "";
          if (
            row.movementType === "inbound" ||
            row.movementType === "transfer_in"
          )
            total.inbound += quantityIn;
          if (
            row.movementType === "outbound" ||
            row.movementType === "transfer_out"
          )
            total.outbound += quantityOut;
          if (row.movementType === "inbound" && notes.includes("استلام"))
            total.receipt += quantityIn;
          if (
            row.movementType === "inbound" &&
            (notes.includes("إدخال") || notes.includes("إرجاع"))
          )
            total.returned += quantityIn;
          return total;
        },
        { inbound: 0, outbound: 0, receipt: 0, returned: 0 }
      );
      const locations = Array.from(
        new Set(
          balances
            .map(row => row.partyName || row.warehouseName)
            .filter(Boolean)
        )
      );
      const firstBalance = balances[0];
      const storedOpeningQuantity = balances.reduce(
        (total, row) => total + Number(row.openingQuantity ?? 0),
        0
      );
      const openingQuantity =
        storedOpeningQuantity +
        (options?.fromDate
          ? openingMovements.reduce(
              (total, row) =>
                total +
                Number(row.quantityIn ?? 0) -
                Number(row.quantityOut ?? 0),
              0
            )
          : 0);
      const periodInbound = movements.reduce(
        (total, row) => total + Number(row.quantityIn ?? 0),
        0
      );
      const periodOutbound = movements.reduce(
        (total, row) => total + Number(row.quantityOut ?? 0),
        0
      );
      const remainingQuantity =
        openingQuantity + periodInbound - periodOutbound;
      return {
        id: firstBalance?.id ?? -material.id,
        materialId: material.id,
        warehouseId: firstBalance?.warehouseId ?? 0,
        partyId: firstBalance?.partyId ?? null,
        code: material.code,
        name: material.name,
        description: material.description,
        unit: material.unit,
        openingQuantity: String(openingQuantity),
        onHandQuantity: String(remainingQuantity),
        minimumStock: material.minimumStock,
        warehouseName:
          locations.length <= 1
            ? (locations[0] ?? "")
            : "متعدد الجهات / المستودعات",
        partyName: null,
        inboundQuantity: String(quantities.inbound),
        receiptQuantity: String(quantities.receipt),
        returnQuantity: String(quantities.returned),
        outboundQuantity: String(quantities.outbound),
      };
      // الجرد السنوي يعرض كل مادة لها رصيد تاريخي متبقٍ حتى تاريخ النهاية، حتى لو لم تتحرك خلال السنة.
    })
    .filter(row => Number(row.onHandQuantity) > 0);
}

export async function listInventoryBalancePage(options?: {
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { rows: [], hasMore: false, total: 0 };
  const pageSize = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const offset = options?.offset ?? 0;
  const allRows = await listInventoryBalances({
    ...options,
    limit: 20_000,
    offset: 0,
  });
  const total = allRows.length;
  const rows = allRows.slice(offset, offset + pageSize);
  return { rows, hasMore: offset + rows.length < total, total };
}

export async function getMaterialWarehouseBalance(input: {
  materialId: number;
  warehouseId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [[material], [warehouse], [balance]] = await Promise.all([
    db
      .select({
        id: materials.id,
        code: materials.code,
        name: materials.name,
        unit: materials.unit,
      })
      .from(materials)
      .where(eq(materials.id, input.materialId))
      .limit(1),
    db
      .select({ id: warehouses.id, name: warehouses.name })
      .from(warehouses)
      .where(eq(warehouses.id, input.warehouseId))
      .limit(1),
    db
      .select({
        quantity: sql<string>`coalesce(sum(${inventoryBalances.onHandQuantity}), 0)`,
      })
      .from(inventoryBalances)
      .where(
        and(
          eq(inventoryBalances.materialId, input.materialId),
          eq(inventoryBalances.warehouseId, input.warehouseId)
        )
      ),
  ]);
  if (!material || !warehouse) return null;
  return {
    materialId: material.id,
    materialCode: material.code,
    materialName: material.name,
    unit: material.unit,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    quantity: String(balance?.quantity ?? "0"),
  };
}

export async function getMaterialWarehouseCostEstimate(input: {
  materialId: number;
  warehouseId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [latestPurchase] = await db
    .select({
      unitPrice: memoItems.unitPrice,
      memoNumber: memos.memoNumber,
      memoDate: memos.memoDate,
    })
    .from(memoItems)
    .innerJoin(memos, eq(memoItems.memoId, memos.id))
    .where(
      and(
        eq(memoItems.materialId, input.materialId),
        eq(memos.warehouseId, input.warehouseId),
        eq(memos.type, "inbound"),
        eq(memos.status, "approved"),
        gt(memos.id, 0),
        sql`${memoItems.unitPrice} IS NOT NULL`,
        sql`(${memos.notes} IS NULL OR (${memos.notes} NOT LIKE '%إدخال مواد قديمة%' AND ${memos.notes} NOT LIKE '%إرجاع%' AND ${memos.notes} NOT LIKE '%مرتجع%'))`
      )
    )
    .orderBy(desc(memos.memoDate), desc(memos.id), desc(memoItems.id))
    .limit(1);
  return latestPurchase ?? null;
}

export async function getMaterialCard(input: {
  materialId: number;
  warehouseId?: number;
  partyId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const hasLocationScope = input.warehouseId !== undefined;
  const scope = hasLocationScope
    ? and(
        eq(inventoryBalances.materialId, input.materialId),
        eq(inventoryBalances.warehouseId, input.warehouseId!),
        sql`${inventoryBalances.partyId} <=> ${input.partyId ?? null}`
      )
    : eq(inventoryBalances.materialId, input.materialId);
  const balances = await db
    .select({
      id: inventoryBalances.id,
      openingQuantity: inventoryBalances.openingQuantity,
    })
    .from(inventoryBalances)
    .where(scope);
  const [material] = await db
    .select({
      code: materials.code,
      name: materials.name,
      description: materials.description,
      unit: materials.unit,
      minimumStock: materials.minimumStock,
    })
    .from(materials)
    .where(eq(materials.id, input.materialId))
    .limit(1);
  if (!material) throw new Error("لم يُعثر على المادة المحددة.");
  const movementFields = {
    memoNumber: memos.memoNumber,
    memoDate: memos.memoDate,
    occurredAt: stockMovements.occurredAt,
    movementType: stockMovements.movementType,
    quantityIn: stockMovements.quantityIn,
    quantityOut: stockMovements.quantityOut,
    partyName: parties.name,
    notes: memos.notes,
  };
  const movementBase = hasLocationScope
    ? [
        eq(stockMovements.materialId, input.materialId),
        eq(stockMovements.warehouseId, input.warehouseId!),
      ]
    : [eq(stockMovements.materialId, input.materialId)];
  const scopedMovements = await db
    .select(movementFields)
    .from(stockMovements)
    .leftJoin(memos, eq(stockMovements.memoId, memos.id))
    .leftJoin(parties, eq(stockMovements.partyId, parties.id))
    .where(
      hasLocationScope
        ? and(
            ...movementBase,
            sql`${stockMovements.partyId} <=> ${input.partyId ?? null}`
          )
        : and(...movementBase)
    )
    .orderBy(stockMovements.occurredAt, stockMovements.id);
  // بعض الأرصدة التاريخية لا تحمل الجهة نفسها الموجودة على حركة المذكرة؛ لا نترك بطاقة المادة فارغة عند وجود حركات صحيحة للمادة والمستودع.
  const movements =
    scopedMovements.length > 0
      ? scopedMovements
      : await db
          .select(movementFields)
          .from(stockMovements)
          .leftJoin(memos, eq(stockMovements.memoId, memos.id))
          .leftJoin(parties, eq(stockMovements.partyId, parties.id))
          .where(and(...movementBase))
          .orderBy(stockMovements.occurredAt, stockMovements.id);
  return {
    cardNumber: hasLocationScope ? (balances[0]?.id ?? null) : null,
    openingQuantity: String(
      balances.reduce(
        (total, balance) => total + Number(balance.openingQuantity ?? 0),
        0
      )
    ),
    ...material,
    movements,
  };
}

export const dbSql = sql;

export async function deleteMemo(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx
      .select({
        id: memos.id,
        status: memos.status,
        createdBy: memos.createdBy,
        memoNumber: memos.memoNumber,
      })
      .from(memos)
      .where(eq(memos.id, id))
      .limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status !== "draft" && memo.status !== "pending_review")
      throw new Error(
        "الحذف النهائي متاح لمسودات محاضر التركيب والمذكرات قيد المراجعة فقط؛ المذكرات المعتمدة أو الملغاة تبقى محفوظة."
      );
    const [movement] = await tx
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .where(eq(stockMovements.memoId, id))
      .limit(1);
    if (movement)
      throw new Error(
        "لا يمكن حذف مذكرة مرتبطة بحركة مخزون؛ استخدم الإلغاء الإداري للحفاظ على السجل التاريخي."
      );
    await tx.delete(memoItems).where(eq(memoItems.memoId, id));
    await tx.delete(memos).where(eq(memos.id, id));
    await tx.insert(adminAuditLogs).values({
      actorId: deletedBy,
      action: "memo_deleted",
      entityType: "memo",
      entityId: id,
      entityLabel: memo.memoNumber,
      details: "حذف نهائي لمذكرة مسودة غير مرتبطة بحركات مخزون.",
    });
    return { success: true as const, deletedBy };
  });
}

export async function listFinanceReconciliationSummary(warehouseIds?: number[] | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = warehouseIds?.length
    ? [inArray(memos.warehouseId, warehouseIds)]
    : [];
  return db
    .select({
      reconciliationId: memoReconciliations.id,
      status: memoReconciliations.status,
      differenceAmount: memoReconciliations.differenceAmount,
      matchedAt: memoReconciliations.matchedAt,
      memoId: memos.id,
      memoNumber: memos.memoNumber,
      memoDate: memos.memoDate,
      invoiceNumber: memos.invoiceNumber,
      warehouseId: memos.warehouseId,
      warehouseName: warehouses.name,
      financialEntryId: financialEntries.id,
      entryNumber: financialEntries.entryNumber,
      disbursementNumber: financialEntries.disbursementNumber,
      receiptMemoNumber: financialEntries.receiptMemoNumber,
      financialAmount: financialEntries.amount,
    })
    .from(memoReconciliations)
    .innerJoin(memos, eq(memoReconciliations.memoId, memos.id))
    .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
    .leftJoin(financialEntries, eq(memoReconciliations.financialEntryId, financialEntries.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(memoReconciliations.matchedAt), desc(memoReconciliations.id));
}
