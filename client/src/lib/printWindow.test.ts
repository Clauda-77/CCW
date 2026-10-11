import { describe, expect, it, vi } from "vitest";
import { openPrintWindow } from "./printWindow";

describe("نافذة الطباعة الموثوقة", () => {
  it("تحجز نافذة الطباعة مباشرة وتعرض حالة تجهيز قبل كتابة النموذج", () => {
    const open = vi.fn();
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const page = { document: { open, write, close }, focus, close } as unknown as Window;
    const windowOpen = vi.fn(() => page);
    vi.stubGlobal("window", { open: windowOpen });

    const result = openPrintWindow("مذكرة استلام");

    expect(result).toBe(page);
    expect(windowOpen).toHaveBeenCalledWith("", "_blank", "width=1280,height=900");
    expect(open).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledWith(expect.stringContaining("جار تجهيز معاينة الطباعة"));
    expect(close).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("يتعامل بأمان مع تعذر كتابة النافذة المحجوزة", () => {
    const close = vi.fn();
    const page = { document: { open: vi.fn(() => { throw new Error("blocked"); }) }, close } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });

    expect(openPrintWindow()).toBeNull();
    expect(close).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
