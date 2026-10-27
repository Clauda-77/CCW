import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { formatPrintNumber } from "@/lib/printNumber";
import { printMemo } from "@/lib/memoPrint";
import { classifyMemo, memoClassificationHasPrice } from "@shared/memoClassification";
import { ArrowRight, ClipboardCheck, FileText, Printer, ReceiptText } from "lucide-react";
import { useLocation, useRoute } from "wouter";

const statusLabel = { draft: "مسودة", pending_review: "بانتظار المراجعة", approved: "معتمدة", rejected: "مرفوضة", cancelled: "ملغاة" } as const;
const reconciliationLabel = { matched: "مطابقة", mismatch: "يوجد فرق", not_found: "القيد غير موجود", pending: "بانتظار المطابقة", waived: "مستثناة" } as const;

export default function MemoDetailsPage({ byNumber = false }: { byNumber?: boolean }) {
  const [, params] = useRoute("/memos/:id");
  const [, numberParams] = useRoute("/memos/by-number/:number");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const id = Number(params?.id || 0);
  const memoNumber = decodeURIComponent(numberParams?.number || "");
  const live = trpc.memos.details.useQuery({ id }, { enabled: !byNumber && id >= 0 && isAuthenticated && !isDevelopment });
  const preview = trpc.memos.previewDetails.useQuery({ id }, { enabled: !byNumber && id >= 0 && isDevelopment });
  const liveByNumber = trpc.memos.detailsByNumber.useQuery({ memoNumber }, { enabled: byNumber && Boolean(memoNumber) && isAuthenticated && !isDevelopment });
  const previewByNumber = trpc.memos.previewDetailsByNumber.useQuery({ memoNumber }, { enabled: byNumber && Boolean(memoNumber) && isDevelopment });
  const query = byNumber ? (isDevelopment ? previewByNumber : liveByNumber) : (isDevelopment ? preview : live);
  const resolvedMemoId = query.data?.id ?? id;
  const reconciliation = trpc.finance.reconciliation.useQuery({ memoId: resolvedMemoId }, { enabled: resolvedMemoId >= 0 && isAuthenticated });
  const utils = trpc.useUtils();
  const reconcileMutation = trpc.finance.reconcile.useMutation({ onSuccess: async () => { await utils.finance.reconciliation.invalidate({ memoId: id }); } });
  const memo = query.data;
  if (query.isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">جار تحميل تفاصيل المذكرة…</div>;
  if ((!byNumber && id < 0) || (byNumber && !memoNumber) || query.isError || !memo) return <div className="legacy-panel mx-auto max-w-lg rounded-xl p-8 text-center"><h1 className="text-xl font-extrabold">تعذر فتح المذكرة</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">{(!byNumber && id < 0) || (byNumber && !memoNumber) ? "رابط المذكرة غير صالح." : query.error?.message || "المذكرة غير موجودة أو لا تملك صلاحية الوصول إليها."}</p><Button className="mt-5" onClick={() => setLocation("/outbound")}>العودة إلى سجل المذكرات</Button></div>;
  const inbound = memo.type === "inbound";
  const classification = classifyMemo({ type: memo.type, notes: memo.notes });
  const hasPrice = memoClassificationHasPrice(classification);
  const total = memo.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const fields = [
    ["رقم المذكرة", memo.memoNumber], ["التاريخ", new Date(memo.memoDate).toLocaleDateString("ar")], ["الجهة", memo.partyName || "—"],
    ["المستودع", memo.warehouseName], ["رقم المجلد", memo.folderNumber || "—"], ["رقم الطلب", memo.orderNumber || "—"],
    ["تاريخ الطلب", memo.orderDate ? new Date(memo.orderDate).toLocaleDateString("ar") : "—"], ["رقم الفاتورة", memo.invoiceNumber || "—"],
    ["تاريخ الفاتورة", memo.invoiceDate ? new Date(memo.invoiceDate).toLocaleDateString("ar") : "—"],
    ...((classification === "purchase" || classification === "transfer") ? [["الرقم المالي", memo.referenceNumber || memo.memoNumber]] : []),
  ];
  return <div className="mx-auto max-w-6xl space-y-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Button variant="outline" onClick={() => setLocation(inbound ? "/inbound" : "/outbound")}><ArrowRight className="ml-2 h-4 w-4" />العودة إلى السجل</Button><div className="flex gap-2"><Button variant="outline" disabled={reconcileMutation.isPending || user?.role === "warehouse_keeper"} onClick={() => reconcileMutation.mutate({ memoId: resolvedMemoId })}><ClipboardCheck className="ml-2 h-4 w-4" />{reconcileMutation.isPending ? "جار المطابقة…" : "مطابقة مع المالية"}</Button><Button onClick={() => printMemo(memo)} className="bg-[#0071ba] hover:bg-[#00558d] "><FileText className="ml-2 h-4 w-4" />معاينة قبل الطباعة</Button></div></div>
    <Card className="legacy-panel overflow-hidden rounded-xl print:border-0 print:shadow-none"><CardContent className="p-0">
      <header className="legacy-hero-sky flex flex-col gap-3 border-b-4 border-[#e44a32] p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 bg-white/15"><ReceiptText className="h-6 w-6" /></span><div><p className="text-xs text-white/80">نظام المستودعات — مركز الحاسب</p><h1 className="mt-1 text-2xl font-extrabold">{inbound ? "مذكرة استلام وإدخال" : "مذكرة تسليم وإخراج"}</h1></div></div><div className="text-right sm:text-left"><p className="text-xs text-white/75">رقم المذكرة</p><p className="mt-1 text-xl font-extrabold tracking-wide">{memo.memoNumber}</p></div></header>
      <div className="grid gap-0 lg:grid-cols-[0.78fr_1.55fr]"><aside className="border-b border-[#c4e7f6] bg-[#eaf8fe] p-5 lg:border-b-0 lg:border-l"><div className="flex items-center gap-2 text-sm font-extrabold text-[#07518e]"><ClipboardCheck className="h-4 w-4" />حالة المذكرة</div><Badge className="mt-3 border-0 bg-white text-[#0069ad] shadow-sm hover:bg-white">{statusLabel[memo.status]}</Badge><div className="mt-7 space-y-4">{hasPrice && <div><p className="text-xs text-[#4b7792]">قيمة المذكرة النهائية</p><p className="mt-1 text-2xl font-extrabold text-[#07518e]">{total ? formatPrintNumber(total) : "—"}</p></div>}<div className="border-t border-[#c4e7f6] pt-4"><p className="text-xs text-[#4b7792]">عدد بنود المواد</p><p className="mt-1 text-lg font-extrabold text-[#07518e]">{memo.items.length.toLocaleString("ar")} بند</p></div><div className="border-t border-[#c4e7f6] pt-4"><p className="text-xs text-[#4b7792]">حالة الطباعة</p><p className="mt-1 text-sm font-bold text-[#167050]">نموذج جاهز للطباعة</p></div></div></aside><section className="grid gap-px bg-[#c4e7f6] sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-h-20 bg-white/90 p-4"><p className="text-xs font-semibold text-[#4b7792]">{label}</p><p className="mt-2 text-sm font-extrabold text-[#153f61]">{value}</p></div>)}</section></div>
      <section className="p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-[#084b89]">بنود المذكرة</h2><p className="mt-1 text-xs text-muted-foreground">تفاصيل المواد والكميات والسعر حسب المذكرة المحددة.</p></div><span className="rounded-md bg-[#fff0dc] px-3 py-1 text-xs font-bold text-[#ba6307]">{inbound ? "وارد إلى المستودع" : "صادر من المستودع"}</span></div><div className="overflow-x-auto"><table className={`w-full ${hasPrice ? "min-w-[760px]" : "min-w-[600px]"} text-right`}><thead className="bg-[#dff4ff] text-xs text-[#17638d]"><tr><th className="px-4 py-3">تسلسل</th><th className="px-4 py-3">رمز المادة</th><th className="px-4 py-3">اسم المادة</th><th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">الكمية المستلمة</th>{hasPrice && <><th className="px-4 py-3">السعر</th><th className="px-4 py-3">الإجمالي</th></>}</tr></thead><tbody>{memo.items.map((item, index) => { const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0); return <tr key={item.id} className="border-b border-[#d9eff9] text-sm"><td className="px-4 py-4 text-muted-foreground">{(index + 1).toLocaleString("ar")}</td><td className="px-4 py-4 text-muted-foreground">{displayCode(item.code)}</td><td className="px-4 py-4 font-bold">{item.name}</td><td className="px-4 py-4">{item.unit}</td><td className="px-4 py-4 font-extrabold text-[#0069ad]">{formatPrintNumber(item.quantity)}</td>{hasPrice && <><td className="px-4 py-4">{item.unitPrice ? formatPrintNumber(item.unitPrice) : "—"}</td><td className="px-4 py-4 font-bold text-[#07518e]">{lineTotal ? formatPrintNumber(lineTotal) : "—"}</td></>}</tr>; })}</tbody></table></div></section>
      <footer className="grid gap-px border-t border-[#c4e7f6] bg-[#c4e7f6] text-sm sm:grid-cols-3"><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">إعداد المذكرة</p><p className="mt-6 text-xs text-muted-foreground">الاسم والتوقيع</p></div><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">المراجعة والمطابقة</p><p className="mt-4 text-xs text-muted-foreground">{reconciliation.data ? reconciliationLabel[reconciliation.data.status] : "لم تتم المطابقة بعد"}</p></div><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">الاعتماد</p><p className="mt-6 text-xs text-muted-foreground">الاسم والتوقيع والختم</p></div></footer>{memo.notes && <div className="border-t border-[#c4e7f6] bg-[#edf9ff] p-4 text-sm"><span className="font-bold text-[#07518e]">ملاحظات: </span>{memo.notes}</div>}
    </CardContent></Card>
  </div>;
}
