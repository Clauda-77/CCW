import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const userRoles = ["user", "warehouse_keeper", "data_entry", "reviewer", "admin"] as const;
export type WarehouseRole = (typeof userRoles)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("data_entry").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", ["central", "branch", "storage"]).default("branch").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userWarehouses = mysqlTable("userwarehouses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  warehouseId: int("warehouseId").notNull(),
  assignedBy: int("assignedBy"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("userwarehouses_user_warehouse_uq").on(table.userId, table.warehouseId),
  index("userwarehouses_userId_idx").on(table.userId),
  index("userwarehouses_warehouseId_idx").on(table.warehouseId),
  index("userwarehouses_assignedBy_idx").on(table.assignedBy),
]);

export const parties = mysqlTable("parties", {
  id: int("id").autoincrement().primaryKey(),
  legacyNumber: varchar("legacyNumber", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["supplier", "recipient", "both", "internal"]).default("both").notNull(),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("parties_name_idx").on(table.name)]);

export const colleges = mysqlTable("colleges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("colleges_name_idx").on(table.name)]);

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 64 }).notNull(),
  barcode: varchar("barcode", { length: 128 }),
  minimumStock: decimal("minimumStock", { precision: 15, scale: 3 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("materials_name_idx").on(table.name), index("materials_barcode_idx").on(table.barcode)]);

export const inventoryBalances = mysqlTable("inventoryBalances", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull().references(() => materials.id),
  warehouseId: int("warehouseId").notNull().references(() => warehouses.id),
  partyId: int("partyId").references(() => parties.id),
  openingQuantity: decimal("openingQuantity", { precision: 15, scale: 3 }).default("0").notNull(),
  onHandQuantity: decimal("onHandQuantity", { precision: 15, scale: 3 }).default("0").notNull(),
  reservedQuantity: decimal("reservedQuantity", { precision: 15, scale: 3 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("inventory_balance_scope_uq").on(table.materialId, table.warehouseId, table.partyId),
  index("inventory_balance_material_idx").on(table.materialId),
  index("inventory_balance_warehouse_idx").on(table.warehouseId),
]);

export const memos = mysqlTable("memos", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["inbound", "outbound"]).notNull(),
  memoNumber: varchar("memoNumber", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "rejected", "cancelled"]).default("draft").notNull(),
  warehouseId: int("warehouseId").notNull().references(() => warehouses.id),
  partyId: int("partyId").references(() => parties.id),
  folderNumber: varchar("folderNumber", { length: 64 }),
  orderNumber: varchar("orderNumber", { length: 128 }),
  orderDate: timestamp("orderDate"),
  invoiceNumber: varchar("invoiceNumber", { length: 128 }),
  invoiceDate: timestamp("invoiceDate"),
  referenceNumber: varchar("referenceNumber", { length: 128 }),
  referenceDate: timestamp("referenceDate"),
  memoDate: timestamp("memoDate").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  reviewedBy: int("reviewedBy").references(() => users.id),
  approvedBy: int("approvedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
  printedAt: timestamp("printedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("memos_type_number_uq").on(table.type, table.memoNumber),
  index("memos_status_idx").on(table.status),
  index("memos_date_idx").on(table.memoDate),
  index("memos_party_idx").on(table.partyId),
]);

export const memoItems = mysqlTable("memoItems", {
  id: int("id").autoincrement().primaryKey(),
  memoId: int("memoId").notNull().references(() => memos.id),
  materialId: int("materialId").notNull().references(() => materials.id),
  quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("memo_items_memo_idx").on(table.memoId), index("memo_items_material_idx").on(table.materialId)]);

export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull().references(() => materials.id),
  warehouseId: int("warehouseId").notNull().references(() => warehouses.id),
  partyId: int("partyId").references(() => parties.id),
  memoId: int("memoId").references(() => memos.id),
  memoItemId: int("memoItemId").references(() => memoItems.id),
  movementType: mysqlEnum("movementType", ["opening", "inbound", "outbound", "adjustment", "transfer_in", "transfer_out"]).notNull(),
  quantityIn: decimal("quantityIn", { precision: 15, scale: 3 }).default("0").notNull(),
  quantityOut: decimal("quantityOut", { precision: 15, scale: 3 }).default("0").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("stock_movements_material_date_idx").on(table.materialId, table.occurredAt),
  index("stock_movements_warehouse_date_idx").on(table.warehouseId, table.occurredAt),
]);

export const importBatches = mysqlTable("importBatches", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["materials", "balances", "memos", "parties"]).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }),
  status: mysqlEnum("status", ["uploaded", "validating", "validated", "imported", "failed"]).default("uploaded").notNull(),
  totalRows: int("totalRows").default(0).notNull(),
  importedRows: int("importedRows").default(0).notNull(),
  errorSummary: text("errorSummary"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const adminAuditLogs = mysqlTable("adminAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull().references(() => users.id),
  action: mysqlEnum("action", ["memo_deleted", "user_role_changed", "user_created", "material_created", "material_updated", "material_deactivated", "material_deleted", "warehouse_created", "warehouse_updated", "warehouse_deactivated", "warehouse_deleted", "party_created", "party_updated", "party_deactivated", "college_created", "college_updated", "college_deactivated", "memo_created", "memo_reviewed", "memo_cancelled", "memo_approved", "import_committed", "memo_import_committed", "financial_entry_created", "memo_reconciled"]).notNull(),
  entityType: mysqlEnum("entityType", ["memo", "user", "material", "warehouse", "party", "college", "import_batch"]).notNull(),
  entityId: int("entityId").notNull(),
  entityLabel: varchar("entityLabel", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("admin_audit_actor_idx").on(table.actorId),
  index("admin_audit_created_idx").on(table.createdAt),
  index("admin_audit_entity_idx").on(table.entityType, table.entityId),
]);

export const financialEntries = mysqlTable("financialEntries", {
  id: int("id").autoincrement().primaryKey(),
  entryNumber: varchar("entryNumber", { length: 128 }).notNull(),
  entryDate: timestamp("entryDate").notNull(),
  warehouseId: int("warehouseId").notNull().references(() => warehouses.id),
  invoiceNumber: varchar("invoiceNumber", { length: 128 }),
  referenceNumber: varchar("referenceNumber", { length: 128 }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 16 }).default("SYP").notNull(),
  description: text("description"),
  source: mysqlEnum("source", ["manual", "excel", "legacy"]).default("manual").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("financial_entries_number_warehouse_uq").on(table.entryNumber, table.warehouseId),
  index("financial_entries_date_idx").on(table.entryDate),
  index("financial_entries_invoice_idx").on(table.invoiceNumber),
  index("financial_entries_warehouse_idx").on(table.warehouseId),
]);

export const memoReconciliations = mysqlTable("memoReconciliations", {
  id: int("id").autoincrement().primaryKey(),
  memoId: int("memoId").notNull().references(() => memos.id),
  financialEntryId: int("financialEntryId").references(() => financialEntries.id),
  status: mysqlEnum("status", ["pending", "matched", "mismatch", "not_found", "waived"]).default("pending").notNull(),
  differenceAmount: decimal("differenceAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  matchedBy: int("matchedBy").references(() => users.id),
  matchedAt: timestamp("matchedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("memo_reconciliations_memo_uq").on(table.memoId),
  index("memo_reconciliations_status_idx").on(table.status),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
