// // // import { TRPCError } from "@trpc/server";
// // // import { COOKIE_NAME } from "@shared/const";
// // // import { z } from "zod";
// // // import { userRoles, WarehouseRole } from "../drizzle/schema";
// // // import * as warehouseDb from "./db";
// // // import { commitCumulativeImport, commitLinkedMemoImport } from "./cumulativeImport";
// // // import { importCategories, validateMemoWorkbooks, validateWorkbook } from "./importValidator";
// // // import { getSessionCookieOptions } from "./_core/cookies";
// // // import { ENV } from "./_core/env";
// // // import { sdk } from "./_core/sdk";
// // // import { systemRouter } from "./_core/systemRouter";
// // // import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// // // const withRoles = (...roles: WarehouseRole[]) => protectedProcedure.use(({ ctx, next }) => {
// // //   if (!ctx.user || !roles.includes(ctx.user.role as WarehouseRole)) {
// // //     throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية." });
// // //   }
// // //   return next();
// // // });

// // // export const warehouseKeeperProcedure = withRoles("warehouse_keeper", "admin");
// // // export const dataEntryProcedure = withRoles("data_entry", "warehouse_keeper", "reviewer", "admin");
// // // export const reviewerProcedure = withRoles("reviewer", "admin");
// // // export const administratorProcedure = withRoles("admin");

// // // export const appRouter = router({
// // //   system: systemRouter,
// // //   auth: router({
// // //     me: publicProcedure.query(opts => opts.ctx.user),
// // //     logout: publicProcedure.mutation(({ ctx }) => {
// // //       ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
// // //       return { success: true } as const;
// // //     }),
// // //     localLogin: publicProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
// // //       if (!ENV.localDevLoginEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "الدخول المحلي غير مفعّل. شغّل المشروع عبر pnpm dev وأضف LOCAL_DEV_LOGIN_ENABLED=true إلى ملف .env." });
// // //       if (!ENV.localDevLoginPassword || input.password !== ENV.localDevLoginPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة مرور الدخول المحلي غير صحيحة." });
// // //       const user = await warehouseDb.getUserById(input.userId);
// // //       if (!user) throw new TRPCError({ code: "NOT_FOUND", message: `لم يُعثر على المستخدم المحلي رقم ${input.userId} في قاعدة البيانات.` });
// // //       const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? `Local user ${user.id}` });
// // //       ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));
// // //       return { success: true, user: { id: user.id, name: user.name, role: user.role } } as const;
// // //     }),
// // //   }),
// // //   users: router({
// // //     list: administratorProcedure.query(() => warehouseDb.listUsers()),
// // //     previewList: publicProcedure.query(() => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listUsers();
// // //     }),
// // //     updateRole: administratorProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.updateUserRole({ ...input, actorId: ctx.user.id })),
// // //     create: administratorProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().optional().or(z.literal("")), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })),
// // //   }),
// // //   adminAudit: router({
// // //     list: administratorProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listAdminAuditLogs(input?.limit)),
// // //     previewList: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listAdminAuditLogs(input?.limit);
// // //     }),
// // //   }),
// // //   warehouse: router({
// // //     dashboard: protectedProcedure.query(() => warehouseDb.getWarehouseDashboard()),
// // //     previewDashboard: publicProcedure.query(() => {
// // //       if (process.env.NODE_ENV === "production") {
// // //         throw new TRPCError({ code: "FORBIDDEN", message: "معاينة البيانات متاحة في بيئة التطوير فقط." });
// // //       }
// // //       return warehouseDb.getWarehouseDashboard();
// // //     }),
// // //     importStatus: administratorProcedure.query(() => ({ permitted: true })),
// // //     memoReviewAccess: reviewerProcedure.query(() => ({ permitted: true })),
// // //     memoEntryAccess: dataEntryProcedure.query(() => ({ permitted: true })),
// // //     stockAccess: warehouseKeeperProcedure.query(() => ({ permitted: true })),
// // //   }),
// // //   entities: router({
// // //     overview: protectedProcedure.query(() => warehouseDb.getEntitiesOverview()),
// // //     previewOverview: publicProcedure.query(() => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.getEntitiesOverview();
// // //     }),
// // //     listWarehouses: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listWarehouses(input?.search, input?.limit)),
// // //     previewListWarehouses: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listWarehouses(input?.search, input?.limit);
// // //     }),
// // //     listParties: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listParties(input?.search, input?.limit)),
// // //     previewListParties: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listParties(input?.search, input?.limit);
// // //     }),
// // //     createWarehouse: warehouseKeeperProcedure.input(z.object({ code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createWarehouse(input, ctx.user.id)),
// // //     updateWarehouse: warehouseKeeperProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateWarehouse(input.id, input, ctx.user.id)),
// // //     deactivateWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateWarehouse(input.id, ctx.user.id)),
// // //     deleteWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteWarehouse(input.id, ctx.user.id)),
// // //     createParty: dataEntryProcedure.input(z.object({ legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createParty(input, ctx.user.id)),
// // //     updateParty: dataEntryProcedure.input(z.object({ id: z.number().int().positive(), legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateParty(input.id, input, ctx.user.id)),
// // //     deactivateParty: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateParty(input.id, ctx.user.id)),
// // //     listColleges: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listColleges(input?.search, input?.limit)),
// // //     previewListColleges: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listColleges(input?.search, input?.limit);
// // //     }),
// // //     createCollege: administratorProcedure.input(z.object({ code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createCollege(input, ctx.user.id)),
// // //     updateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateCollege(input.id, input, ctx.user.id)),
// // //     deactivateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateCollege(input.id, ctx.user.id)),
// // //   }),
// // //   memos: router({
// // //     list: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => warehouseDb.listMemos(input.type)),
// // //     previewList: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listMemos(input.type);
// // //     }),
// // //     nextSerialNumber: protectedProcedure.query(() => warehouseDb.getNextMemoSerialNumber()),
// // //     previewNextSerialNumber: publicProcedure.query(() => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.getNextMemoSerialNumber();
// // //     }),

// // //     nextMemoId: protectedProcedure.query(() => warehouseDb.getNextMemoId()),
// // // previewNextMemoId: publicProcedure.query(() => {
// // //   if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //   return warehouseDb.getNextMemoId();
// // // }),

// // //     create: dataEntryProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), memoNumber: z.string().trim().min(1).max(64), warehouseId: z.number().int().positive(), partyId: z.number().int().positive().optional(), folderNumber: z.string().trim().max(64).optional(), orderNumber: z.string().trim().max(128).optional(), orderDate: z.date().optional(), invoiceNumber: z.string().trim().max(128).optional(), invoiceDate: z.date().optional(), referenceNumber: z.string().trim().max(128).optional(), memoDate: z.date(), notes: z.string().trim().max(5000).optional(), items: z.array(z.object({ materialId: z.number().int().positive(), quantity: z.number().positive(), unitPrice: z.number().min(0).optional() })).min(1) })).mutation(({ ctx, input }) => warehouseDb.createMemo({ ...input, createdBy: ctx.user.id })),
// // //     details: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => warehouseDb.getMemoDetails(input.id)),
// // //     previewDetails: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.getMemoDetails(input.id);
// // //     }),
// // //     review: reviewerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.reviewMemo(input.id, ctx.user.id)),
// // //     approve: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.approveMemo(input.id, ctx.user.id)),
// // //     cancel: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.cancelMemo(input.id, ctx.user.id)),
// // //     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMemo(input.id, ctx.user.id)),
// // //   }),
// // //   reports: router({
// // //     journalLines: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => warehouseDb.listJournalLines(input)),
// // //     previewJournalLines: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listJournalLines(input);
// // //     }),
// // //   }),
// // //   inventory: router({
// // //     listBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalancePage(input)),
// // //     previewBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listInventoryBalancePage(input);
// // //     }),

// // // allBalances: protectedProcedure
// // //   .input(z.object({
// // //     fromDate: z.date().optional(),
// // //     toDate: z.date().optional(),
// // //     search: z.string().trim().max(160).optional(),
// // //   }).optional())
// // //   .query(({ input }) => warehouseDb.listInventoryBalances({ ...input, limit: 20_000, offset: 0 })),

// // // previewAllBalances: publicProcedure
// // //   .input(z.object({
// // //     fromDate: z.date().optional(),
// // //     toDate: z.date().optional(),
// // //     search: z.string().trim().max(160).optional(),
// // //   }).optional())
// // //   .query(({ input }) => {
// // //     if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //     return warehouseDb.listInventoryBalances({ ...input, limit: 20_000, offset: 0 });
// // //   }),

// // //     materialCard: protectedProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => warehouseDb.getMaterialCard(input)),
// // //     previewMaterialCard: publicProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.getMaterialCard(input);
// // //     }),
// // //   }),
// // //   imports: router({
// // //     validate: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateWorkbook(input.category, input.base64)),
// // //     validateMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateMemoWorkbooks(input.headerBase64, input.itemBase64)),
// // //     commit: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000), filename: z.string().trim().min(1).max(255) })).mutation(({ ctx, input }) => commitCumulativeImport({ ...input, createdBy: ctx.user.id })),
// // //     commitMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000), headerFilename: z.string().trim().min(1).max(255), itemFilename: z.string().trim().min(1).max(255), source: z.enum(["SRC", "CST"]) })).mutation(({ ctx, input }) => commitLinkedMemoImport({ ...input, createdBy: ctx.user.id })),
// // //   }),
// // //   materials: router({
// // //     list: protectedProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => warehouseDb.listMaterials(input?.search)),
// // //     previewList: publicProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => {
// // //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// // //       return warehouseDb.listMaterials(input?.search);
// // //     }),
// // //     create: dataEntryProcedure.input(z.object({
// // //       code: z.string().trim().min(1).max(64),
// // //       name: z.string().trim().min(1).max(500),
// // //       description: z.string().trim().max(5000).optional(),
// // //       unit: z.string().trim().min(1).max(64),
// // //       barcode: z.string().trim().max(128).optional(),
// // //       minimumStock: z.number().min(0).max(999999999),
// // //     })).mutation(({ ctx, input }) => warehouseDb.createMaterial(input, ctx.user.id)),
// // //     update: dataEntryProcedure.input(z.object({
// // //       id: z.number().int().positive(),
// // //       code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(500), description: z.string().trim().max(5000).optional(), unit: z.string().trim().min(1).max(64), barcode: z.string().trim().max(128).optional(), minimumStock: z.number().min(0).max(999999999),
// // //     })).mutation(({ ctx, input }) => warehouseDb.updateMaterial(input.id, input, ctx.user.id)),
// // //     deactivate: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateMaterial(input.id, ctx.user.id)),
// // //     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMaterial(input.id, ctx.user.id)),
// // //   }),
// // // });

// // // export type AppRouter = typeof appRouter;
// // import { TRPCError } from "@trpc/server";
// // import { COOKIE_NAME } from "@shared/const";
// // import { z } from "zod";
// // import { userRoles, WarehouseRole } from "../drizzle/schema";
// // import * as warehouseDb from "./db";
// // import { commitCumulativeImport, commitLinkedMemoImport } from "./cumulativeImport";
// // import { importCategories, validateMemoWorkbooks, validateWorkbook } from "./importValidator";
// // import { getSessionCookieOptions } from "./_core/cookies";
// // import { ENV } from "./_core/env";
// // import { sdk } from "./_core/sdk";
// // import { systemRouter } from "./_core/systemRouter";
// // import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// // const withRoles = (...roles: WarehouseRole[]) => protectedProcedure.use(({ ctx, next }) => {
// //   if (!ctx.user || !roles.includes(ctx.user.role as WarehouseRole)) {
// //     throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية." });
// //   }
// //   return next();
// // });

// // export const warehouseKeeperProcedure = withRoles("warehouse_keeper", "admin");
// // export const dataEntryProcedure = withRoles("data_entry", "warehouse_keeper", "reviewer", "admin");
// // export const reviewerProcedure = withRoles("reviewer", "admin");
// // export const administratorProcedure = withRoles("admin");

// // export const appRouter = router({
// //   system: systemRouter,
// //   auth: router({
// //     me: publicProcedure.query(opts => opts.ctx.user),
// //     logout: publicProcedure.mutation(({ ctx }) => {
// //       ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
// //       return { success: true } as const;
// //     }),
// //     localLogin: publicProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
// //       if (!ENV.localDevLoginEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "الدخول المحلي غير مفعّل. شغّل المشروع عبر pnpm dev وأضف LOCAL_DEV_LOGIN_ENABLED=true إلى ملف .env." });
// //       if (!ENV.localDevLoginPassword || input.password !== ENV.localDevLoginPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة مرور الدخول المحلي غير صحيحة." });
// //       const user = await warehouseDb.getUserById(input.userId);
// //       if (!user) throw new TRPCError({ code: "NOT_FOUND", message: `لم يُعثر على المستخدم المحلي رقم ${input.userId} في قاعدة البيانات.` });
// //       const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? `Local user ${user.id}` });
// //       ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));
// //       return { success: true, user: { id: user.id, name: user.name, role: user.role } } as const;
// //     }),
// //   }),
// //   users: router({
// //     list: administratorProcedure.query(() => warehouseDb.listUsers()),
// //     previewList: publicProcedure.query(() => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listUsers();
// //     }),
// //     updateRole: administratorProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.updateUserRole({ ...input, actorId: ctx.user.id })),
// //     create: administratorProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().optional().or(z.literal("")), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })),
// //   }),
// //   adminAudit: router({
// //     list: administratorProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listAdminAuditLogs(input?.limit)),
// //     previewList: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listAdminAuditLogs(input?.limit);
// //     }),
// //   }),
// //   warehouse: router({
// //     dashboard: protectedProcedure.query(() => warehouseDb.getWarehouseDashboard()),
// //     previewDashboard: publicProcedure.query(() => {
// //       if (process.env.NODE_ENV === "production") {
// //         throw new TRPCError({ code: "FORBIDDEN", message: "معاينة البيانات متاحة في بيئة التطوير فقط." });
// //       }
// //       return warehouseDb.getWarehouseDashboard();
// //     }),
// //     importStatus: administratorProcedure.query(() => ({ permitted: true })),
// //     memoReviewAccess: reviewerProcedure.query(() => ({ permitted: true })),
// //     memoEntryAccess: dataEntryProcedure.query(() => ({ permitted: true })),
// //     stockAccess: warehouseKeeperProcedure.query(() => ({ permitted: true })),
// //   }),
// //   entities: router({
// //     overview: protectedProcedure.query(() => warehouseDb.getEntitiesOverview()),
// //     previewOverview: publicProcedure.query(() => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.getEntitiesOverview();
// //     }),
// //     listWarehouses: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listWarehouses(input?.search, input?.limit)),
// //     previewListWarehouses: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listWarehouses(input?.search, input?.limit);
// //     }),
// //     listParties: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listParties(input?.search, input?.limit)),
// //     previewListParties: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listParties(input?.search, input?.limit);
// //     }),
// //     createWarehouse: warehouseKeeperProcedure.input(z.object({ code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createWarehouse(input, ctx.user.id)),
// //     updateWarehouse: warehouseKeeperProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateWarehouse(input.id, input, ctx.user.id)),
// //     deactivateWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateWarehouse(input.id, ctx.user.id)),
// //     deleteWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteWarehouse(input.id, ctx.user.id)),
// //     createParty: dataEntryProcedure.input(z.object({ legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createParty(input, ctx.user.id)),
// //     updateParty: dataEntryProcedure.input(z.object({ id: z.number().int().positive(), legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateParty(input.id, input, ctx.user.id)),
// //     deactivateParty: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateParty(input.id, ctx.user.id)),
// //     listColleges: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listColleges(input?.search, input?.limit)),
// //     previewListColleges: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listColleges(input?.search, input?.limit);
// //     }),
// //     createCollege: administratorProcedure.input(z.object({ code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createCollege(input, ctx.user.id)),
// //     updateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateCollege(input.id, input, ctx.user.id)),
// //     deactivateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateCollege(input.id, ctx.user.id)),
// //   }),
// //   memos: router({
// //     list: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => warehouseDb.listMemos(input.type)),
// //     previewList: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listMemos(input.type);
// //     }),
// //     nextSerialNumber: protectedProcedure.query(() => warehouseDb.getNextMemoSerialNumber()),
// //     previewNextSerialNumber: publicProcedure.query(() => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.getNextMemoSerialNumber();
// //     }),
// //     create: dataEntryProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), memoNumber: z.string().trim().min(1).max(64), warehouseId: z.number().int().positive(), partyId: z.number().int().positive().optional(), folderNumber: z.string().trim().max(64).optional(), orderNumber: z.string().trim().max(128).optional(), orderDate: z.date().optional(), invoiceNumber: z.string().trim().max(128).optional(), invoiceDate: z.date().optional(), referenceNumber: z.string().trim().max(128).optional(), memoDate: z.date(), notes: z.string().trim().max(5000).optional(), items: z.array(z.object({ materialId: z.number().int().positive(), quantity: z.number().positive(), unitPrice: z.number().min(0).optional(), notes: z.string().trim().max(2000).optional() })).min(1) })).mutation(({ ctx, input }) => warehouseDb.createMemo({ ...input, createdBy: ctx.user.id })),
// //     details: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => warehouseDb.getMemoDetails(input.id)),
// //     previewDetails: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.getMemoDetails(input.id);
// //     }),
// //     review: reviewerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.reviewMemo(input.id, ctx.user.id)),
// //     approve: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.approveMemo(input.id, ctx.user.id)),
// //     cancel: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.cancelMemo(input.id, ctx.user.id)),
// //     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMemo(input.id, ctx.user.id)),
// //   }),
// //   reports: router({
// //     journalLines: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => warehouseDb.listJournalLines(input)),
// //     previewJournalLines: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listJournalLines(input);
// //     }),
// //   }),
// //   inventory: router({
// //     listBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalancePage(input)),
// //     previewBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listInventoryBalancePage(input);
// //     }),
// //     reportBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalances(input)),
// //     previewReportBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listInventoryBalances(input);
// //     }),
// //     materialCard: protectedProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => warehouseDb.getMaterialCard(input)),
// //     previewMaterialCard: publicProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.getMaterialCard(input);
// //     }),
// //   }),
// //   imports: router({
// //     validate: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateWorkbook(input.category, input.base64)),
// //     validateMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateMemoWorkbooks(input.headerBase64, input.itemBase64)),
// //     commit: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000), filename: z.string().trim().min(1).max(255) })).mutation(({ ctx, input }) => commitCumulativeImport({ ...input, createdBy: ctx.user.id })),
// //     commitMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000), headerFilename: z.string().trim().min(1).max(255), itemFilename: z.string().trim().min(1).max(255), source: z.enum(["SRC", "CST"]) })).mutation(({ ctx, input }) => commitLinkedMemoImport({ ...input, createdBy: ctx.user.id })),
// //   }),
// //   materials: router({
// //     list: protectedProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => warehouseDb.listMaterials(input?.search)),
// //     previewList: publicProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => {
// //       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
// //       return warehouseDb.listMaterials(input?.search);
// //     }),
// //     create: dataEntryProcedure.input(z.object({
// //       code: z.string().trim().min(1).max(64),
// //       name: z.string().trim().min(1).max(500),
// //       description: z.string().trim().max(5000).optional(),
// //       unit: z.string().trim().min(1).max(64),
// //       barcode: z.string().trim().max(128).optional(),
// //       minimumStock: z.number().min(0).max(999999999),
// //     })).mutation(({ ctx, input }) => warehouseDb.createMaterial(input, ctx.user.id)),
// //     update: dataEntryProcedure.input(z.object({
// //       id: z.number().int().positive(),
// //       code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(500), description: z.string().trim().max(5000).optional(), unit: z.string().trim().min(1).max(64), barcode: z.string().trim().max(128).optional(), minimumStock: z.number().min(0).max(999999999),
// //     })).mutation(({ ctx, input }) => warehouseDb.updateMaterial(input.id, input, ctx.user.id)),
// //     deactivate: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateMaterial(input.id, ctx.user.id)),
// //     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMaterial(input.id, ctx.user.id)),
// //   }),
// // });

// // export type AppRouter = typeof appRouter;
// import { TRPCError } from "@trpc/server";
// import { COOKIE_NAME } from "@shared/const";
// import { z } from "zod";
// import { userRoles, WarehouseRole } from "../drizzle/schema";
// import * as warehouseDb from "./db";
// import { commitCumulativeImport, commitLinkedMemoImport } from "./cumulativeImport";
// import { importCategories, validateMemoWorkbooks, validateWorkbook } from "./importValidator";
// import { getSessionCookieOptions } from "./_core/cookies";
// import { ENV } from "./_core/env";
// import { sdk } from "./_core/sdk";
// import { systemRouter } from "./_core/systemRouter";
// import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// const withRoles = (...roles: WarehouseRole[]) => protectedProcedure.use(({ ctx, next }) => {
//   if (!ctx.user || !roles.includes(ctx.user.role as WarehouseRole)) {
//     throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية." });
//   }
//   return next();
// });

// export const warehouseKeeperProcedure = withRoles("warehouse_keeper", "admin");
// export const dataEntryProcedure = withRoles("data_entry", "warehouse_keeper", "reviewer", "admin");
// export const reviewerProcedure = withRoles("reviewer", "admin");
// export const administratorProcedure = withRoles("admin");

// export const appRouter = router({
//   system: systemRouter,
//   auth: router({
//     me: publicProcedure.query(opts => opts.ctx.user),
//     logout: publicProcedure.mutation(({ ctx }) => {
//       ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
//       return { success: true } as const;
//     }),
//     localLogin: publicProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
//       if (!ENV.localDevLoginEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "الدخول المحلي غير مفعّل. شغّل المشروع عبر pnpm dev وأضف LOCAL_DEV_LOGIN_ENABLED=true إلى ملف .env." });
//       if (!ENV.localDevLoginPassword || input.password !== ENV.localDevLoginPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة مرور الدخول المحلي غير صحيحة." });
//       const user = await warehouseDb.getUserById(input.userId);
//       if (!user) throw new TRPCError({ code: "NOT_FOUND", message: `لم يُعثر على المستخدم المحلي رقم ${input.userId} في قاعدة البيانات.` });
//       const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? `Local user ${user.id}` });
//       ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));
//       return { success: true, user: { id: user.id, name: user.name, role: user.role } } as const;
//     }),
//   }),
//   users: router({
//     list: administratorProcedure.query(() => warehouseDb.listUsers()),
//     previewList: publicProcedure.query(() => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listUsers();
//     }),
//     updateRole: administratorProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.updateUserRole({ ...input, actorId: ctx.user.id })),
//     create: administratorProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().optional().or(z.literal("")), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })),
//   }),
//   adminAudit: router({
//     list: administratorProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listAdminAuditLogs(input?.limit)),
//     previewList: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listAdminAuditLogs(input?.limit);
//     }),
//   }),
//   warehouse: router({
//     dashboard: protectedProcedure.query(() => warehouseDb.getWarehouseDashboard()),
//     previewDashboard: publicProcedure.query(() => {
//       if (process.env.NODE_ENV === "production") {
//         throw new TRPCError({ code: "FORBIDDEN", message: "معاينة البيانات متاحة في بيئة التطوير فقط." });
//       }
//       return warehouseDb.getWarehouseDashboard();
//     }),
//     importStatus: administratorProcedure.query(() => ({ permitted: true })),
//     memoReviewAccess: reviewerProcedure.query(() => ({ permitted: true })),
//     memoEntryAccess: dataEntryProcedure.query(() => ({ permitted: true })),
//     stockAccess: warehouseKeeperProcedure.query(() => ({ permitted: true })),
//   }),
//   entities: router({
//     overview: protectedProcedure.query(() => warehouseDb.getEntitiesOverview()),
//     previewOverview: publicProcedure.query(() => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.getEntitiesOverview();
//     }),
//     listWarehouses: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listWarehouses(input?.search, input?.limit)),
//     previewListWarehouses: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listWarehouses(input?.search, input?.limit);
//     }),
//     listParties: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listParties(input?.search, input?.limit)),
//     previewListParties: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listParties(input?.search, input?.limit);
//     }),
//     createWarehouse: warehouseKeeperProcedure.input(z.object({ code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createWarehouse(input, ctx.user.id)),
//     updateWarehouse: warehouseKeeperProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateWarehouse(input.id, input, ctx.user.id)),
//     deactivateWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateWarehouse(input.id, ctx.user.id)),
//     deleteWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteWarehouse(input.id, ctx.user.id)),
//     createParty: dataEntryProcedure.input(z.object({ legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createParty(input, ctx.user.id)),
//     updateParty: dataEntryProcedure.input(z.object({ id: z.number().int().positive(), legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateParty(input.id, input, ctx.user.id)),
//     deactivateParty: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateParty(input.id, ctx.user.id)),
//     listColleges: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listColleges(input?.search, input?.limit)),
//     previewListColleges: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listColleges(input?.search, input?.limit);
//     }),
//     createCollege: administratorProcedure.input(z.object({ code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createCollege(input, ctx.user.id)),
//     updateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateCollege(input.id, input, ctx.user.id)),
//     deactivateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateCollege(input.id, ctx.user.id)),
//   }),
//   memos: router({
//     list: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => warehouseDb.listMemos(input.type)),
//     previewList: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listMemos(input.type);
//     }),
//     nextSerialNumber: protectedProcedure.query(() => warehouseDb.getNextMemoSerialNumber()),
//     previewNextSerialNumber: publicProcedure.query(() => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.getNextMemoSerialNumber();
//     }),
//     create: dataEntryProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), memoNumber: z.string().trim().min(1).max(64), warehouseId: z.number().int().positive(), partyId: z.number().int().positive().optional(), folderNumber: z.string().trim().max(64).optional(), orderNumber: z.string().trim().max(128).optional(), orderDate: z.date().optional(), invoiceNumber: z.string().trim().max(128).optional(), invoiceDate: z.date().optional(), referenceNumber: z.string().trim().max(128).optional(), memoDate: z.date(), notes: z.string().trim().max(5000).optional(), items: z.array(z.object({ materialId: z.number().int().positive(), quantity: z.number().positive(), unitPrice: z.number().min(0).optional(), notes: z.string().trim().max(2000).optional() })).min(1) })).mutation(({ ctx, input }) => warehouseDb.createMemo({ ...input, createdBy: ctx.user.id })),
//     details: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => warehouseDb.getMemoDetails(input.id)),
//     previewDetails: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.getMemoDetails(input.id);
//     }),
//     review: reviewerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.reviewMemo(input.id, ctx.user.id)),
//     approve: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.approveMemo(input.id, ctx.user.id)),
//     cancel: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.cancelMemo(input.id, ctx.user.id)),
//     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMemo(input.id, ctx.user.id)),
//   }),
//   reports: router({
//     journalLines: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => warehouseDb.listJournalLines(input)),
//     previewJournalLines: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listJournalLines(input);
//     }),
//   }),
//   inventory: router({
//     listBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalancePage(input)),
//     previewBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listInventoryBalancePage(input);
//     }),
//     reportBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalances(input)),
//     previewReportBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listInventoryBalances(input);
//     }),
//     materialCard: protectedProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => warehouseDb.getMaterialCard(input)),
//     previewMaterialCard: publicProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.getMaterialCard(input);
//     }),
//   }),
//   imports: router({
//     validate: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateWorkbook(input.category, input.base64)),
//     validateMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateMemoWorkbooks(input.headerBase64, input.itemBase64)),
//     commit: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000), filename: z.string().trim().min(1).max(255) })).mutation(({ ctx, input }) => commitCumulativeImport({ ...input, createdBy: ctx.user.id })),
//     commitMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000), headerFilename: z.string().trim().min(1).max(255), itemFilename: z.string().trim().min(1).max(255), source: z.enum(["SRC", "CST"]) })).mutation(({ ctx, input }) => commitLinkedMemoImport({ ...input, createdBy: ctx.user.id })),
//   }),
//   materials: router({
//     list: protectedProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => warehouseDb.listMaterials(input?.search)),
//     previewList: publicProcedure.input(z.object({ search: z.string().max(160).optional() }).optional()).query(({ input }) => {
//       if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
//       return warehouseDb.listMaterials(input?.search);
//     }),
//     create: dataEntryProcedure.input(z.object({
//       code: z.string().trim().min(1).max(64),
//       name: z.string().trim().min(1).max(500),
//       description: z.string().trim().max(5000).optional(),
//       unit: z.string().trim().min(1).max(64),
//       barcode: z.string().trim().max(128).optional(),
//       minimumStock: z.number().min(0).max(999999999),
//     })).mutation(({ ctx, input }) => warehouseDb.createMaterial(input, ctx.user.id)),
//     update: dataEntryProcedure.input(z.object({
//       id: z.number().int().positive(),
//       code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(500), description: z.string().trim().max(5000).optional(), unit: z.string().trim().min(1).max(64), barcode: z.string().trim().max(128).optional(), minimumStock: z.number().min(0).max(999999999),
//     })).mutation(({ ctx, input }) => warehouseDb.updateMaterial(input.id, input, ctx.user.id)),
//     deactivate: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateMaterial(input.id, ctx.user.id)),
//     delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMaterial(input.id, ctx.user.id)),
//   }),
// });

// export type AppRouter = typeof appRouter;
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { userRoles, WarehouseRole } from "../drizzle/schema";
import * as warehouseDb from "./db";
import {
  commitCumulativeImport,
  commitLinkedMemoImport,
} from "./cumulativeImport";
import {
  importCategories,
  validateMemoWorkbooks,
  validateWorkbook,
} from "./importValidator";
import {
  commitFinancialWorkbook,
  validateFinancialWorkbook,
} from "./financialImport";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const withRoles = (...roles: WarehouseRole[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role as WarehouseRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية.",
      });
    }
    return next();
  });

export const warehouseKeeperProcedure = withRoles("warehouse_keeper", "reviewer", "admin");
export const dataEntryProcedure = withRoles(
  "data_entry",
  "warehouse_keeper",
  "reviewer",
  "admin"
);
export const reviewerProcedure = withRoles("reviewer", "admin");
export const administratorProcedure = withRoles("admin");

async function assertWarehouseAccess(user: { id: number; role: WarehouseRole }, warehouseId: number) {
  if (user.role === "admin") return;
  const assigned = await warehouseDb.listUserWarehouses(user.id);
  if (!assigned.some(warehouse => warehouse.id === warehouseId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "لا تملك صلاحية الوصول إلى هذا المستودع.",
    });
  }
}

async function getAccessibleWarehouseIds(user: any): Promise<number[] | null> {
  if (user.role === "admin") return null;
  const assigned = await warehouseDb.listUserWarehouses(user.id);
  return assigned.map(warehouse => warehouse.id);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    assignedWarehouses: protectedProcedure.query(({ ctx }) =>
      warehouseDb.listUserWarehouses(ctx.user.id)
    ),
    loginWarehouses: publicProcedure.query(async () => {
      const warehouses = await warehouseDb.listWarehouses("", 500);
      return warehouses.filter(warehouse => warehouse.isActive);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
    localLogin: publicProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          password: z.string().min(1).max(256),
          warehouseId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ENV.localDevLoginEnabled)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "الدخول المحلي غير مفعّل. شغّل المشروع عبر pnpm dev وأضف LOCAL_DEV_LOGIN_ENABLED=true إلى ملف .env.",
          });
        if (
          !ENV.localDevLoginPassword ||
          input.password !== ENV.localDevLoginPassword
        )
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "كلمة مرور الدخول المحلي غير صحيحة.",
          });
        const user = await warehouseDb.getUserById(input.userId);
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `لم يُعثر على المستخدم المحلي رقم ${input.userId} في قاعدة البيانات.`,
          });
        const warehouse = await warehouseDb.getWarehouseById(input.warehouseId);
        if (!warehouse || !warehouse.isActive)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "المستودع المحدد غير موجود أو غير نشط.",
          });
        const assignedWarehouses = await warehouseDb.listUserWarehouses(user.id);
        if (
          user.role !== "admin" &&
          !assignedWarehouses.some(assigned => assigned.id === warehouse.id)
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "هذا المستخدم غير مسند إلى المستودع المحدد. اطلب من المدير إسناده أولاً.",
          });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? `Local user ${user.id}`,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
        });
        ctx.res.cookie(
          COOKIE_NAME,
          sessionToken,
          getSessionCookieOptions(ctx.req)
        );
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
          },
        } as const;
      }),
  }),
  users: router({
    list: administratorProcedure.query(() => warehouseDb.listUsers()),
    previewList: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production")
        throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listUsers();
    }),
    updateRole: administratorProcedure
      .input(
        z.object({ id: z.number().int().positive(), role: z.enum(userRoles) })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateUserRole({ ...input, actorId: ctx.user.id })
      ),
    updateWarehouse: administratorProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          warehouseId: z.number().int().positive(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateUserWarehouse({ ...input, actorId: ctx.user.id })
      ),
    create: administratorProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(160),
          email: z.string().trim().email().optional().or(z.literal("")),
          role: z.enum(userRoles),
          warehouseId: z.number().int().positive(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })
      ),
  }),
  adminAudit: router({
    list: administratorProcedure
      .input(
        z
          .object({ limit: z.number().int().min(1).max(500).optional() })
          .optional()
      )
      .query(({ input }) => warehouseDb.listAdminAuditLogs(input?.limit)),
    previewList: publicProcedure
      .input(
        z
          .object({ limit: z.number().int().min(1).max(500).optional() })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listAdminAuditLogs(input?.limit);
      }),
  }),
  warehouse: router({
    dashboard: protectedProcedure.query(() =>
      warehouseDb.getWarehouseDashboard()
    ),
    previewDashboard: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "معاينة البيانات متاحة في بيئة التطوير فقط.",
        });
      }
      return warehouseDb.getWarehouseDashboard();
    }),
    importStatus: administratorProcedure.query(() => ({ permitted: true })),
    memoReviewAccess: reviewerProcedure.query(() => ({ permitted: true })),
    memoEntryAccess: dataEntryProcedure.query(() => ({ permitted: true })),
    stockAccess: warehouseKeeperProcedure.query(() => ({ permitted: true })),
  }),
  entities: router({
    overview: protectedProcedure.query(() => warehouseDb.getEntitiesOverview()),
    previewOverview: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production")
        throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getEntitiesOverview();
    }),
    listWarehouses: protectedProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const rows = await warehouseDb.listWarehouses(input?.search, input?.limit);
        const allowed = await getAccessibleWarehouseIds(ctx.user);
        return allowed === null ? rows : rows.filter(row => allowed.includes(row.id));
      }),
    previewListWarehouses: publicProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listWarehouses(input?.search, input?.limit);
      }),
    listParties: protectedProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(5000).optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        warehouseDb.listParties(input?.search, input?.limit ?? 5000)
      ),
    previewListParties: publicProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(5000).optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listParties(input?.search, input?.limit ?? 5000);
      }),
    createWarehouse: warehouseKeeperProcedure
      .input(
        z.object({
          code: z.string().trim().min(1).max(64),
          name: z.string().trim().min(1).max(255),
          kind: z.enum(["central", "branch", "storage"]),
          notes: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.createWarehouse(input, ctx.user.id)
      ),
    updateWarehouse: warehouseKeeperProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          code: z.string().trim().min(1).max(64),
          name: z.string().trim().min(1).max(255),
          kind: z.enum(["central", "branch", "storage"]),
          notes: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateWarehouse(input.id, input, ctx.user.id)
      ),
    deactivateWarehouse: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deactivateWarehouse(input.id, ctx.user.id)
      ),
    deleteWarehouse: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deleteWarehouse(input.id, ctx.user.id)
      ),
    createParty: dataEntryProcedure
      .input(
        z.object({
          legacyNumber: z.string().trim().max(64).optional(),
          name: z.string().trim().min(1).max(255),
          type: z.enum(["supplier", "recipient", "both", "internal"]),
          phone: z.string().trim().max(64).optional(),
          address: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.createParty(input, ctx.user.id)
      ),
    updateParty: dataEntryProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          legacyNumber: z.string().trim().max(64).optional(),
          name: z.string().trim().min(1).max(255),
          type: z.enum(["supplier", "recipient", "both", "internal"]),
          phone: z.string().trim().max(64).optional(),
          address: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateParty(input.id, input, ctx.user.id)
      ),
    deactivateParty: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deactivateParty(input.id, ctx.user.id)
      ),
    listColleges: protectedProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        warehouseDb.listColleges(input?.search, input?.limit)
      ),
    previewListColleges: publicProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listColleges(input?.search, input?.limit);
      }),
    createCollege: administratorProcedure
      .input(
        z.object({
          code: z.string().trim().max(64).optional(),
          name: z.string().trim().min(1).max(255),
          notes: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.createCollege(input, ctx.user.id)
      ),
    updateCollege: administratorProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          code: z.string().trim().max(64).optional(),
          name: z.string().trim().min(1).max(255),
          notes: z.string().trim().max(5000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateCollege(input.id, input, ctx.user.id)
      ),
    deactivateCollege: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deactivateCollege(input.id, ctx.user.id)
      ),
  }),
  memos: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["inbound", "outbound"]) }))
      .query(async ({ ctx, input }) => {
        const rows = await warehouseDb.listMemos(input.type);
        const allowed = await getAccessibleWarehouseIds(ctx.user);
        return allowed === null ? rows : rows.filter(row => allowed.includes(row.warehouseId));
      }),
    previewList: publicProcedure
      .input(z.object({ type: z.enum(["inbound", "outbound"]) }))
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listMemos(input.type);
      }),
    nextSerialNumber: protectedProcedure.query(() =>
      warehouseDb.getNextMemoSerialNumber()
    ),
    previewNextSerialNumber: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production")
        throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getNextMemoSerialNumber();
    }),
    nextMemoId: protectedProcedure.query(() => warehouseDb.getNextMemoId()),
    previewNextMemoId: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production")
        throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getNextMemoId();
    }),
    create: dataEntryProcedure
      .input(
        z.object({
          type: z.enum(["inbound", "outbound"]),
          classification: z.enum([
            "purchase",
            "adjustment",
            "transfer",
            "return",
          ]),
          memoNumber: z.string().trim().min(1).max(64),
          warehouseId: z.number().int().positive(),
          partyId: z.number().int().positive().optional(),
          folderNumber: z.string().trim().max(64).optional(),
          orderNumber: z.string().trim().max(128).optional(),
          orderDate: z.date().optional(),
          invoiceNumber: z.string().trim().max(128).optional(),
          invoiceDate: z.date().optional(),
          referenceNumber: z.string().trim().max(128).optional(),
          memoDate: z.date(),
          notes: z.string().trim().max(5000).optional(),
          items: z
            .array(
              z.object({
                materialId: z.number().int().positive(),
                quantity: z.number().positive(),
                unitPrice: z.number().min(0).optional(),
                notes: z.string().trim().max(2000).optional(),
              })
            )
            .min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let warehouseId = input.warehouseId;
        if (ctx.user.role !== "admin") {
          const assigned = await warehouseDb.listUserWarehouses(ctx.user.id);
          const sessionWarehouseId = (ctx.user as { warehouseId?: number | null }).warehouseId;
          const assignedWarehouseId =
            sessionWarehouseId && assigned.some(row => row.id === sessionWarehouseId)
              ? sessionWarehouseId
              : assigned.length === 1
                ? assigned[0].id
                : null;
          if (!assignedWarehouseId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يوجد مستودع واحد مسند إلى حسابك. اطلب من المدير إسناد المستودع.",
            });
          }
          if (input.warehouseId !== assignedWarehouseId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكنك إنشاء مذكرة على مستودع غير مستودعك المسند.",
            });
          }
          warehouseId = assignedWarehouseId;
        }
        await assertWarehouseAccess(ctx.user, warehouseId);
        return warehouseDb.createMemo({
          ...input,
          warehouseId,
          createdBy: ctx.user.id,
        });
      }),
    details: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return memo;
      }),
    update: dataEntryProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          classification: z.enum([
            "purchase",
            "adjustment",
            "transfer",
            "return",
          ]),
          memoNumber: z.string().trim().min(1).max(64),
          warehouseId: z.number().int().positive(),
          partyId: z.number().int().positive().optional(),
          folderNumber: z.string().trim().max(64).optional(),
          orderNumber: z.string().trim().max(128).optional(),
          orderDate: z.date().optional(),
          invoiceNumber: z.string().trim().max(128).optional(),
          invoiceDate: z.date().optional(),
          referenceNumber: z.string().trim().max(128).optional(),
          memoDate: z.date(),
          notes: z.string().trim().max(5000).optional(),
          items: z
            .array(
              z.object({
                materialId: z.number().int().positive(),
                quantity: z.number().positive(),
                unitPrice: z.number().min(0).optional(),
                notes: z.string().trim().max(2000).optional(),
              })
            )
            .min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertWarehouseAccess(ctx.user, input.warehouseId);
        const existing = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, existing.warehouseId);
        return warehouseDb.updateMemo({ ...input, updatedBy: ctx.user.id });
      }),
    previewDetails: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.getMemoDetails(input.id);
      }),
    review: reviewerProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.reviewMemo(input.id, ctx.user.id);
      }),
    approve: reviewerProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.approveMemo(input.id, ctx.user.id);
      }),
    cancel: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.cancelMemo(input.id, ctx.user.id);
      }),
    delete: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.id);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.deleteMemo(input.id, ctx.user.id);
      }),
  }),
  finance: router({
    entries: protectedProcedure.query(async ({ ctx }) => {
      const allowed = await getAccessibleWarehouseIds(ctx.user);
      return warehouseDb.listFinancialEntries(allowed);
    }),
    reconciliationSummary: protectedProcedure.query(async ({ ctx }) => {
      const allowed = await getAccessibleWarehouseIds(ctx.user);
      return warehouseDb.listFinanceReconciliationSummary(allowed);
    }),
    reconcileAll: reviewerProcedure.mutation(async ({ ctx }) => {
      const allowed = await getAccessibleWarehouseIds(ctx.user);
      const memos = [
        ...(await warehouseDb.listMemos("inbound")),
        ...(await warehouseDb.listMemos("outbound")),
      ].filter(memo => memo.status !== "cancelled" && (allowed === null || allowed.includes(memo.warehouseId)));
      let matched = 0;
      let mismatch = 0;
      let notFound = 0;
      for (const memo of memos) {
        const result = await warehouseDb.reconcileMemo(memo.id, ctx.user.id);
        if (result.status === "matched") matched += 1;
        else if (result.status === "mismatch") mismatch += 1;
        else if (result.status === "not_found") notFound += 1;
      }
      return { total: memos.length, matched, mismatch, notFound };
    }),
    validateImport: administratorProcedure
      .input(z.object({ base64: z.string().min(1).max(40_000_000) }))
      .mutation(({ input }) => validateFinancialWorkbook(input.base64)),
    commitImport: administratorProcedure
      .input(z.object({
        base64: z.string().min(1).max(40_000_000),
        filename: z.string().trim().min(1).max(255),
      }))
      .mutation(({ ctx, input }) =>
        commitFinancialWorkbook({ ...input, createdBy: ctx.user.id })
      ),
    reconciliation: protectedProcedure
      .input(z.object({ memoId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.memoId);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.getMemoReconciliation(input.memoId);
      }),
    reconcile: reviewerProcedure
      .input(z.object({ memoId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const memo = await warehouseDb.getMemoDetails(input.memoId);
        await assertWarehouseAccess(ctx.user, memo.warehouseId);
        return warehouseDb.reconcileMemo(input.memoId, ctx.user.id);
      }),
  }),
  statistics: router({
    dashboard: warehouseKeeperProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
          })
          .optional()
      )
      .query(({ input }) => warehouseDb.getWarehouseStatistics(input ?? {})),
    previewDashboard: publicProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.getWarehouseStatistics(input ?? {});
      }),
    deliveredQuantity: warehouseKeeperProcedure
      .input(
        z
          .object({
            partyId: z.number().int().positive().optional(),
            materialId: z.number().int().positive().optional(),
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        warehouseDb.getDeliveredQuantityStatistics(input ?? {})
      ),
    previewDeliveredQuantity: publicProcedure
      .input(
        z
          .object({
            partyId: z.number().int().positive().optional(),
            materialId: z.number().int().positive().optional(),
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.getDeliveredQuantityStatistics(input ?? {});
      }),
  }),
  reports: router({
    journalLines: protectedProcedure
      .input(
        z.object({
          type: z.enum(["inbound", "outbound"]),
          fromDate: z.date().optional(),
          toDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const rows = await warehouseDb.listJournalLines(input);
        const allowed = await getAccessibleWarehouseIds(ctx.user);
        return allowed === null ? rows : rows.filter(row => allowed.includes(row.warehouseId));
      }),
    previewJournalLines: publicProcedure
      .input(
        z.object({
          type: z.enum(["inbound", "outbound"]),
          fromDate: z.date().optional(),
          toDate: z.date().optional(),
        })
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listJournalLines(input);
      }),
  }),
  inventory: router({
    listBalances: protectedProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
            search: z.string().trim().max(160).optional(),
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const rows = await warehouseDb.listInventoryBalancePage(input);
        const allowed = await getAccessibleWarehouseIds(ctx.user);
        return allowed === null ? rows : { ...rows, rows: rows.rows.filter(row => allowed.includes(row.warehouseId)) };
      }),
    previewBalances: publicProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
            search: z.string().trim().max(160).optional(),
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listInventoryBalancePage(input);
      }),
    reportBalances: protectedProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
            search: z.string().trim().max(160).optional(),
            onlyMoved: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const rows = await warehouseDb.listInventoryBalances(input);
        const allowed = await getAccessibleWarehouseIds(ctx.user);
        return allowed === null ? rows : rows.filter(row => allowed.includes(row.warehouseId));
      }),
    previewReportBalances: publicProcedure
      .input(
        z
          .object({
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
            search: z.string().trim().max(160).optional(),
            onlyMoved: z.boolean().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listInventoryBalances(input);
      }),
    materialCard: protectedProcedure
      .input(
        z.object({
          materialId: z.number().int().positive(),
          warehouseId: z.number().int().positive().optional(),
          partyId: z.number().int().positive().nullable().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (input.warehouseId !== undefined) await assertWarehouseAccess(ctx.user, input.warehouseId);
        else if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "يجب تحديد المستودع لعرض بطاقة المادة." });
        return warehouseDb.getMaterialCard(input);
      }),
    previewMaterialCard: publicProcedure
      .input(
        z.object({
          materialId: z.number().int().positive(),
          warehouseId: z.number().int().positive().optional(),
          partyId: z.number().int().positive().nullable().optional(),
        })
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.getMaterialCard(input);
      }),
  }),
  imports: router({
    validate: administratorProcedure
      .input(
        z.object({
          category: z.enum(importCategories),
          base64: z.string().min(1).max(40_000_000),
        })
      )
      .mutation(({ input }) => validateWorkbook(input.category, input.base64)),
    validateMemos: administratorProcedure
      .input(
        z.object({
          headerBase64: z.string().min(1).max(40_000_000),
          itemBase64: z.string().min(1).max(40_000_000),
        })
      )
      .mutation(({ input }) =>
        validateMemoWorkbooks(input.headerBase64, input.itemBase64)
      ),
    commit: administratorProcedure
      .input(
        z.object({
          category: z.enum(importCategories),
          base64: z.string().min(1).max(40_000_000),
          filename: z.string().trim().min(1).max(255),
        })
      )
      .mutation(({ ctx, input }) =>
        commitCumulativeImport({ ...input, createdBy: ctx.user.id })
      ),
    commitMemos: administratorProcedure
      .input(
        z.object({
          headerBase64: z.string().min(1).max(40_000_000),
          itemBase64: z.string().min(1).max(40_000_000),
          headerFilename: z.string().trim().min(1).max(255),
          itemFilename: z.string().trim().min(1).max(255),
          source: z.enum(["SRC", "CST"]),
        })
      )
      .mutation(({ ctx, input }) =>
        commitLinkedMemoImport({ ...input, createdBy: ctx.user.id })
      ),
  }),
  materials: router({
    list: protectedProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(5000).optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        warehouseDb.listMaterials(input?.search, input?.limit ?? 5000)
      ),
    previewList: publicProcedure
      .input(
        z
          .object({
            search: z.string().max(160).optional(),
            limit: z.number().int().min(1).max(5000).optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production")
          throw new TRPCError({ code: "FORBIDDEN" });
        return warehouseDb.listMaterials(input?.search, input?.limit ?? 5000);
      }),
    create: administratorProcedure
      .input(
        z.object({
          code: z.string().trim().min(1).max(64),
          name: z.string().trim().min(1).max(500),
          description: z.string().trim().max(5000).optional(),
          unit: z.string().trim().min(1).max(64),
          barcode: z.string().trim().max(128).optional(),
          minimumStock: z.number().min(0).max(999999999),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.createMaterial(input, ctx.user.id)
      ),
    update: administratorProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          code: z.string().trim().min(1).max(64),
          name: z.string().trim().min(1).max(500),
          description: z.string().trim().max(5000).optional(),
          unit: z.string().trim().min(1).max(64),
          barcode: z.string().trim().max(128).optional(),
          minimumStock: z.number().min(0).max(999999999),
        })
      )
      .mutation(({ ctx, input }) =>
        warehouseDb.updateMaterial(input.id, input, ctx.user.id)
      ),
    deactivate: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deactivateMaterial(input.id, ctx.user.id)
      ),
    delete: administratorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        warehouseDb.deleteMaterial(input.id, ctx.user.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;
