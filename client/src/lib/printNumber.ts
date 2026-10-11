// export function formatPrintNumber(value: unknown): string {
//   const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
//   if (!Number.isFinite(numeric)) return "";
//   return numeric.toLocaleString("ar", { maximumFractionDigits: 6 });
// }

// export function formatPrintInteger(value: unknown): string {
//   const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
//   if (!Number.isFinite(numeric)) return "";
//   return Math.round(numeric).toLocaleString("ar");
// }

export function formatPrintNumber(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/,/g, ""));

  if (!Number.isFinite(numeric)) return "";

  return numeric.toLocaleString("ar", {
    useGrouping: false,
    maximumFractionDigits: 6,
  });
}

export function formatPrintInteger(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/,/g, ""));

  if (!Number.isFinite(numeric)) return "";

  return Math.round(numeric).toLocaleString("ar", {
    useGrouping: false,
  });
}

