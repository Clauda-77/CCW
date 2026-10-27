import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: AuthenticatedUser["role"]): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "role-test-user",
      email: "roles@example.test",
      name: "اختبار الصلاحيات",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("warehouse role procedures", () => {
  it("allows a reviewer to access memo review actions", async () => {
    const caller = appRouter.createCaller(createContext("reviewer"));
    await expect(caller.warehouse.memoReviewAccess()).resolves.toEqual({ permitted: true });
  });

  it("blocks a data-entry operator from reviewer-only actions", async () => {
    const caller = appRouter.createCaller(createContext("data_entry"));
    await expect(caller.warehouse.memoReviewAccess()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a data-entry operator to access memo entry actions", async () => {
    const caller = appRouter.createCaller(createContext("data_entry"));
    await expect(caller.warehouse.memoEntryAccess()).resolves.toEqual({ permitted: true });
  });

  it("allows a warehouse keeper to access stock operations", async () => {
    const caller = appRouter.createCaller(createContext("warehouse_keeper"));
    await expect(caller.warehouse.stockAccess()).resolves.toEqual({ permitted: true });
  });

  it("blocks data-entry operators from material warehouse balance statistics", async () => {
    const caller = appRouter.createCaller(createContext("data_entry"));
    await expect(
      caller.statistics.materialWarehouseBalance({ materialId: 1, warehouseId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reserves import access for the administrator", async () => {
    const admin = appRouter.createCaller(createContext("admin"));
    const dataEntry = appRouter.createCaller(createContext("data_entry"));
    await expect(admin.warehouse.importStatus()).resolves.toEqual({ permitted: true });
    await expect(dataEntry.warehouse.importStatus()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
