// import { randomUUID } from "node:crypto";
// import { and, count, desc, eq, gt, gte, inArray, like, lt, lte, or, sql } from "drizzle-orm";
// import { drizzle } from "drizzle-orm/mysql2";
// import { InsertUser, adminAuditLogs, colleges, inventoryBalances, materials, memoItems, memos, parties, stockMovements, users, warehouses } from "../drizzle/schema";
// import { ENV } from "./_core/env";
// import { assertRoleChangeAllowed } from "./userRoles";

// let _db: ReturnType<typeof drizzle> | null = null;

// export async function getDb() {
//   if (!_db && process.env.DATABASE_URL) {
//     try {
//       _db = drizzle(process.env.DATABASE_URL);
//     } catch (error) {
//       console.warn("[Database] Failed to connect:", error);
//       _db = null;
//     }
//   }
//   return _db;
// }

// export async function upsertUser(user: InsertUser): Promise<void> {
//   if (!user.openId) throw new Error("User openId is required for upsert");
//   const db = await getDb();
//   if (!db) return;

//   const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
//   const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
//   for (const field of ["name", "email", "loginMethod"] as const) {
//     if (user[field] !== undefined) {
//       values[field] = user[field] ?? null;
//       updateSet[field] = user[field] ?? null;
//     }
//   }
//   if (user.role !== undefined) {
//     values.role = user.role;
//     updateSet.role = user.role;
//   } else if (user.openId === ENV.ownerOpenId) {
//     values.role = "admin";
//     updateSet.role = "admin";
//   }

//   await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
// }

// export async function getUserByOpenId(openId: string) {
//   const db = await getDb();
//   if (!db) return undefined;
//   const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
//   return result[0];
// }

// export async function getUserById(id: number) {
//   const db = await getDb();
//   if (!db) return undefined;
//   const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
//   return result[0];
// }

// export async function listUsers() {
//   const db = await getDb();
//   if (!db) return [];
//   return db.select({ id: users.id, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn), desc(users.id));
// }

// export async function createLocalUser(input: { name: string; email?: string; role: import("../drizzle/schema").WarehouseRole; actorId: number }) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   const normalizedEmail = input.email?.trim() || null;
//   if (normalizedEmail) {
//     const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
//     if (existing) throw new Error("يوجد مستخدم بهذا البريد الإلكتروني.");
//   }
//   return db.transaction(async tx => {
//     const result = await tx.insert(users).values({ openId: `local-${randomUUID()}`, name: input.name.trim(), email: normalizedEmail, loginMethod: "local", role: input.role });
//     const id = Number(result[0].insertId);
//     await writeAdminAudit(tx, { actorId: input.actorId, action: "user_created", entityType: "user", entityId: id, entityLabel: input.name.trim(), details: `إضافة مستخدم محلي جديد بالدور ${input.role}.` });
//     return { success: true as const, id };
//   });
// }

// export async function updateUserRole(input: { id: number; role: import("../drizzle/schema").WarehouseRole; actorId: number }) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   const [target] = await db.select({ id: users.id, openId: users.openId, name: users.name, role: users.role }).from(users).where(eq(users.id, input.id)).limit(1);
//   if (!target) throw new Error("المستخدم غير موجود.");
//   assertRoleChangeAllowed({ actorId: input.actorId, targetId: target.id, targetOpenId: target.openId, ownerOpenId: ENV.ownerOpenId, role: input.role });
//   await db.transaction(async tx => {
//     await tx.update(users).set({ role: input.role }).where(eq(users.id, input.id));
//     await tx.insert(adminAuditLogs).values({ actorId: input.actorId, action: "user_role_changed", entityType: "user", entityId: target.id, entityLabel: target.name ?? `#${target.id}`, details: `الدور السابق: ${target.role}؛ الدور الجديد: ${input.role}` });
//   });
//   return { success: true } as const;
// }

// export async function listAdminAuditLogs(limit = 200) {
//   const db = await getDb();
//   if (!db) return [];
//   return db.select({ id: adminAuditLogs.id, action: adminAuditLogs.action, entityType: adminAuditLogs.entityType, entityId: adminAuditLogs.entityId, entityLabel: adminAuditLogs.entityLabel, details: adminAuditLogs.details, createdAt: adminAuditLogs.createdAt, actorId: users.id, actorName: users.name }).from(adminAuditLogs).innerJoin(users, eq(adminAuditLogs.actorId, users.id)).orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id)).limit(limit);
// }

// type AdminAuditInput = { actorId: number; action: string; entityType: string; entityId: number; entityLabel: string; details: string };
// async function writeAdminAudit(tx: any, input: AdminAuditInput) {
//   await tx.insert(adminAuditLogs).values(input);
// }

// export async function getWarehouseDashboard() {
//   const db = await getDb();
//   if (!db) {
//     return { available: false, materialCount: 0, balanceCount: 0, lowStockCount: 0, latestMemos: [], lowStock: [] };
//   }

//   const [materialTotal, warehouseTotal, balanceTotal, memoTotal, lowStockTotal, latestMemos, lowStock, mostUsedMaterials] = await Promise.all([
//     db.select({ value: count() }).from(materials),
//     db.select({ value: count() }).from(warehouses),
//     db.select({ value: count() }).from(inventoryBalances),
//     db.select({ value: count() }).from(memos),
//     db.select({ value: count() }).from(materials).innerJoin(inventoryBalances, eq(inventoryBalances.materialId, materials.id)).where(lt(inventoryBalances.onHandQuantity, materials.minimumStock)),
//     db.select({ id: memos.id, memoNumber: memos.memoNumber, type: memos.type, status: memos.status, memoDate: memos.memoDate, partyName: parties.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).orderBy(desc(memos.memoDate)).limit(6),
//     db.select({ id: materials.id, code: materials.code, name: materials.name, unit: materials.unit, balance: inventoryBalances.onHandQuantity, minimumStock: materials.minimumStock }).from(inventoryBalances).innerJoin(materials, eq(inventoryBalances.materialId, materials.id)).where(and(eq(materials.isActive, true), lt(inventoryBalances.onHandQuantity, materials.minimumStock))).limit(8),
//     db.select({ id: materials.id, code: materials.code, name: materials.name, unit: materials.unit, usageQuantity: sql<string>`coalesce(sum(${stockMovements.quantityOut}), 0)`, movementCount: count(stockMovements.id) }).from(stockMovements).innerJoin(materials, eq(stockMovements.materialId, materials.id)).where(and(eq(materials.isActive, true), gt(stockMovements.quantityOut, "0"))).groupBy(materials.id, materials.code, materials.name, materials.unit).orderBy(desc(sql`sum(${stockMovements.quantityOut})`), desc(count(stockMovements.id))).limit(8),
//   ]);

//   return {
//     available: true,
//     materialCount: materialTotal[0]?.value ?? 0,
//     warehouseCount: warehouseTotal[0]?.value ?? 0,
//     balanceCount: balanceTotal[0]?.value ?? 0,
//     memoCount: memoTotal[0]?.value ?? 0,
//     lowStockCount: lowStockTotal[0]?.value ?? 0,
//     latestMemos,
//     lowStock,
//     mostUsedMaterials,
//   };
// }

// export async function listMaterials(search = "", limit = 60) {
//   const db = await getDb();
//   if (!db) return [];
//   const columns = {
//     id: materials.id,
//     code: materials.code,
//     name: materials.name,
//     description: materials.description,
//     unit: materials.unit,
//     barcode: materials.barcode,
//     minimumStock: materials.minimumStock,
//     isActive: materials.isActive,
//   };
//   const query = search.trim();
//   if (query) {
//     return db.select(columns).from(materials).where(or(like(materials.code, `%${query}%`), like(materials.name, `%${query}%`), like(materials.barcode, `%${query}%`))).limit(limit);
//   }
//   return db.select(columns).from(materials).limit(limit);
// }

// export async function createMaterial(input: { code: string; name: string; description?: string; unit: string; barcode?: string; minimumStock: number }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const result = await tx.insert(materials).values({
//       code: input.code.trim(),
//       name: input.name.trim(),
//       description: input.description?.trim() || null,
//       unit: input.unit.trim(),
//       barcode: input.barcode?.trim() || null,
//       minimumStock: String(input.minimumStock),
//       isActive: true,
//     });
//     const id = Number(result[0].insertId);
//     await writeAdminAudit(tx, { actorId, action: "material_created", entityType: "material", entityId: id, entityLabel: input.name.trim(), details: `إضافة مادة جديدة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.` });
//     return { success: true as const, id };
//   });
// }

// export async function updateMaterial(id: number, input: { code: string; name: string; description?: string; unit: string; barcode?: string; minimumStock: number }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     await tx.update(materials).set({ code: input.code.trim(), name: input.name.trim(), description: input.description?.trim() || null, unit: input.unit.trim(), barcode: input.barcode?.trim() || null, minimumStock: String(input.minimumStock) }).where(eq(materials.id, id));
//     await writeAdminAudit(tx, { actorId, action: "material_updated", entityType: "material", entityId: id, entityLabel: input.name.trim(), details: `تعديل بيانات المادة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.` });
//     return { success: true as const };
//   });
// }

// export async function deactivateMaterial(id: number, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [material] = await tx.select({ id: materials.id, name: materials.name, code: materials.code }).from(materials).where(eq(materials.id, id)).limit(1);
//     if (!material) throw new Error("المادة غير موجودة.");
//     await tx.update(materials).set({ isActive: false }).where(eq(materials.id, id));
//     await writeAdminAudit(tx, { actorId, action: "material_deactivated", entityType: "material", entityId: id, entityLabel: material.name, details: `تعطيل المادة ذات الرمز ${material.code} دون حذف سجلها أو حركاتها التاريخية.` });
//     return { success: true as const };
//   });
// }

// export async function deleteMaterial(id: number, deletedBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [material] = await tx.select({ id: materials.id, name: materials.name, code: materials.code }).from(materials).where(eq(materials.id, id)).limit(1);
//     if (!material) throw new Error("المادة غير موجودة.");
//     const [memoItem] = await tx.select({ id: memoItems.id }).from(memoItems).where(eq(memoItems.materialId, id)).limit(1);
//     const [balance] = await tx.select({ id: inventoryBalances.id }).from(inventoryBalances).where(eq(inventoryBalances.materialId, id)).limit(1);
//     const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.materialId, id)).limit(1);
//     if (memoItem || balance || movement) throw new Error("لا يمكن حذف هذه المادة نهائيًا لأنها مرتبطة بمذكرة أو رصيد أو حركة مخزون تاريخية. تبقى محمية للحفاظ على سلامة السجل.");
//     await tx.delete(materials).where(eq(materials.id, id));
//     await writeAdminAudit(tx, { actorId: deletedBy, action: "material_deleted", entityType: "material", entityId: id, entityLabel: material.name, details: `حذف نهائي لمادة غير مرتبطة: الرمز ${material.code}.` });
//     return { success: true as const };
//   });
// }

// export async function getEntitiesOverview() {
//   const db = await getDb();
//   if (!db) return { warehouses: [], parties: [] };
//   const [warehouseRows, partyRows] = await Promise.all([
//     db.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name, kind: warehouses.kind, isActive: warehouses.isActive }).from(warehouses).limit(80),
//     db.select({ id: parties.id, legacyNumber: parties.legacyNumber, name: parties.name, type: parties.type, phone: parties.phone, isActive: parties.isActive }).from(parties).limit(80),
//   ]);
//   return { warehouses: warehouseRows, parties: partyRows };
// }

// export async function listWarehouses(search = "", limit = 200) {
//   const db = await getDb();
//   if (!db) return [];
//   const columns = { id: warehouses.id, code: warehouses.code, name: warehouses.name, kind: warehouses.kind, notes: warehouses.notes, isActive: warehouses.isActive };
//   const term = search.trim();
//   return term
//     ? db.select(columns).from(warehouses).where(or(like(warehouses.code, `%${term}%`), like(warehouses.name, `%${term}%`))).limit(limit)
//     : db.select(columns).from(warehouses).limit(limit);
// }

// export async function listParties(search = "", limit = 200) {
//   const db = await getDb();
//   if (!db) return [];
//   const columns = { id: parties.id, legacyNumber: parties.legacyNumber, name: parties.name, type: parties.type, phone: parties.phone, address: parties.address, isActive: parties.isActive };
//   const term = search.trim();
//   return term
//     ? db.select(columns).from(parties).where(or(like(parties.name, `%${term}%`), like(parties.legacyNumber, `%${term}%`), like(parties.phone, `%${term}%`))).limit(limit)
//     : db.select(columns).from(parties).limit(limit);
// }

// export async function createWarehouse(input: { code: string; name: string; kind: "central" | "branch" | "storage"; notes?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const result = await tx.insert(warehouses).values({ code: input.code.trim(), name: input.name.trim(), kind: input.kind, notes: input.notes?.trim() || null, isActive: true });
//     const id = Number(result[0].insertId);
//     await writeAdminAudit(tx, { actorId, action: "warehouse_created", entityType: "warehouse", entityId: id, entityLabel: input.name.trim(), details: `إضافة مستودع جديد: الرمز ${input.code.trim()}؛ النوع ${input.kind}.` });
//     return { success: true as const, id };
//   });
// }

// export async function updateWarehouse(id: number, input: { code: string; name: string; kind: "central" | "branch" | "storage"; notes?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     await tx.update(warehouses).set({ code: input.code.trim(), name: input.name.trim(), kind: input.kind, notes: input.notes?.trim() || null }).where(eq(warehouses.id, id));
//     await writeAdminAudit(tx, { actorId, action: "warehouse_updated", entityType: "warehouse", entityId: id, entityLabel: input.name.trim(), details: `تعديل المستودع: الرمز ${input.code.trim()}؛ النوع ${input.kind}.` });
//     return { success: true as const };
//   });
// }

// export async function deactivateWarehouse(id: number, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [warehouse] = await tx.select({ name: warehouses.name, code: warehouses.code }).from(warehouses).where(eq(warehouses.id, id)).limit(1);
//     if (!warehouse) throw new Error("المستودع غير موجود.");
//     await tx.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
//     await writeAdminAudit(tx, { actorId, action: "warehouse_deactivated", entityType: "warehouse", entityId: id, entityLabel: warehouse.name, details: `تعطيل المستودع ذي الرمز ${warehouse.code} دون حذف سجلاته.` });
//     return { success: true as const };
//   });
// }

// export async function deleteWarehouse(id: number, deletedBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [warehouse] = await tx.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name }).from(warehouses).where(eq(warehouses.id, id)).limit(1);
//     if (!warehouse) throw new Error("المستودع غير موجود.");
//     const [memo] = await tx.select({ id: memos.id }).from(memos).where(eq(memos.warehouseId, id)).limit(1);
//     const [balance] = await tx.select({ id: inventoryBalances.id }).from(inventoryBalances).where(eq(inventoryBalances.warehouseId, id)).limit(1);
//     const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.warehouseId, id)).limit(1);
//     if (memo || balance || movement) throw new Error("لا يمكن حذف هذا المستودع نهائيًا لأنه مرتبط بمذكرة أو رصيد أو حركة مخزون تاريخية.");
//     await tx.delete(warehouses).where(eq(warehouses.id, id));
//     await writeAdminAudit(tx, { actorId: deletedBy, action: "warehouse_deleted", entityType: "warehouse", entityId: id, entityLabel: warehouse.name, details: `حذف نهائي لمستودع غير مرتبط: الرمز ${warehouse.code}.` });
//     return { success: true as const };
//   });
// }

// export async function createParty(input: { legacyNumber?: string; name: string; type: "supplier" | "recipient" | "both" | "internal"; phone?: string; address?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const result = await tx.insert(parties).values({ legacyNumber: input.legacyNumber?.trim() || null, name: input.name.trim(), type: input.type, phone: input.phone?.trim() || null, address: input.address?.trim() || null, isActive: true });
//     const id = Number(result[0].insertId);
//     await writeAdminAudit(tx, { actorId, action: "party_created", entityType: "party", entityId: id, entityLabel: input.name.trim(), details: `إضافة جهة جديدة من نوع ${input.type}.` });
//     return { success: true as const, id };
//   });
// }

// export async function updateParty(id: number, input: { legacyNumber?: string; name: string; type: "supplier" | "recipient" | "both" | "internal"; phone?: string; address?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     await tx.update(parties).set({ legacyNumber: input.legacyNumber?.trim() || null, name: input.name.trim(), type: input.type, phone: input.phone?.trim() || null, address: input.address?.trim() || null }).where(eq(parties.id, id));
//     await writeAdminAudit(tx, { actorId, action: "party_updated", entityType: "party", entityId: id, entityLabel: input.name.trim(), details: `تعديل جهة من نوع ${input.type}.` });
//     return { success: true as const };
//   });
// }

// export async function listColleges(search = "", limit = 200) {
//   const db = await getDb();
//   if (!db) return [];
//   const term = search.trim();
//   const columns = { id: colleges.id, code: colleges.code, name: colleges.name, notes: colleges.notes, isActive: colleges.isActive };
//   return term ? db.select(columns).from(colleges).where(or(like(colleges.name, `%${term}%`), like(colleges.code, `%${term}%`))).limit(limit) : db.select(columns).from(colleges).limit(limit);
// }

// export async function createCollege(input: { code?: string; name: string; notes?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const result = await tx.insert(colleges).values({ code: input.code?.trim() || null, name: input.name.trim(), notes: input.notes?.trim() || null, isActive: true });
//     const id = Number(result[0].insertId);
//     await writeAdminAudit(tx, { actorId, action: "college_created", entityType: "college", entityId: id, entityLabel: input.name.trim(), details: `إضافة كلية جديدة: الرمز ${input.code?.trim() || "غير محدد"}.` });
//     return { success: true as const, id };
//   });
// }

// export async function updateCollege(id: number, input: { code?: string; name: string; notes?: string }, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     await tx.update(colleges).set({ code: input.code?.trim() || null, name: input.name.trim(), notes: input.notes?.trim() || null }).where(eq(colleges.id, id));
//     await writeAdminAudit(tx, { actorId, action: "college_updated", entityType: "college", entityId: id, entityLabel: input.name.trim(), details: `تعديل كلية: الرمز ${input.code?.trim() || "غير محدد"}.` });
//     return { success: true as const };
//   });
// }

// export async function deactivateCollege(id: number, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [college] = await tx.select({ name: colleges.name, code: colleges.code }).from(colleges).where(eq(colleges.id, id)).limit(1);
//     if (!college) throw new Error("الكلية غير موجودة.");
//     await tx.update(colleges).set({ isActive: false }).where(eq(colleges.id, id));
//     await writeAdminAudit(tx, { actorId, action: "college_deactivated", entityType: "college", entityId: id, entityLabel: college.name, details: `تعطيل كلية: الرمز ${college.code || "غير محدد"}.` });
//     return { success: true as const };
//   });
// }

// export async function deactivateParty(id: number, actorId: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [party] = await tx.select({ name: parties.name }).from(parties).where(eq(parties.id, id)).limit(1);
//     if (!party) throw new Error("الجهة غير موجودة.");
//     await tx.update(parties).set({ isActive: false }).where(eq(parties.id, id));
//     await writeAdminAudit(tx, { actorId, action: "party_deactivated", entityType: "party", entityId: id, entityLabel: party.name, details: "تعطيل الجهة دون حذف مذكراتها أو سجلاتها التاريخية." });
//     return { success: true as const };
//   });
// }

// export async function listMemos(type: "inbound" | "outbound", limit = 60) {
//   const db = await getDb();
//   if (!db) return [];
//   return db.select({ id: memos.id, memoNumber: memos.memoNumber, type: memos.type, notes: memos.notes, status: memos.status, memoDate: memos.memoDate, folderNumber: memos.folderNumber, orderNumber: memos.orderNumber, invoiceNumber: memos.invoiceNumber, referenceNumber: memos.referenceNumber, partyName: parties.name, warehouseName: warehouses.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).innerJoin(warehouses, eq(memos.warehouseId, warehouses.id)).where(eq(memos.type, type)).orderBy(desc(memos.memoDate)).limit(limit);
// }

// export async function getNextMemoSerialNumber() {
//   const db = await getDb();
//   if (!db) return "1";
//   const rows = await db.select({ memoNumber: memos.memoNumber }).from(memos);
//   const latestSerial = rows.reduce((highest, row) => {
//     const value = String(row.memoNumber).trim();
//     return /^\d+$/.test(value) ? Math.max(highest, Number(value)) : highest;
//   }, 0);
//   return String(latestSerial + 1);
// }
// export async function getNextMemoId() {
//   const db = await getDb();
//   if (!db) return 1;

//   const [rows] = await db.execute(sql`
//     SELECT AUTO_INCREMENT AS nextId
//     FROM information_schema.TABLES
//     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memos'
//   `);

//   const first = Array.isArray(rows) ? rows[0] as { nextId?: number | string } : undefined;
//   return Number(first?.nextId ?? 1);
// }

// export async function listJournalLines(input: { type: "inbound" | "outbound"; fromDate?: Date; toDate?: Date; limit?: number }) {
//   const db = await getDb();
//   if (!db) return [];
//   const conditions = [eq(memos.type, input.type), eq(memos.status, "approved")];
//   if (input.fromDate) conditions.push(gte(memos.memoDate, input.fromDate));
//   if (input.toDate) conditions.push(lte(memos.memoDate, input.toDate));
//   return db.select({
//     id: memoItems.id,
//     memoId: memos.id,
//     memoNumber: memos.memoNumber,
//     memoDate: memos.memoDate,
//     memoStatus: memos.status,
//     notes: memos.notes,
//     materialCode: materials.code,
//     materialName: materials.name,
//     materialDescription: materials.description,
//     unit: materials.unit,
//     quantity: memoItems.quantity,
//     partyName: parties.name,
//     warehouseName: warehouses.name,
//   }).from(memoItems)
//     .innerJoin(memos, eq(memoItems.memoId, memos.id))
//     .innerJoin(materials, eq(memoItems.materialId, materials.id))
//     .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
//     .leftJoin(parties, eq(memos.partyId, parties.id))
//     .where(and(...conditions))
//     .orderBy(memos.memoDate, memos.id, memoItems.id)
//     .limit(input.limit ?? 20_000);
// }

// export async function createMemo(input: { type: "inbound" | "outbound"; memoNumber: string; warehouseId: number; partyId?: number; folderNumber?: string; orderNumber?: string; orderDate?: Date; invoiceNumber?: string; invoiceDate?: Date; referenceNumber?: string; memoDate: Date; notes?: string; createdBy: number; items: Array<{ materialId: number; quantity: number; unitPrice?: number }> }) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   if (input.items.length === 0) throw new Error("أضف بند مادة واحدًا على الأقل إلى المذكرة.");
//   return db.transaction(async tx => {
//     const status = input.type === "outbound" ? "pending_review" as const : "draft" as const;
//     const memoNumber = input.memoNumber.trim();
//     const [existing] = await tx.select({ id: memos.id, status: memos.status }).from(memos).where(and(eq(memos.type, input.type), eq(memos.memoNumber, memoNumber))).limit(1);
//     if (existing) throw new Error(`رقم المذكرة ${memoNumber} موجود مسبقًا ضمن هذا النوع وحالتها «${existing.status}». افتح السجل الموجود للمعاينة بدل إنشاء نسخة مكررة.`);
//     const result = await tx.insert(memos).values({ type: input.type, memoNumber, status, warehouseId: input.warehouseId, partyId: input.partyId ?? null, folderNumber: input.folderNumber?.trim() || null, orderNumber: input.orderNumber?.trim() || null, orderDate: input.orderDate ?? null, invoiceNumber: input.invoiceNumber?.trim() || null, invoiceDate: input.invoiceDate ?? null, referenceNumber: input.referenceNumber?.trim() || null, memoDate: input.memoDate, notes: input.notes?.trim() || null, createdBy: input.createdBy });
//     const memoId = Number(result[0].insertId);
//     await tx.insert(memoItems).values(input.items.map(item => ({ memoId, materialId: item.materialId, quantity: String(item.quantity), unitPrice: item.unitPrice === undefined ? null : String(item.unitPrice) })));
//     await writeAdminAudit(tx, { actorId: input.createdBy, action: "memo_created", entityType: "memo", entityId: memoId, entityLabel: memoNumber, details: `إنشاء مذكرة ${input.type === "inbound" ? "إدخال" : "تسليم"} بعدد ${input.items.length} مادة؛ الحالة ${status}.` });
//     return { success: true as const, id: memoId, status };
//   });
// }

// export async function getMemoDetails(id: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   const [header] = await db.select({ id: memos.id, type: memos.type, memoNumber: memos.memoNumber, status: memos.status, memoDate: memos.memoDate, folderNumber: memos.folderNumber, orderNumber: memos.orderNumber, orderDate: memos.orderDate, invoiceNumber: memos.invoiceNumber, invoiceDate: memos.invoiceDate, referenceNumber: memos.referenceNumber, notes: memos.notes, partyName: parties.name, warehouseName: warehouses.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).innerJoin(warehouses, eq(memos.warehouseId, warehouses.id)).where(eq(memos.id, id)).limit(1);
//   if (!header) throw new Error("المذكرة غير موجودة.");
//   const items = await db.select({ id: memoItems.id, code: materials.code, name: materials.name, unit: materials.unit, quantity: memoItems.quantity, unitPrice: memoItems.unitPrice }).from(memoItems).innerJoin(materials, eq(memoItems.materialId, materials.id)).where(eq(memoItems.memoId, id));
//   return { ...header, items };
// }

// export async function reviewMemo(id: number, reviewedBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [memo] = await tx.select({ memoNumber: memos.memoNumber }).from(memos).where(eq(memos.id, id)).limit(1);
//     if (!memo) throw new Error("المذكرة غير موجودة.");
//     const result = await tx.update(memos).set({ reviewedBy, reviewedAt: new Date(), status: "pending_review" }).where(eq(memos.id, id));
//     await writeAdminAudit(tx, { actorId: reviewedBy, action: "memo_reviewed", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "إرسال المذكرة أو مراجعتها ضمن مسار الاعتماد." });
//     return { success: true as const, affected: result[0].affectedRows };
//   });
// }

// export async function cancelMemo(id: number, cancelledBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [memo] = await tx.select({ id: memos.id, memoNumber: memos.memoNumber, status: memos.status, notes: memos.notes }).from(memos).where(eq(memos.id, id)).limit(1);
//     if (!memo) throw new Error("المذكرة غير موجودة.");
//     if (memo.status === "approved") throw new Error("لا يمكن إلغاء مذكرة معتمدة؛ حفاظًا على سلامة الرصيد والحركة التاريخية.");
//     await tx.update(memos).set({ status: "cancelled", reviewedBy: cancelledBy, reviewedAt: new Date(), notes: `${memo.notes || ""}${memo.notes ? " — " : ""}أُلغيت إداريًا دون حذف السجل.` }).where(eq(memos.id, id));
//     await writeAdminAudit(tx, { actorId: cancelledBy, action: "memo_cancelled", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "إلغاء إداري للمذكرة من دون حذف سجلها." });
//     return { success: true as const };
//   });
// }

// export async function approveMemo(id: number, approvedBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [memo] = await tx.select().from(memos).where(eq(memos.id, id)).limit(1);
//     if (!memo) throw new Error("المذكرة غير موجودة.");
//     if (memo.status === "approved") return { success: true as const, alreadyApproved: true };
//     const items = await tx.select().from(memoItems).where(eq(memoItems.memoId, id));
//     for (const item of items) {
//       const quantity = Number(item.quantity);
//       const [balance] = await tx.select().from(inventoryBalances).where(and(eq(inventoryBalances.materialId, item.materialId), eq(inventoryBalances.warehouseId, memo.warehouseId))).limit(1);
//       if (memo.type === "outbound" && (!balance || Number(balance.onHandQuantity) < quantity)) throw new Error("لا يتوفر رصيد كافٍ لاعتماد إحدى مواد المذكرة.");
//       if (balance) {
//         const updatedQuantity = memo.type === "inbound" ? sql`${inventoryBalances.onHandQuantity} + ${quantity}` : sql`${inventoryBalances.onHandQuantity} - ${quantity}`;
//         await tx.update(inventoryBalances).set({ onHandQuantity: updatedQuantity }).where(eq(inventoryBalances.id, balance.id));
//       } else {
//         await tx.insert(inventoryBalances).values({ materialId: item.materialId, warehouseId: memo.warehouseId, partyId: memo.partyId, openingQuantity: "0", onHandQuantity: String(quantity), reservedQuantity: "0" });
//       }
//       await tx.insert(stockMovements).values({ materialId: item.materialId, warehouseId: memo.warehouseId, partyId: memo.partyId, memoId: memo.id, memoItemId: item.id, movementType: memo.type, quantityIn: String(memo.type === "inbound" ? quantity : 0), quantityOut: String(memo.type === "outbound" ? quantity : 0), occurredAt: memo.memoDate, createdBy: approvedBy });
//     }
//     await tx.update(memos).set({ status: "approved", approvedBy, approvedAt: new Date(), reviewedBy: approvedBy, reviewedAt: new Date() }).where(eq(memos.id, id));
//     await writeAdminAudit(tx, { actorId: approvedBy, action: "memo_approved", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: `اعتماد المذكرة وإنشاء ${items.length} حركة مخزون مرتبطة بها.` });
//     return { success: true as const, alreadyApproved: false };
//   });
// }

// export async function listInventoryBalances(options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }) {
//   const db = await getDb();
//   if (!db) return [];
//   const limit = options?.limit ?? 20_000;
//   const term = options?.search?.trim();
//   const materialSearch = term ? or(like(materials.code, `%${term}%`), like(materials.name, `%${term}%`), like(materials.barcode, `%${term}%`)) : undefined;
//   const pageMaterials = await db.select({ id: materials.id, code: materials.code, name: materials.name, description: materials.description, unit: materials.unit, minimumStock: materials.minimumStock }).from(materials).where(materialSearch).orderBy(materials.code, materials.id).limit(limit).offset(options?.offset ?? 0);
//   if (!pageMaterials.length) return [];

//   const materialIds = pageMaterials.map(material => material.id);
//   const movementFilters = [inArray(stockMovements.materialId, materialIds)];
//   if (options?.fromDate) movementFilters.push(gte(stockMovements.occurredAt, options.fromDate));
//   if (options?.toDate) movementFilters.push(lte(stockMovements.occurredAt, options.toDate));
//   const [balanceRows, movementRows] = await Promise.all([
//     db.select({ id: inventoryBalances.id, materialId: inventoryBalances.materialId, warehouseId: inventoryBalances.warehouseId, partyId: inventoryBalances.partyId, openingQuantity: inventoryBalances.openingQuantity, onHandQuantity: inventoryBalances.onHandQuantity, warehouseName: warehouses.name, partyName: parties.name }).from(inventoryBalances).leftJoin(warehouses, eq(inventoryBalances.warehouseId, warehouses.id)).leftJoin(parties, eq(inventoryBalances.partyId, parties.id)).where(inArray(inventoryBalances.materialId, materialIds)),
//     db.select({ materialId: stockMovements.materialId, movementType: stockMovements.movementType, quantityIn: stockMovements.quantityIn, quantityOut: stockMovements.quantityOut, notes: memos.notes }).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).where(and(...movementFilters)),
//   ]);

//   return pageMaterials.map(material => {
//     const balances = balanceRows.filter(row => row.materialId === material.id);
//     const movements = movementRows.filter(row => row.materialId === material.id);
//     const quantities = movements.reduce((total, row) => {
//       const quantityIn = Number(row.quantityIn ?? 0);
//       const quantityOut = Number(row.quantityOut ?? 0);
//       const notes = row.notes ?? "";
//       if (row.movementType === "inbound" || row.movementType === "transfer_in") total.inbound += quantityIn;
//       if (row.movementType === "outbound" || row.movementType === "transfer_out") total.outbound += quantityOut;
//       if (row.movementType === "inbound" && notes.includes("استلام")) total.receipt += quantityIn;
//       if (row.movementType === "inbound" && (notes.includes("إدخال") || notes.includes("إرجاع"))) total.returned += quantityIn;
//       return total;
//     }, { inbound: 0, outbound: 0, receipt: 0, returned: 0 });
//     const locations = Array.from(new Set(balances.map(row => row.partyName || row.warehouseName).filter(Boolean)));
//     const firstBalance = balances[0];
//     return {
//       id: firstBalance?.id ?? -material.id,
//       materialId: material.id,
//       warehouseId: firstBalance?.warehouseId ?? 0,
//       partyId: firstBalance?.partyId ?? null,
//       code: material.code,
//       name: material.name,
//       description: material.description,
//       unit: material.unit,
//       openingQuantity: String(balances.reduce((total, row) => total + Number(row.openingQuantity ?? 0), 0)),
//       onHandQuantity: String(asOfQuantity),
//       minimumStock: material.minimumStock,
//       warehouseName: locations.length <= 1 ? locations[0] ?? "" : "متعدد الجهات / المستودعات",
//       partyName: null,
//       inboundQuantity: String(quantities.inbound),
//       receiptQuantity: String(quantities.receipt),
//       returnQuantity: String(quantities.returned),
//       outboundQuantity: String(quantities.outbound),
//     };
//   });
// }

// export async function listInventoryBalancePage(options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }) {
//   const pageSize = Math.min(Math.max(options?.limit ?? 20, 1), 100);
//   const rows = await listInventoryBalances({ ...options, limit: pageSize + 1, offset: options?.offset ?? 0 });
//   return { rows: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
// }

// export async function getMaterialCard(input: { materialId: number; warehouseId?: number; partyId?: number | null }) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   const hasLocationScope = input.warehouseId !== undefined;
//   const scope = hasLocationScope ? and(eq(inventoryBalances.materialId, input.materialId), eq(inventoryBalances.warehouseId, input.warehouseId!), sql`${inventoryBalances.partyId} <=> ${input.partyId ?? null}`) : eq(inventoryBalances.materialId, input.materialId);
//   const balances = await db.select({ id: inventoryBalances.id, openingQuantity: inventoryBalances.openingQuantity }).from(inventoryBalances).where(scope);
//   const [material] = await db.select({ code: materials.code, name: materials.name, description: materials.description, unit: materials.unit, minimumStock: materials.minimumStock }).from(materials).where(eq(materials.id, input.materialId)).limit(1);
//   if (!material) throw new Error("لم يُعثر على المادة المحددة.");
//   const movementFields = { memoNumber: memos.memoNumber, memoDate: memos.memoDate, occurredAt: stockMovements.occurredAt, movementType: stockMovements.movementType, quantityIn: stockMovements.quantityIn, quantityOut: stockMovements.quantityOut, partyName: parties.name, notes: memos.notes };
//   const movementBase = hasLocationScope ? [eq(stockMovements.materialId, input.materialId), eq(stockMovements.warehouseId, input.warehouseId!)] : [eq(stockMovements.materialId, input.materialId)];
//   const scopedMovements = await db.select(movementFields).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).leftJoin(parties, eq(stockMovements.partyId, parties.id)).where(hasLocationScope ? and(...movementBase, sql`${stockMovements.partyId} <=> ${input.partyId ?? null}`) : and(...movementBase)).orderBy(stockMovements.occurredAt, stockMovements.id);
//   // بعض الأرصدة التاريخية لا تحمل الجهة نفسها الموجودة على حركة المذكرة؛ لا نترك بطاقة المادة فارغة عند وجود حركات صحيحة للمادة والمستودع.
//   const movements = scopedMovements.length > 0
//     ? scopedMovements
//     : await db.select(movementFields).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).leftJoin(parties, eq(stockMovements.partyId, parties.id)).where(and(...movementBase)).orderBy(stockMovements.occurredAt, stockMovements.id);
//   return { cardNumber: hasLocationScope ? balances[0]?.id ?? null : null, openingQuantity: String(balances.reduce((total, balance) => total + Number(balance.openingQuantity ?? 0), 0)), ...material, movements };
// }

// export const dbSql = sql;

// export async function deleteMemo(id: number, deletedBy: number) {
//   const db = await getDb();
//   if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
//   return db.transaction(async tx => {
//     const [memo] = await tx.select({ id: memos.id, status: memos.status, createdBy: memos.createdBy, memoNumber: memos.memoNumber }).from(memos).where(eq(memos.id, id)).limit(1);
//     if (!memo) throw new Error("المذكرة غير موجودة.");
//     if (memo.status !== "draft" && memo.status !== "pending_review") throw new Error("الحذف النهائي متاح لمسودات محاضر التركيب والمذكرات قيد المراجعة فقط؛ المذكرات المعتمدة أو الملغاة تبقى محفوظة.");
//     const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.memoId, id)).limit(1);
//     if (movement) throw new Error("لا يمكن حذف مذكرة مرتبطة بحركة مخزون؛ استخدم الإلغاء الإداري للحفاظ على السجل التاريخي.");
//     await tx.delete(memoItems).where(eq(memoItems.memoId, id));
//     await tx.delete(memos).where(eq(memos.id, id));
//     await tx.insert(adminAuditLogs).values({ actorId: deletedBy, action: "memo_deleted", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "حذف نهائي لمذكرة مسودة غير مرتبطة بحركات مخزون." });
//     return { success: true as const, deletedBy };
//   });
// }
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gt, gte, inArray, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, adminAuditLogs, colleges, inventoryBalances, materials, memoItems, memos, parties, stockMovements, users, warehouses } from "../drizzle/schema";
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

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
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

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn), desc(users.id));
}

export async function createLocalUser(input: { name: string; email?: string; role: import("../drizzle/schema").WarehouseRole; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const normalizedEmail = input.email?.trim() || null;
  if (normalizedEmail) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) throw new Error("يوجد مستخدم بهذا البريد الإلكتروني.");
  }
  return db.transaction(async tx => {
    const result = await tx.insert(users).values({ openId: `local-${randomUUID()}`, name: input.name.trim(), email: normalizedEmail, loginMethod: "local", role: input.role });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, { actorId: input.actorId, action: "user_created", entityType: "user", entityId: id, entityLabel: input.name.trim(), details: `إضافة مستخدم محلي جديد بالدور ${input.role}.` });
    return { success: true as const, id };
  });
}

export async function updateUserRole(input: { id: number; role: import("../drizzle/schema").WarehouseRole; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [target] = await db.select({ id: users.id, openId: users.openId, name: users.name, role: users.role }).from(users).where(eq(users.id, input.id)).limit(1);
  if (!target) throw new Error("المستخدم غير موجود.");
  assertRoleChangeAllowed({ actorId: input.actorId, targetId: target.id, targetOpenId: target.openId, ownerOpenId: ENV.ownerOpenId, role: input.role });
  await db.transaction(async tx => {
    await tx.update(users).set({ role: input.role }).where(eq(users.id, input.id));
    await tx.insert(adminAuditLogs).values({ actorId: input.actorId, action: "user_role_changed", entityType: "user", entityId: target.id, entityLabel: target.name ?? `#${target.id}`, details: `الدور السابق: ${target.role}؛ الدور الجديد: ${input.role}` });
  });
  return { success: true } as const;
}

export async function listAdminAuditLogs(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: adminAuditLogs.id, action: adminAuditLogs.action, entityType: adminAuditLogs.entityType, entityId: adminAuditLogs.entityId, entityLabel: adminAuditLogs.entityLabel, details: adminAuditLogs.details, createdAt: adminAuditLogs.createdAt, actorId: users.id, actorName: users.name }).from(adminAuditLogs).innerJoin(users, eq(adminAuditLogs.actorId, users.id)).orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id)).limit(limit);
}

type AdminAuditInput = { actorId: number; action: string; entityType: string; entityId: number; entityLabel: string; details: string };
async function writeAdminAudit(tx: any, input: AdminAuditInput) {
  await tx.insert(adminAuditLogs).values(input);
}

export async function getWarehouseDashboard() {
  const db = await getDb();
  if (!db) {
    return { available: false, materialCount: 0, balanceCount: 0, lowStockCount: 0, latestMemos: [], lowStock: [] };
  }

  const [materialTotal, warehouseTotal, balanceTotal, memoTotal, lowStockTotal, latestMemos, lowStock, mostUsedMaterials] = await Promise.all([
    db.select({ value: count() }).from(materials),
    db.select({ value: count() }).from(warehouses),
    db.select({ value: count() }).from(inventoryBalances),
    db.select({ value: count() }).from(memos),
    db.select({ value: count() }).from(materials).innerJoin(inventoryBalances, eq(inventoryBalances.materialId, materials.id)).where(lt(inventoryBalances.onHandQuantity, materials.minimumStock)),
    db.select({ id: memos.id, memoNumber: memos.memoNumber, type: memos.type, status: memos.status, memoDate: memos.memoDate, partyName: parties.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).orderBy(desc(memos.memoDate)).limit(6),
    db.select({ id: materials.id, code: materials.code, name: materials.name, unit: materials.unit, balance: inventoryBalances.onHandQuantity, minimumStock: materials.minimumStock }).from(inventoryBalances).innerJoin(materials, eq(inventoryBalances.materialId, materials.id)).where(and(eq(materials.isActive, true), lt(inventoryBalances.onHandQuantity, materials.minimumStock))).limit(8),
    db.select({ id: materials.id, code: materials.code, name: materials.name, unit: materials.unit, usageQuantity: sql<string>`coalesce(sum(${stockMovements.quantityOut}), 0)`, movementCount: count(stockMovements.id) }).from(stockMovements).innerJoin(materials, eq(stockMovements.materialId, materials.id)).where(and(eq(materials.isActive, true), gt(stockMovements.quantityOut, "0"))).groupBy(materials.id, materials.code, materials.name, materials.unit).orderBy(desc(sql`sum(${stockMovements.quantityOut})`), desc(count(stockMovements.id))).limit(8),
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
  if (query) {
    return db.select(columns).from(materials).where(or(like(materials.code, `%${query}%`), like(materials.name, `%${query}%`), like(materials.barcode, `%${query}%`))).limit(limit);
  }
  return db.select(columns).from(materials).limit(limit);
}

export async function createMaterial(input: { code: string; name: string; description?: string; unit: string; barcode?: string; minimumStock: number }, actorId: number) {
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
    await writeAdminAudit(tx, { actorId, action: "material_created", entityType: "material", entityId: id, entityLabel: input.name.trim(), details: `إضافة مادة جديدة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.` });
    return { success: true as const, id };
  });
}

export async function updateMaterial(id: number, input: { code: string; name: string; description?: string; unit: string; barcode?: string; minimumStock: number }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx.update(materials).set({ code: input.code.trim(), name: input.name.trim(), description: input.description?.trim() || null, unit: input.unit.trim(), barcode: input.barcode?.trim() || null, minimumStock: String(input.minimumStock) }).where(eq(materials.id, id));
    await writeAdminAudit(tx, { actorId, action: "material_updated", entityType: "material", entityId: id, entityLabel: input.name.trim(), details: `تعديل بيانات المادة: الرمز ${input.code.trim()}؛ الوحدة ${input.unit.trim()}.` });
    return { success: true as const };
  });
}

export async function deactivateMaterial(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [material] = await tx.select({ id: materials.id, name: materials.name, code: materials.code }).from(materials).where(eq(materials.id, id)).limit(1);
    if (!material) throw new Error("المادة غير موجودة.");
    await tx.update(materials).set({ isActive: false }).where(eq(materials.id, id));
    await writeAdminAudit(tx, { actorId, action: "material_deactivated", entityType: "material", entityId: id, entityLabel: material.name, details: `تعطيل المادة ذات الرمز ${material.code} دون حذف سجلها أو حركاتها التاريخية.` });
    return { success: true as const };
  });
}

export async function deleteMaterial(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [material] = await tx.select({ id: materials.id, name: materials.name, code: materials.code }).from(materials).where(eq(materials.id, id)).limit(1);
    if (!material) throw new Error("المادة غير موجودة.");
    const [memoItem] = await tx.select({ id: memoItems.id }).from(memoItems).where(eq(memoItems.materialId, id)).limit(1);
    const [balance] = await tx.select({ id: inventoryBalances.id }).from(inventoryBalances).where(eq(inventoryBalances.materialId, id)).limit(1);
    const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.materialId, id)).limit(1);
    if (memoItem || balance || movement) throw new Error("لا يمكن حذف هذه المادة نهائيًا لأنها مرتبطة بمذكرة أو رصيد أو حركة مخزون تاريخية. تبقى محمية للحفاظ على سلامة السجل.");
    await tx.delete(materials).where(eq(materials.id, id));
    await writeAdminAudit(tx, { actorId: deletedBy, action: "material_deleted", entityType: "material", entityId: id, entityLabel: material.name, details: `حذف نهائي لمادة غير مرتبطة: الرمز ${material.code}.` });
    return { success: true as const };
  });
}

export async function getEntitiesOverview() {
  const db = await getDb();
  if (!db) return { warehouses: [], parties: [] };
  const [warehouseRows, partyRows] = await Promise.all([
    db.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name, kind: warehouses.kind, isActive: warehouses.isActive }).from(warehouses).limit(80),
    db.select({ id: parties.id, legacyNumber: parties.legacyNumber, name: parties.name, type: parties.type, phone: parties.phone, isActive: parties.isActive }).from(parties).limit(80),
  ]);
  return { warehouses: warehouseRows, parties: partyRows };
}

export async function listWarehouses(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const columns = { id: warehouses.id, code: warehouses.code, name: warehouses.name, kind: warehouses.kind, notes: warehouses.notes, isActive: warehouses.isActive };
  const term = search.trim();
  return term
    ? db.select(columns).from(warehouses).where(or(like(warehouses.code, `%${term}%`), like(warehouses.name, `%${term}%`))).limit(limit)
    : db.select(columns).from(warehouses).limit(limit);
}

export async function listParties(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const columns = { id: parties.id, legacyNumber: parties.legacyNumber, name: parties.name, type: parties.type, phone: parties.phone, address: parties.address, isActive: parties.isActive };
  const term = search.trim();
  return term
    ? db.select(columns).from(parties).where(or(like(parties.name, `%${term}%`), like(parties.legacyNumber, `%${term}%`), like(parties.phone, `%${term}%`))).limit(limit)
    : db.select(columns).from(parties).limit(limit);
}

export async function createWarehouse(input: { code: string; name: string; kind: "central" | "branch" | "storage"; notes?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(warehouses).values({ code: input.code.trim(), name: input.name.trim(), kind: input.kind, notes: input.notes?.trim() || null, isActive: true });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, { actorId, action: "warehouse_created", entityType: "warehouse", entityId: id, entityLabel: input.name.trim(), details: `إضافة مستودع جديد: الرمز ${input.code.trim()}؛ النوع ${input.kind}.` });
    return { success: true as const, id };
  });
}

export async function updateWarehouse(id: number, input: { code: string; name: string; kind: "central" | "branch" | "storage"; notes?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx.update(warehouses).set({ code: input.code.trim(), name: input.name.trim(), kind: input.kind, notes: input.notes?.trim() || null }).where(eq(warehouses.id, id));
    await writeAdminAudit(tx, { actorId, action: "warehouse_updated", entityType: "warehouse", entityId: id, entityLabel: input.name.trim(), details: `تعديل المستودع: الرمز ${input.code.trim()}؛ النوع ${input.kind}.` });
    return { success: true as const };
  });
}

export async function deactivateWarehouse(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [warehouse] = await tx.select({ name: warehouses.name, code: warehouses.code }).from(warehouses).where(eq(warehouses.id, id)).limit(1);
    if (!warehouse) throw new Error("المستودع غير موجود.");
    await tx.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
    await writeAdminAudit(tx, { actorId, action: "warehouse_deactivated", entityType: "warehouse", entityId: id, entityLabel: warehouse.name, details: `تعطيل المستودع ذي الرمز ${warehouse.code} دون حذف سجلاته.` });
    return { success: true as const };
  });
}

export async function deleteWarehouse(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [warehouse] = await tx.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name }).from(warehouses).where(eq(warehouses.id, id)).limit(1);
    if (!warehouse) throw new Error("المستودع غير موجود.");
    const [memo] = await tx.select({ id: memos.id }).from(memos).where(eq(memos.warehouseId, id)).limit(1);
    const [balance] = await tx.select({ id: inventoryBalances.id }).from(inventoryBalances).where(eq(inventoryBalances.warehouseId, id)).limit(1);
    const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.warehouseId, id)).limit(1);
    if (memo || balance || movement) throw new Error("لا يمكن حذف هذا المستودع نهائيًا لأنه مرتبط بمذكرة أو رصيد أو حركة مخزون تاريخية.");
    await tx.delete(warehouses).where(eq(warehouses.id, id));
    await writeAdminAudit(tx, { actorId: deletedBy, action: "warehouse_deleted", entityType: "warehouse", entityId: id, entityLabel: warehouse.name, details: `حذف نهائي لمستودع غير مرتبط: الرمز ${warehouse.code}.` });
    return { success: true as const };
  });
}

export async function createParty(input: { legacyNumber?: string; name: string; type: "supplier" | "recipient" | "both" | "internal"; phone?: string; address?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(parties).values({ legacyNumber: input.legacyNumber?.trim() || null, name: input.name.trim(), type: input.type, phone: input.phone?.trim() || null, address: input.address?.trim() || null, isActive: true });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, { actorId, action: "party_created", entityType: "party", entityId: id, entityLabel: input.name.trim(), details: `إضافة جهة جديدة من نوع ${input.type}.` });
    return { success: true as const, id };
  });
}

export async function updateParty(id: number, input: { legacyNumber?: string; name: string; type: "supplier" | "recipient" | "both" | "internal"; phone?: string; address?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx.update(parties).set({ legacyNumber: input.legacyNumber?.trim() || null, name: input.name.trim(), type: input.type, phone: input.phone?.trim() || null, address: input.address?.trim() || null }).where(eq(parties.id, id));
    await writeAdminAudit(tx, { actorId, action: "party_updated", entityType: "party", entityId: id, entityLabel: input.name.trim(), details: `تعديل جهة من نوع ${input.type}.` });
    return { success: true as const };
  });
}

export async function listColleges(search = "", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const term = search.trim();
  const columns = { id: colleges.id, code: colleges.code, name: colleges.name, notes: colleges.notes, isActive: colleges.isActive };
  return term ? db.select(columns).from(colleges).where(or(like(colleges.name, `%${term}%`), like(colleges.code, `%${term}%`))).limit(limit) : db.select(columns).from(colleges).limit(limit);
}

export async function createCollege(input: { code?: string; name: string; notes?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const result = await tx.insert(colleges).values({ code: input.code?.trim() || null, name: input.name.trim(), notes: input.notes?.trim() || null, isActive: true });
    const id = Number(result[0].insertId);
    await writeAdminAudit(tx, { actorId, action: "college_created", entityType: "college", entityId: id, entityLabel: input.name.trim(), details: `إضافة كلية جديدة: الرمز ${input.code?.trim() || "غير محدد"}.` });
    return { success: true as const, id };
  });
}

export async function updateCollege(id: number, input: { code?: string; name: string; notes?: string }, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    await tx.update(colleges).set({ code: input.code?.trim() || null, name: input.name.trim(), notes: input.notes?.trim() || null }).where(eq(colleges.id, id));
    await writeAdminAudit(tx, { actorId, action: "college_updated", entityType: "college", entityId: id, entityLabel: input.name.trim(), details: `تعديل كلية: الرمز ${input.code?.trim() || "غير محدد"}.` });
    return { success: true as const };
  });
}

export async function deactivateCollege(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [college] = await tx.select({ name: colleges.name, code: colleges.code }).from(colleges).where(eq(colleges.id, id)).limit(1);
    if (!college) throw new Error("الكلية غير موجودة.");
    await tx.update(colleges).set({ isActive: false }).where(eq(colleges.id, id));
    await writeAdminAudit(tx, { actorId, action: "college_deactivated", entityType: "college", entityId: id, entityLabel: college.name, details: `تعطيل كلية: الرمز ${college.code || "غير محدد"}.` });
    return { success: true as const };
  });
}

export async function deactivateParty(id: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [party] = await tx.select({ name: parties.name }).from(parties).where(eq(parties.id, id)).limit(1);
    if (!party) throw new Error("الجهة غير موجودة.");
    await tx.update(parties).set({ isActive: false }).where(eq(parties.id, id));
    await writeAdminAudit(tx, { actorId, action: "party_deactivated", entityType: "party", entityId: id, entityLabel: party.name, details: "تعطيل الجهة دون حذف مذكراتها أو سجلاتها التاريخية." });
    return { success: true as const };
  });
}

type MemoClassification = "purchase" | "adjustment" | "transfer" | "return";

const legacyMemoClassification = (type: "inbound" | "outbound", notes?: string | null): MemoClassification => {
  const value = notes ?? "";
  if (type === "outbound") return /تركيب|تنسيق|تحويل/.test(value) ? "transfer" : "adjustment";
  return /إدخال مواد قديمة|إرجاع|مرتجع/.test(value) ? "return" : "purchase";
};

export async function listMemos(type: "inbound" | "outbound", limit = 60) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: memos.id, memoNumber: memos.memoNumber, type: memos.type, notes: memos.notes, status: memos.status, memoDate: memos.memoDate, folderNumber: memos.folderNumber, orderNumber: memos.orderNumber, invoiceNumber: memos.invoiceNumber, referenceNumber: memos.referenceNumber, partyName: parties.name, partyType: parties.type, warehouseName: warehouses.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).innerJoin(warehouses, eq(memos.warehouseId, warehouses.id)).where(eq(memos.type, type)).orderBy(desc(memos.memoDate)).limit(limit);
  return rows.map(row => ({ ...row, classification: legacyMemoClassification(row.type, row.notes) }));
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
  const [latestMemo] = await db.select({ id: memos.id }).from(memos).orderBy(desc(memos.id)).limit(1);
  return String((latestMemo?.id ?? 0) + 1);
}

export async function listJournalLines(input: { type: "inbound" | "outbound"; fromDate?: Date; toDate?: Date; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memos.type, input.type), eq(memos.status, "approved")];
  if (input.fromDate) conditions.push(gte(memos.memoDate, input.fromDate));
  if (input.toDate) conditions.push(lte(memos.memoDate, input.toDate));
  return db.select({
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
    quantity: memoItems.quantity,
    partyName: parties.name,
    warehouseName: warehouses.name,
  }).from(memoItems)
    .innerJoin(memos, eq(memoItems.memoId, memos.id))
    .innerJoin(materials, eq(memoItems.materialId, materials.id))
    .innerJoin(warehouses, eq(memos.warehouseId, warehouses.id))
    .leftJoin(parties, eq(memos.partyId, parties.id))
    .where(and(...conditions))
    .orderBy(memos.memoDate, memos.id, memoItems.id)
    .limit(input.limit ?? 20_000);
}

export async function createMemo(input: { type: "inbound" | "outbound"; classification: MemoClassification; memoNumber: string; warehouseId: number; partyId?: number; folderNumber?: string; orderNumber?: string; orderDate?: Date; invoiceNumber?: string; invoiceDate?: Date; referenceNumber?: string; memoDate: Date; notes?: string; createdBy: number; items: Array<{ materialId: number; quantity: number; unitPrice?: number; notes?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (input.items.length === 0) throw new Error("أضف بند مادة واحدًا على الأقل إلى المذكرة.");
  return db.transaction(async tx => {
    const status = input.type === "outbound" ? "pending_review" as const : "draft" as const;
    const memoNumber = input.memoNumber.trim();
    if (input.partyId) {
      const [party] = await tx.select({ type: parties.type }).from(parties).where(eq(parties.id, input.partyId)).limit(1);
      const allowed = input.classification === "purchase" ? ["supplier", "both"] : input.classification === "transfer" ? ["internal", "both"] : ["recipient", "internal", "both"];
      if (!party || !allowed.includes(party.type)) throw new Error("نوع الجهة المختارة لا يطابق نوع المذكرة.");
    }
    const [existing] = await tx.select({ id: memos.id, status: memos.status }).from(memos).where(and(eq(memos.type, input.type), eq(memos.memoNumber, memoNumber))).limit(1);
    if (existing) throw new Error(`رقم المذكرة ${memoNumber} موجود مسبقًا ضمن هذا النوع وحالتها «${existing.status}». افتح السجل الموجود للمعاينة بدل إنشاء نسخة مكررة.`);
    const financialNumber = input.classification === "purchase" || input.classification === "transfer" ? memoNumber : null;
    const result = await tx.insert(memos).values({ type: input.type, memoNumber, status, warehouseId: input.warehouseId, partyId: input.partyId ?? null, folderNumber: input.folderNumber?.trim() || null, orderNumber: input.orderNumber?.trim() || null, orderDate: input.orderDate ?? null, invoiceNumber: input.invoiceNumber?.trim() || null, invoiceDate: input.invoiceDate ?? null, referenceNumber: financialNumber, memoDate: input.memoDate, notes: input.notes?.trim() || null, createdBy: input.createdBy });
    const memoId = Number(result[0].insertId);
    await tx.insert(memoItems).values(input.items.map(item => ({ memoId, materialId: item.materialId, quantity: String(item.quantity), unitPrice: item.unitPrice === undefined ? null : String(item.unitPrice), notes: item.notes?.trim() || null })));
    await writeAdminAudit(tx, { actorId: input.createdBy, action: "memo_created", entityType: "memo", entityId: memoId, entityLabel: memoNumber, details: `إنشاء مذكرة ${input.type === "inbound" ? "إدخال" : "تسليم"} بعدد ${input.items.length} مادة؛ الحالة ${status}.` });
    return { success: true as const, id: memoId, status };
  });
}

export async function getMemoDetails(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const [header] = await db.select({ id: memos.id, type: memos.type, memoNumber: memos.memoNumber, status: memos.status, warehouseId: memos.warehouseId, partyId: memos.partyId, memoDate: memos.memoDate, folderNumber: memos.folderNumber, orderNumber: memos.orderNumber, orderDate: memos.orderDate, invoiceNumber: memos.invoiceNumber, invoiceDate: memos.invoiceDate, referenceNumber: memos.referenceNumber, notes: memos.notes, partyName: parties.name, partyType: parties.type, warehouseName: warehouses.name }).from(memos).leftJoin(parties, eq(memos.partyId, parties.id)).innerJoin(warehouses, eq(memos.warehouseId, warehouses.id)).where(eq(memos.id, id)).limit(1);
  if (!header) throw new Error("المذكرة غير موجودة.");
  const items = await db.select({ id: memoItems.id, materialId: memoItems.materialId, code: materials.code, name: materials.name, unit: materials.unit, quantity: memoItems.quantity, unitPrice: memoItems.unitPrice, notes: memoItems.notes }).from(memoItems).innerJoin(materials, eq(memoItems.materialId, materials.id)).where(eq(memoItems.memoId, id));
  return { ...header, items };
}

export async function updateMemo(input: { id: number; classification: MemoClassification; memoNumber: string; warehouseId: number; partyId?: number; folderNumber?: string; orderNumber?: string; orderDate?: Date; invoiceNumber?: string; invoiceDate?: Date; referenceNumber?: string; memoDate: Date; notes?: string; updatedBy: number; items: Array<{ materialId: number; quantity: number; unitPrice?: number; notes?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (!input.items.length) throw new Error("أضف بند مادة واحدًا على الأقل إلى المذكرة.");
  return db.transaction(async tx => {
    const [memo] = await tx.select({ id: memos.id, type: memos.type, status: memos.status }).from(memos).where(eq(memos.id, input.id)).limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status !== "draft") throw new Error("يمكن تعديل المسودات فقط قبل المراجعة أو الاعتماد.");
    if (input.partyId) {
      const [party] = await tx.select({ type: parties.type }).from(parties).where(eq(parties.id, input.partyId)).limit(1);
      const allowed = input.classification === "purchase" ? ["supplier", "both"] : input.classification === "transfer" ? ["internal", "both"] : ["recipient", "internal", "both"];
      if (!party || !allowed.includes(party.type)) throw new Error("نوع الجهة المختارة لا يطابق نوع المذكرة.");
    }
    const duplicate = await tx.select({ id: memos.id }).from(memos).where(and(eq(memos.type, memo.type), eq(memos.memoNumber, input.memoNumber.trim()), sql`${memos.id} <> ${input.id}`)).limit(1);
    if (duplicate.length) throw new Error(`رقم المذكرة ${input.memoNumber.trim()} موجود مسبقًا.`);
    const financialNumber = input.classification === "purchase" || input.classification === "transfer" ? input.memoNumber.trim() : null;
    await tx.update(memos).set({ memoNumber: input.memoNumber.trim(), warehouseId: input.warehouseId, partyId: input.partyId ?? null, folderNumber: input.folderNumber?.trim() || null, orderNumber: input.orderNumber?.trim() || null, orderDate: input.orderDate ?? null, invoiceNumber: input.invoiceNumber?.trim() || null, invoiceDate: input.invoiceDate ?? null, referenceNumber: financialNumber, memoDate: input.memoDate, notes: input.notes?.trim() || null }).where(eq(memos.id, input.id));
    await tx.delete(memoItems).where(eq(memoItems.memoId, input.id));
    await tx.insert(memoItems).values(input.items.map(item => ({ memoId: input.id, materialId: item.materialId, quantity: String(item.quantity), unitPrice: item.unitPrice === undefined ? null : String(item.unitPrice), notes: item.notes?.trim() || null })));
    await writeAdminAudit(tx, { actorId: input.updatedBy, action: "memo_created", entityType: "memo", entityId: input.id, entityLabel: input.memoNumber.trim(), details: `تعديل المذكرة: تحديث الرأس واستبدال ${input.items.length} مادة.` });
    return { success: true as const, id: input.id };
  });
}

export async function reviewMemo(id: number, reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx.select({ memoNumber: memos.memoNumber }).from(memos).where(eq(memos.id, id)).limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    const result = await tx.update(memos).set({ reviewedBy, reviewedAt: new Date(), status: "pending_review" }).where(eq(memos.id, id));
    await writeAdminAudit(tx, { actorId: reviewedBy, action: "memo_reviewed", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "إرسال المذكرة أو مراجعتها ضمن مسار الاعتماد." });
    return { success: true as const, affected: result[0].affectedRows };
  });
}

export async function cancelMemo(id: number, cancelledBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx.select({ id: memos.id, memoNumber: memos.memoNumber, status: memos.status, notes: memos.notes }).from(memos).where(eq(memos.id, id)).limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status === "approved") throw new Error("لا يمكن إلغاء مذكرة معتمدة؛ حفاظًا على سلامة الرصيد والحركة التاريخية.");
    await tx.update(memos).set({ status: "cancelled", reviewedBy: cancelledBy, reviewedAt: new Date(), notes: `${memo.notes || ""}${memo.notes ? " — " : ""}أُلغيت إداريًا دون حذف السجل.` }).where(eq(memos.id, id));
    await writeAdminAudit(tx, { actorId: cancelledBy, action: "memo_cancelled", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "إلغاء إداري للمذكرة من دون حذف سجلها." });
    return { success: true as const };
  });
}

export async function approveMemo(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx.select().from(memos).where(eq(memos.id, id)).limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status === "approved") return { success: true as const, alreadyApproved: true };
    const items = await tx.select().from(memoItems).where(eq(memoItems.memoId, id));
    for (const item of items) {
      const quantity = Number(item.quantity);
      const [balance] = await tx.select().from(inventoryBalances).where(and(eq(inventoryBalances.materialId, item.materialId), eq(inventoryBalances.warehouseId, memo.warehouseId))).limit(1);
      if (memo.type === "outbound" && (!balance || Number(balance.onHandQuantity) < quantity)) throw new Error("لا يتوفر رصيد كافٍ لاعتماد إحدى مواد المذكرة.");
      if (balance) {
        const updatedQuantity = memo.type === "inbound" ? sql`${inventoryBalances.onHandQuantity} + ${quantity}` : sql`${inventoryBalances.onHandQuantity} - ${quantity}`;
        await tx.update(inventoryBalances).set({ onHandQuantity: updatedQuantity }).where(eq(inventoryBalances.id, balance.id));
      } else {
        await tx.insert(inventoryBalances).values({ materialId: item.materialId, warehouseId: memo.warehouseId, partyId: memo.partyId, openingQuantity: "0", onHandQuantity: String(quantity), reservedQuantity: "0" });
      }
      await tx.insert(stockMovements).values({ materialId: item.materialId, warehouseId: memo.warehouseId, partyId: memo.partyId, memoId: memo.id, memoItemId: item.id, movementType: memo.type, quantityIn: String(memo.type === "inbound" ? quantity : 0), quantityOut: String(memo.type === "outbound" ? quantity : 0), occurredAt: memo.memoDate, createdBy: approvedBy });
    }
    await tx.update(memos).set({ status: "approved", approvedBy, approvedAt: new Date(), reviewedBy: approvedBy, reviewedAt: new Date() }).where(eq(memos.id, id));
    await writeAdminAudit(tx, { actorId: approvedBy, action: "memo_approved", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: `اعتماد المذكرة وإنشاء ${items.length} حركة مخزون مرتبطة بها.` });
    return { success: true as const, alreadyApproved: false };
  });
}

export async function listInventoryBalances(options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const limit = options?.limit ?? 20_000;
  const term = options?.search?.trim();
  const materialSearch = term ? or(like(materials.code, `%${term}%`), like(materials.name, `%${term}%`), like(materials.barcode, `%${term}%`)) : undefined;
  const pageMaterials = await db.select({ id: materials.id, code: materials.code, name: materials.name, description: materials.description, unit: materials.unit, minimumStock: materials.minimumStock }).from(materials).where(materialSearch).orderBy(materials.code, materials.id).limit(limit).offset(options?.offset ?? 0);
  if (!pageMaterials.length) return [];

  const materialIds = pageMaterials.map(material => material.id);
  const movementFilters = [inArray(stockMovements.materialId, materialIds)];
  if (options?.fromDate) movementFilters.push(gte(stockMovements.occurredAt, options.fromDate));
  if (options?.toDate) movementFilters.push(lte(stockMovements.occurredAt, options.toDate));
  const asOfMovementFilters = [inArray(stockMovements.materialId, materialIds)];
  if (options?.toDate) asOfMovementFilters.push(lte(stockMovements.occurredAt, options.toDate));
  const [balanceRows, movementRows, asOfMovementRows] = await Promise.all([
    db.select({ id: inventoryBalances.id, materialId: inventoryBalances.materialId, warehouseId: inventoryBalances.warehouseId, partyId: inventoryBalances.partyId, openingQuantity: inventoryBalances.openingQuantity, onHandQuantity: inventoryBalances.onHandQuantity, warehouseName: warehouses.name, partyName: parties.name }).from(inventoryBalances).leftJoin(warehouses, eq(inventoryBalances.warehouseId, warehouses.id)).leftJoin(parties, eq(inventoryBalances.partyId, parties.id)).where(inArray(inventoryBalances.materialId, materialIds)),
    db.select({ materialId: stockMovements.materialId, movementType: stockMovements.movementType, quantityIn: stockMovements.quantityIn, quantityOut: stockMovements.quantityOut, notes: memos.notes }).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).where(and(...movementFilters)),
    db.select({ materialId: stockMovements.materialId, quantityIn: stockMovements.quantityIn, quantityOut: stockMovements.quantityOut }).from(stockMovements).where(and(...asOfMovementFilters)),
  ]);

  return pageMaterials.map(material => {
    const balances = balanceRows.filter(row => row.materialId === material.id);
    const movements = movementRows.filter(row => row.materialId === material.id);
    const asOfMovements = asOfMovementRows.filter(row => row.materialId === material.id);
    const quantities = movements.reduce((total, row) => {
      const quantityIn = Number(row.quantityIn ?? 0);
      const quantityOut = Number(row.quantityOut ?? 0);
      const notes = row.notes ?? "";
      if (row.movementType === "inbound" || row.movementType === "transfer_in") total.inbound += quantityIn;
      if (row.movementType === "outbound" || row.movementType === "transfer_out") total.outbound += quantityOut;
      if (row.movementType === "inbound" && notes.includes("استلام")) total.receipt += quantityIn;
      if (row.movementType === "inbound" && (notes.includes("إدخال") || notes.includes("إرجاع"))) total.returned += quantityIn;
      return total;
    }, { inbound: 0, outbound: 0, receipt: 0, returned: 0 });
    const locations = Array.from(new Set(balances.map(row => row.partyName || row.warehouseName).filter(Boolean)));
    const firstBalance = balances[0];
    const currentQuantity = balances.reduce((total, row) => total + Number(row.onHandQuantity ?? 0), 0);
    const asOfQuantity = options?.toDate
      ? balances.reduce((total, row) => total + Number(row.openingQuantity ?? 0), 0) + asOfMovements.reduce((total, row) => total + Number(row.quantityIn ?? 0) - Number(row.quantityOut ?? 0), 0)
      : currentQuantity;
    return {
      id: firstBalance?.id ?? -material.id,
      materialId: material.id,
      warehouseId: firstBalance?.warehouseId ?? 0,
      partyId: firstBalance?.partyId ?? null,
      code: material.code,
      name: material.name,
      description: material.description,
      unit: material.unit,
      openingQuantity: String(balances.reduce((total, row) => total + Number(row.openingQuantity ?? 0), 0)),
      onHandQuantity: String(asOfQuantity),
      minimumStock: material.minimumStock,
      warehouseName: locations.length <= 1 ? locations[0] ?? "" : "متعدد الجهات / المستودعات",
      partyName: null,
      inboundQuantity: String(quantities.inbound),
      receiptQuantity: String(quantities.receipt),
      returnQuantity: String(quantities.returned),
      outboundQuantity: String(quantities.outbound),
    };
  });
}

export async function listInventoryBalancePage(options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { rows: [], hasMore: false, total: 0 };
  const pageSize = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const offset = options?.offset ?? 0;
  const allRows = await listInventoryBalances({ ...options, limit: 20_000, offset: 0 });
  const total = allRows.length;
  const rows = allRows.slice(offset, offset + pageSize);
  return { rows, hasMore: offset + rows.length < total, total };
}

export async function getMaterialCard(input: { materialId: number; warehouseId?: number; partyId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const hasLocationScope = input.warehouseId !== undefined;
  const scope = hasLocationScope ? and(eq(inventoryBalances.materialId, input.materialId), eq(inventoryBalances.warehouseId, input.warehouseId!), sql`${inventoryBalances.partyId} <=> ${input.partyId ?? null}`) : eq(inventoryBalances.materialId, input.materialId);
  const balances = await db.select({ id: inventoryBalances.id, openingQuantity: inventoryBalances.openingQuantity }).from(inventoryBalances).where(scope);
  const [material] = await db.select({ code: materials.code, name: materials.name, description: materials.description, unit: materials.unit, minimumStock: materials.minimumStock }).from(materials).where(eq(materials.id, input.materialId)).limit(1);
  if (!material) throw new Error("لم يُعثر على المادة المحددة.");
  const movementFields = { memoNumber: memos.memoNumber, memoDate: memos.memoDate, occurredAt: stockMovements.occurredAt, movementType: stockMovements.movementType, quantityIn: stockMovements.quantityIn, quantityOut: stockMovements.quantityOut, partyName: parties.name, notes: memos.notes };
  const movementBase = hasLocationScope ? [eq(stockMovements.materialId, input.materialId), eq(stockMovements.warehouseId, input.warehouseId!)] : [eq(stockMovements.materialId, input.materialId)];
  const scopedMovements = await db.select(movementFields).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).leftJoin(parties, eq(stockMovements.partyId, parties.id)).where(hasLocationScope ? and(...movementBase, sql`${stockMovements.partyId} <=> ${input.partyId ?? null}`) : and(...movementBase)).orderBy(stockMovements.occurredAt, stockMovements.id);
  // بعض الأرصدة التاريخية لا تحمل الجهة نفسها الموجودة على حركة المذكرة؛ لا نترك بطاقة المادة فارغة عند وجود حركات صحيحة للمادة والمستودع.
  const movements = scopedMovements.length > 0
    ? scopedMovements
    : await db.select(movementFields).from(stockMovements).leftJoin(memos, eq(stockMovements.memoId, memos.id)).leftJoin(parties, eq(stockMovements.partyId, parties.id)).where(and(...movementBase)).orderBy(stockMovements.occurredAt, stockMovements.id);
  return { cardNumber: hasLocationScope ? balances[0]?.id ?? null : null, openingQuantity: String(balances.reduce((total, balance) => total + Number(balance.openingQuantity ?? 0), 0)), ...material, movements };
}

export const dbSql = sql;

export async function deleteMemo(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const [memo] = await tx.select({ id: memos.id, status: memos.status, createdBy: memos.createdBy, memoNumber: memos.memoNumber }).from(memos).where(eq(memos.id, id)).limit(1);
    if (!memo) throw new Error("المذكرة غير موجودة.");
    if (memo.status !== "draft" && memo.status !== "pending_review") throw new Error("الحذف النهائي متاح لمسودات محاضر التركيب والمذكرات قيد المراجعة فقط؛ المذكرات المعتمدة أو الملغاة تبقى محفوظة.");
    const [movement] = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.memoId, id)).limit(1);
    if (movement) throw new Error("لا يمكن حذف مذكرة مرتبطة بحركة مخزون؛ استخدم الإلغاء الإداري للحفاظ على السجل التاريخي.");
    await tx.delete(memoItems).where(eq(memoItems.memoId, id));
    await tx.delete(memos).where(eq(memos.id, id));
    await tx.insert(adminAuditLogs).values({ actorId: deletedBy, action: "memo_deleted", entityType: "memo", entityId: id, entityLabel: memo.memoNumber, details: "حذف نهائي لمذكرة مسودة غير مرتبطة بحركات مخزون." });
    return { success: true as const, deletedBy };
  });
}
