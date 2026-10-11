/**
 * تعرض الرموز المستوردة بصورة مناسبة للمستخدم. لا تغير هذه الدالة القيمة
 * التاريخية المخزنة أو المستخدمة في الطلبات والطباعة أو التصدير.
 */
export function displayCode(value: string | number | null | undefined) {
  const raw = String(value ?? "").trim();
  const cleaned = raw.replace(/^legacy[-_\s]*/i, "").trim();
  return cleaned || raw || "—";
}
