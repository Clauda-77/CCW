import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

const routerSource = readFileSync(
  new URL("./routers.ts", import.meta.url),
  "utf8"
);
const envSource = readFileSync(
  new URL("./_core/env.ts", import.meta.url),
  "utf8"
);
const sdkSource = readFileSync(
  new URL("./_core/sdk.ts", import.meta.url),
  "utf8"
);
const cookieSource = readFileSync(
  new URL("./_core/cookies.ts", import.meta.url),
  "utf8"
);
const loginSource = readFileSync(
  new URL("../client/src/pages/Login.tsx", import.meta.url),
  "utf8"
);

describe("local development login", () => {
  it("is enabled only from development environment settings", () => {
    expect(envSource).toContain('process.env.NODE_ENV !== "production"');
    expect(envSource).toContain("LOCAL_DEV_LOGIN_ENABLED");
    expect(envSource).toContain("LOCAL_DEV_LOGIN_PASSWORD");
    expect(envSource).toContain("LOCAL_DEV_USER_ID");
    expect(sdkSource).toContain('appId: ENV.appId || "warehouse-local"');
    expect(cookieSource).toContain(
      'sameSite: isSecureRequest(req) ? "none" : "lax"'
    );
  });

  it("uses the existing session cookie and an existing users row", () => {
    expect(routerSource).toContain("localLogin");
    expect(routerSource).toContain("warehouseDb.getUserById(input.userId)");
    expect(routerSource).toContain("sdk.createSessionToken(user.openId");
    expect(routerSource).toContain("ctx.res.cookie(COOKIE_NAME");
  });

  it("renders a local password form only in development builds", () => {
    expect(loginSource).toContain("const isLocalDev = import.meta.env.DEV");
    expect(loginSource).toContain("const isLocalDev = import.meta.env.DEV");
    expect(loginSource).not.toContain("محلي");
    expect(loginSource).toContain("localLogin.mutate");
    expect(loginSource).toContain("warehouseId: Number(localWarehouseId)");
    expect(loginSource).toContain("auth.loginWarehouses.useQuery");
  });

  it("uses a localhost-compatible session cookie for local development", () => {
    const options = getSessionCookieOptions({
      protocol: "http",
      headers: {},
    } as any);
    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });
});

export {};
