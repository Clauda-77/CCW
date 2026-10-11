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
import { commitCumulativeImport, commitLinkedMemoImport } from "./cumulativeImport";
import { importCategories, validateMemoWorkbooks, validateWorkbook } from "./importValidator";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const withRoles = (...roles: WarehouseRole[]) => protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !roles.includes(ctx.user.role as WarehouseRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية." });
  }
  return next();
});

export const warehouseKeeperProcedure = withRoles("warehouse_keeper", "admin");
export const dataEntryProcedure = withRoles("data_entry", "warehouse_keeper", "reviewer", "admin");
export const reviewerProcedure = withRoles("reviewer", "admin");
export const administratorProcedure = withRoles("admin");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    localLogin: publicProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      if (!ENV.localDevLoginEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "الدخول المحلي غير مفعّل. شغّل المشروع عبر pnpm dev وأضف LOCAL_DEV_LOGIN_ENABLED=true إلى ملف .env." });
      if (!ENV.localDevLoginPassword || input.password !== ENV.localDevLoginPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة مرور الدخول المحلي غير صحيحة." });
      const user = await warehouseDb.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: `لم يُعثر على المستخدم المحلي رقم ${input.userId} في قاعدة البيانات.` });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? `Local user ${user.id}` });
      ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));
      return { success: true, user: { id: user.id, name: user.name, role: user.role } } as const;
    }),
  }),
  users: router({
    list: administratorProcedure.query(() => warehouseDb.listUsers()),
    previewList: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listUsers();
    }),
    updateRole: administratorProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.updateUserRole({ ...input, actorId: ctx.user.id })),
    create: administratorProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().optional().or(z.literal("")), role: z.enum(userRoles) })).mutation(({ ctx, input }) => warehouseDb.createLocalUser({ ...input, actorId: ctx.user.id })),
  }),
  adminAudit: router({
    list: administratorProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listAdminAuditLogs(input?.limit)),
    previewList: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listAdminAuditLogs(input?.limit);
    }),
  }),
  warehouse: router({
    dashboard: protectedProcedure.query(() => warehouseDb.getWarehouseDashboard()),
    previewDashboard: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({ code: "FORBIDDEN", message: "معاينة البيانات متاحة في بيئة التطوير فقط." });
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
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getEntitiesOverview();
    }),
    listWarehouses: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listWarehouses(input?.search, input?.limit)),
    previewListWarehouses: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listWarehouses(input?.search, input?.limit);
    }),
    listParties: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(5000).optional() }).optional()).query(({ input }) => warehouseDb.listParties(input?.search, input?.limit ?? 5000)),
    previewListParties: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(5000).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listParties(input?.search, input?.limit ?? 5000);
    }),
    createWarehouse: warehouseKeeperProcedure.input(z.object({ code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createWarehouse(input, ctx.user.id)),
    updateWarehouse: warehouseKeeperProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255), kind: z.enum(["central", "branch", "storage"]), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateWarehouse(input.id, input, ctx.user.id)),
    deactivateWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateWarehouse(input.id, ctx.user.id)),
    deleteWarehouse: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteWarehouse(input.id, ctx.user.id)),
    createParty: dataEntryProcedure.input(z.object({ legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createParty(input, ctx.user.id)),
    updateParty: dataEntryProcedure.input(z.object({ id: z.number().int().positive(), legacyNumber: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), type: z.enum(["supplier", "recipient", "both", "internal"]), phone: z.string().trim().max(64).optional(), address: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateParty(input.id, input, ctx.user.id)),
    deactivateParty: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateParty(input.id, ctx.user.id)),
    listColleges: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => warehouseDb.listColleges(input?.search, input?.limit)),
    previewListColleges: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listColleges(input?.search, input?.limit);
    }),
    createCollege: administratorProcedure.input(z.object({ code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.createCollege(input, ctx.user.id)),
    updateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive(), code: z.string().trim().max(64).optional(), name: z.string().trim().min(1).max(255), notes: z.string().trim().max(5000).optional() })).mutation(({ ctx, input }) => warehouseDb.updateCollege(input.id, input, ctx.user.id)),
    deactivateCollege: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateCollege(input.id, ctx.user.id)),
  }),
  memos: router({
    list: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => warehouseDb.listMemos(input.type)),
    previewList: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]) })).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listMemos(input.type);
    }),
    nextSerialNumber: protectedProcedure.query(() => warehouseDb.getNextMemoSerialNumber()),
    previewNextSerialNumber: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getNextMemoSerialNumber();
    }),
    nextMemoId: protectedProcedure.query(() => warehouseDb.getNextMemoId()),
    previewNextMemoId: publicProcedure.query(() => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getNextMemoId();
    }),
    create: dataEntryProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), classification: z.enum(["purchase", "adjustment", "transfer", "return"]), memoNumber: z.string().trim().min(1).max(64), warehouseId: z.number().int().positive(), partyId: z.number().int().positive().optional(), folderNumber: z.string().trim().max(64).optional(), orderNumber: z.string().trim().max(128).optional(), orderDate: z.date().optional(), invoiceNumber: z.string().trim().max(128).optional(), invoiceDate: z.date().optional(), referenceNumber: z.string().trim().max(128).optional(), memoDate: z.date(), notes: z.string().trim().max(5000).optional(), items: z.array(z.object({ materialId: z.number().int().positive(), quantity: z.number().positive(), unitPrice: z.number().min(0).optional(), notes: z.string().trim().max(2000).optional() })).min(1) })).mutation(({ ctx, input }) => warehouseDb.createMemo({ ...input, createdBy: ctx.user.id })),
    details: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => warehouseDb.getMemoDetails(input.id)),
    update: dataEntryProcedure.input(z.object({ id: z.number().int().positive(), classification: z.enum(["purchase", "adjustment", "transfer", "return"]), memoNumber: z.string().trim().min(1).max(64), warehouseId: z.number().int().positive(), partyId: z.number().int().positive().optional(), folderNumber: z.string().trim().max(64).optional(), orderNumber: z.string().trim().max(128).optional(), orderDate: z.date().optional(), invoiceNumber: z.string().trim().max(128).optional(), invoiceDate: z.date().optional(), referenceNumber: z.string().trim().max(128).optional(), memoDate: z.date(), notes: z.string().trim().max(5000).optional(), items: z.array(z.object({ materialId: z.number().int().positive(), quantity: z.number().positive(), unitPrice: z.number().min(0).optional(), notes: z.string().trim().max(2000).optional() })).min(1) })).mutation(({ ctx, input }) => warehouseDb.updateMemo({ ...input, updatedBy: ctx.user.id })),
    previewDetails: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getMemoDetails(input.id);
    }),
    review: reviewerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.reviewMemo(input.id, ctx.user.id)),
    approve: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.approveMemo(input.id, ctx.user.id)),
    cancel: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.cancelMemo(input.id, ctx.user.id)),
    delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMemo(input.id, ctx.user.id)),
  }),
  statistics: router({
    dashboard: warehouseKeeperProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }).optional()).query(({ input }) => warehouseDb.getWarehouseStatistics(input ?? {})),
    previewDashboard: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getWarehouseStatistics(input ?? {});
    }),
    deliveredQuantity: warehouseKeeperProcedure.input(z.object({ partyId: z.number().int().positive().optional(), materialId: z.number().int().positive().optional(), fromDate: z.date().optional(), toDate: z.date().optional() }).optional()).query(({ input }) => warehouseDb.getDeliveredQuantityStatistics(input ?? {})),
    previewDeliveredQuantity: publicProcedure.input(z.object({ partyId: z.number().int().positive().optional(), materialId: z.number().int().positive().optional(), fromDate: z.date().optional(), toDate: z.date().optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getDeliveredQuantityStatistics(input ?? {});
    }),
  }),
  reports: router({
    journalLines: protectedProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => warehouseDb.listJournalLines(input)),
    previewJournalLines: publicProcedure.input(z.object({ type: z.enum(["inbound", "outbound"]), fromDate: z.date().optional(), toDate: z.date().optional() })).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listJournalLines(input);
    }),
  }),
  inventory: router({
    listBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalancePage(input)),
    previewBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listInventoryBalancePage(input);
    }),
    reportBalances: protectedProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => warehouseDb.listInventoryBalances(input)),
    previewReportBalances: publicProcedure.input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional(), search: z.string().trim().max(160).optional(), onlyMoved: z.boolean().optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listInventoryBalances(input);
    }),
    materialCard: protectedProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => warehouseDb.getMaterialCard(input)),
    previewMaterialCard: publicProcedure.input(z.object({ materialId: z.number().int().positive(), warehouseId: z.number().int().positive().optional(), partyId: z.number().int().positive().nullable().optional() })).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.getMaterialCard(input);
    }),
  }),
  imports: router({
    validate: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateWorkbook(input.category, input.base64)),
    validateMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000) })).mutation(({ input }) => validateMemoWorkbooks(input.headerBase64, input.itemBase64)),
    commit: administratorProcedure.input(z.object({ category: z.enum(importCategories), base64: z.string().min(1).max(40_000_000), filename: z.string().trim().min(1).max(255) })).mutation(({ ctx, input }) => commitCumulativeImport({ ...input, createdBy: ctx.user.id })),
    commitMemos: administratorProcedure.input(z.object({ headerBase64: z.string().min(1).max(40_000_000), itemBase64: z.string().min(1).max(40_000_000), headerFilename: z.string().trim().min(1).max(255), itemFilename: z.string().trim().min(1).max(255), source: z.enum(["SRC", "CST"]) })).mutation(({ ctx, input }) => commitLinkedMemoImport({ ...input, createdBy: ctx.user.id })),
  }),
  materials: router({
    list: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(5000).optional() }).optional()).query(({ input }) => warehouseDb.listMaterials(input?.search, input?.limit ?? 5000)),
    previewList: publicProcedure.input(z.object({ search: z.string().max(160).optional(), limit: z.number().int().min(1).max(5000).optional() }).optional()).query(({ input }) => {
      if (process.env.NODE_ENV === "production") throw new TRPCError({ code: "FORBIDDEN" });
      return warehouseDb.listMaterials(input?.search, input?.limit ?? 5000);
    }),
    create: dataEntryProcedure.input(z.object({
      code: z.string().trim().min(1).max(64),
      name: z.string().trim().min(1).max(500),
      description: z.string().trim().max(5000).optional(),
      unit: z.string().trim().min(1).max(64),
      barcode: z.string().trim().max(128).optional(),
      minimumStock: z.number().min(0).max(999999999),
    })).mutation(({ ctx, input }) => warehouseDb.createMaterial(input, ctx.user.id)),
    update: dataEntryProcedure.input(z.object({
      id: z.number().int().positive(),
      code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(500), description: z.string().trim().max(5000).optional(), unit: z.string().trim().min(1).max(64), barcode: z.string().trim().max(128).optional(), minimumStock: z.number().min(0).max(999999999),
    })).mutation(({ ctx, input }) => warehouseDb.updateMaterial(input.id, input, ctx.user.id)),
    deactivate: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deactivateMaterial(input.id, ctx.user.id)),
    delete: administratorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => warehouseDb.deleteMaterial(input.id, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
