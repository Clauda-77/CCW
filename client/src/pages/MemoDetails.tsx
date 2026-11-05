// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { useAuth } from "@/_core/hooks/useAuth";
// import { trpc } from "@/lib/trpc";
// import { displayCode } from "@/lib/displayCode";
// import { displayMemoNumber } from "@/lib/memoNumber";
// import { formatPrintNumber } from "@/lib/printNumber";
// import { printMemo } from "@/lib/memoPrint";
// import { classifyMemo, memoClassificationHasPrice } from "@shared/memoClassification";
// import { ArrowRight, ClipboardCheck, FileText, Printer, ReceiptText } from "lucide-react";
// import { useLocation, useRoute } from "wouter";

// const statusLabel = { draft: "مسودة", pending_review: "بانتظار المراجعة", approved: "معتمدة", rejected: "مرفوضة", cancelled: "ملغاة" } as const;
// const reconciliationLabel = { matched: "مطابقة", mismatch: "يوجد فرق", not_found: "القيد غير موجود", pending: "بانتظار المطابقة", waived: "مستثناة" } as const;

// type MemoDetailsPageProps = { byNumber?: boolean };

// export default function MemoDetailsPage({ byNumber = false }: MemoDetailsPageProps = {}) {
//   const [, idParams] = useRoute("/memos/:id");
//   const [, numberParams] = useRoute("/memos/by-number/:number");
//   const [, setLocation] = useLocation();
//   const { isAuthenticated, user } = useAuth();
//   const isDevelopment = import.meta.env.DEV;
//   const rawMemoNumber = numberParams?.number ?? "";
//   const parsedId = Number(idParams?.id);
//   const hasValidId = Number.isInteger(parsedId) && parsedId >= 0;
//   const hasValidNumber = rawMemoNumber.trim().length > 0 && rawMemoNumber.length <= 64;
//   const id = hasValidId ? parsedId : 1;
//   const live = trpc.memos.details.useQuery({ id }, { enabled: hasValidId && isAuthenticated && !isDevelopment });
//   const preview = trpc.memos.previewDetails.useQuery({ id }, { enabled: hasValidId && isDevelopment });
//   const byNumberInput = { memoNumber: rawMemoNumber || "invalid" };
//   const liveByNumber = trpc.memos.detailsByNumber.useQuery(byNumberInput, { enabled: byNumber && hasValidNumber && isAuthenticated && !isDevelopment });
//   const previewByNumber = trpc.memos.previewDetailsByNumber.useQuery(byNumberInput, { enabled: byNumber && hasValidNumber && isDevelopment });
//   const idQuery = isDevelopment ? preview : live;
//   const numberQuery = isDevelopment ? previewByNumber : liveByNumber;
//   const query = byNumber ? numberQuery : idQuery;
//   const memo = query.data;
//   const memoId = memo?.id ?? id;
//   const reconciliation = trpc.finance.reconciliation.useQuery({ memoId }, { enabled: isAuthenticated && Boolean(memo) });
//   const utils = trpc.useUtils();
//   const reconcileMutation = trpc.finance.reconcile.useMutation({ onSuccess: async () => { await utils.finance.reconciliation.invalidate({ memoId }); } });
//   if (query.isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">جار تحميل تفاصيل المذكرة…</div>;
//   if (query.isError || !memo) return <div className="legacy-panel mx-auto max-w-lg rounded-xl p-8 text-center"><h1 className="text-xl font-extrabold">تعذر فتح المذكرة</h1><Button className="mt-5" onClick={() => setLocation("/")}>العودة إلى الرئيسية</Button></div>;
//   const inbound = memo.type === "inbound";
//   const classification = classifyMemo({ type: memo.type, notes: memo.notes });
//   const hasPrice = memoClassificationHasPrice(classification);
//   const total = memo.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
//   const fields = [
//     ["رقم المذكرة", displayMemoNumber(memo.sourceMemoNumber, memo.memoNumber)], ["التاريخ", new Date(memo.memoDate).toLocaleDateString("ar")], ["الجهة", memo.partyName || "—"],
//     ["المستودع", memo.warehouseName], ["رقم المجلد", memo.folderNumber || "—"], ["رقم الطلب", memo.orderNumber || "—"],
//     ["تاريخ الطلب", memo.orderDate ? new Date(memo.orderDate).toLocaleDateString("ar") : "—"], ["رقم الفاتورة", memo.invoiceNumber || "—"],
//     ["تاريخ الفاتورة", memo.invoiceDate ? new Date(memo.invoiceDate).toLocaleDateString("ar") : "—"],
//     ...((classification === "purchase" || classification === "transfer") ? [["الرقم المالي", memo.referenceNumber || displayMemoNumber(memo.sourceMemoNumber, memo.memoNumber)]] : []),
//   ];
//   return <div className="mx-auto max-w-6xl space-y-5" dir="rtl">
//     <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Button variant="outline" onClick={() => setLocation(inbound ? "/inbound" : "/outbound")}><ArrowRight className="ml-2 h-4 w-4" />العودة إلى السجل</Button><div className="flex gap-2"><Button variant="outline" disabled={reconcileMutation.isPending || !memo || (user?.role !== "admin" && user?.role !== "reviewer")} onClick={() => memo && reconcileMutation.mutate({ memoId: memo.id })}><ClipboardCheck className="ml-2 h-4 w-4" />{reconcileMutation.isPending ? "جار المطابقة…" : "مطابقة مع المالية"}</Button><Button onClick={() => printMemo(memo)} className="bg-[#0071ba] hover:bg-[#00558d]"><FileText className="ml-2 h-4 w-4" />معاينة قبل الطباعة</Button></div></div>
//     <Card className="legacy-panel overflow-hidden rounded-xl print:border-0 print:shadow-none"><CardContent className="p-0">
//       <header className="legacy-hero-sky flex flex-col gap-3 border-b-4 border-[#e44a32] p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 bg-white/15"><ReceiptText className="h-6 w-6" /></span><div><p className="text-xs text-white/80">نظام المستودعات — مركز الحاسب</p><h1 className="mt-1 text-2xl font-extrabold">{inbound ? "مذكرة استلام وإدخال" : "مذكرة تسليم وإخراج"}</h1></div></div><div className="text-right sm:text-left"><p className="text-xs text-white/75">رقم المذكرة</p><p className="mt-1 text-xl font-extrabold tracking-wide">{displayMemoNumber(memo.sourceMemoNumber, memo.memoNumber)}</p></div></header>
//       <div className="grid gap-0 lg:grid-cols-[0.78fr_1.55fr]"><aside className="border-b border-[#c4e7f6] bg-[#eaf8fe] p-5 lg:border-b-0 lg:border-l"><div className="flex items-center gap-2 text-sm font-extrabold text-[#07518e]"><ClipboardCheck className="h-4 w-4" />حالة المذكرة</div><Badge className="mt-3 border-0 bg-white text-[#0069ad] shadow-sm hover:bg-white">{statusLabel[memo.status]}</Badge><div className="mt-7 space-y-4">{hasPrice && <div><p className="text-xs text-[#4b7792]">قيمة المذكرة النهائية</p><p className="mt-1 text-2xl font-extrabold text-[#07518e]">{total ? formatPrintNumber(total) : "—"}</p></div>}<div className="border-t border-[#c4e7f6] pt-4"><p className="text-xs text-[#4b7792]">عدد بنود المواد</p><p className="mt-1 text-lg font-extrabold text-[#07518e]">{memo.items.length.toLocaleString("ar")} بند</p></div><div className="border-t border-[#c4e7f6] pt-4"><p className="text-xs text-[#4b7792]">حالة الطباعة</p><p className="mt-1 text-sm font-bold text-[#167050]">نموذج جاهز للطباعة</p></div></div></aside><section className="grid gap-px bg-[#c4e7f6] sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-h-20 bg-white/90 p-4"><p className="text-xs font-semibold text-[#4b7792]">{label}</p><p className="mt-2 text-sm font-extrabold text-[#153f61]">{value}</p></div>)}</section></div>
//       <section className="p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-[#084b89]">بنود المذكرة</h2><p className="mt-1 text-xs text-muted-foreground">تفاصيل المواد والكميات والسعر حسب المذكرة المحددة.</p></div><span className="rounded-md bg-[#fff0dc] px-3 py-1 text-xs font-bold text-[#ba6307]">{inbound ? "وارد إلى المستودع" : "صادر من المستودع"}</span></div><div className="overflow-x-auto"><table className={`w-full ${hasPrice ? "min-w-[760px]" : "min-w-[600px]"} text-right`}><thead className="bg-[#dff4ff] text-xs text-[#17638d]"><tr><th className="px-4 py-3">تسلسل</th><th className="px-4 py-3">رمز المادة</th><th className="px-4 py-3">اسم المادة</th><th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">الكمية المستلمة</th>{hasPrice && <><th className="px-4 py-3">السعر</th><th className="px-4 py-3">الإجمالي</th></>}</tr></thead><tbody>{memo.items.map((item, index) => { const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0); return <tr key={item.id} className="border-b border-[#d9eff9] text-sm"><td className="px-4 py-4 text-muted-foreground">{(index + 1).toLocaleString("ar")}</td><td className="px-4 py-4 text-muted-foreground">{displayCode(item.code)}</td><td className="px-4 py-4 font-bold">{item.name}</td><td className="px-4 py-4">{item.unit}</td><td className="px-4 py-4 font-extrabold text-[#0069ad]">{formatPrintNumber(item.quantity)}</td>{hasPrice && <><td className="px-4 py-4">{item.unitPrice ? formatPrintNumber(item.unitPrice) : "—"}</td><td className="px-4 py-4 font-bold text-[#07518e]">{lineTotal ? formatPrintNumber(lineTotal) : "—"}</td></>}</tr>; })}</tbody></table></div></section>
//       <footer className="grid gap-px border-t border-[#c4e7f6] bg-[#c4e7f6] text-sm sm:grid-cols-3"><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">إعداد المذكرة</p><p className="mt-6 text-xs text-muted-foreground">الاسم والتوقيع</p></div><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">المراجعة والمطابقة</p><p className="mt-4 text-xs text-muted-foreground">{reconciliation.data ? reconciliationLabel[reconciliation.data.status] : "لم تتم المطابقة بعد"}</p></div><div className="min-h-24 bg-white p-4"><p className="font-bold text-[#07518e]">الاعتماد</p><p className="mt-6 text-xs text-muted-foreground">الاسم والتوقيع والختم</p></div></footer>{memo.notes && <div className="border-t border-[#c4e7f6] bg-[#edf9ff] p-4 text-sm"><span className="font-bold text-[#07518e]">ملاحظات: </span>{memo.notes}</div>}
//     </CardContent></Card>
//   </div>;
// }


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { displayMemoNumber } from "@/lib/memoNumber";
import { formatPrintNumber } from "@/lib/printNumber";
import { printMemo } from "@/lib/memoPrint";
import { classifyMemo, memoClassificationHasPrice } from "@shared/memoClassification";
import {
  ArrowRight,
  Ban,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";

const statusLabel = {
  draft: "مسودة",
  pending_review: "بانتظار المراجعة",
  approved: "منفذة",
  rejected: "مرفوضة",
  cancelled: "ملغاة",
} as const;

type MemoDetailsPageProps = { byNumber?: boolean };

export default function MemoDetailsPage({ byNumber = false }: MemoDetailsPageProps = {}) {
  const [, idParams] = useRoute("/memos/:id");
  const [, numberParams] = useRoute("/memos/by-number/:number");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const rawMemoNumber = numberParams?.number ?? "";
  const parsedId = Number(idParams?.id);
  const hasValidId = Number.isInteger(parsedId) && parsedId >= 0;
  const hasValidNumber = rawMemoNumber.trim().length > 0 && rawMemoNumber.length <= 64;
  const id = hasValidId ? parsedId : 1;

  const live = trpc.memos.details.useQuery(
    { id },
    { enabled: hasValidId && isAuthenticated && !isDevelopment }
  );
  const preview = trpc.memos.previewDetails.useQuery(
    { id },
    { enabled: hasValidId && isDevelopment }
  );
  const byNumberInput = { memoNumber: rawMemoNumber || "invalid" };
  const liveByNumber = trpc.memos.detailsByNumber.useQuery(byNumberInput, {
    enabled: byNumber && hasValidNumber && isAuthenticated && !isDevelopment,
  });
  const previewByNumber = trpc.memos.previewDetailsByNumber.useQuery(byNumberInput, {
    enabled: byNumber && hasValidNumber && isDevelopment,
  });
  const detailQuery = isDevelopment ? preview : live;
  const numberQuery = isDevelopment ? previewByNumber : liveByNumber;
  const query = byNumber ? numberQuery : detailQuery;
  const memo = query.data;
  const memoId = memo?.id ?? id;
  const memoType = memo?.type ?? "inbound";
  const classification = memo
    ? classifyMemo({ type: memo.type, notes: memo.notes })
    : "purchase";

  const sequenceLive = trpc.memos.list.useQuery(
    { type: memoType },
    { enabled: Boolean(memo) && isAuthenticated && !isDevelopment }
  );
  const sequencePreview = trpc.memos.previewList.useQuery(
    { type: memoType },
    { enabled: Boolean(memo) && isDevelopment }
  );
  const sequenceRows = (isDevelopment ? sequencePreview.data : sequenceLive.data) ?? [];
  const matchingRows = memo
    ? sequenceRows
      .filter(row => row.classification === classification)
      .slice()
      .reverse()
    : [];
  const currentIndex = matchingRows.findIndex(row => row.id === memo?.id);
  const previousMemo = currentIndex > 0 ? matchingRows[currentIndex - 1] : null;
  const nextMemo =
    currentIndex >= 0 && currentIndex < matchingRows.length - 1
      ? matchingRows[currentIndex + 1]
      : null;

  const inbound = memo?.type === "inbound";
  const listPath = !memo
    ? "/inbound"
    : memo.type === "inbound"
      ? classification === "return"
        ? "/entry"
        : "/inbound"
      : classification === "transfer"
        ? "/transfer"
        : "/outbound";
  const canCreate = isDevelopment || isAuthenticated;
  const canEdit = canCreate;
  const isAdmin = isAuthenticated && user?.role === "admin";
  const canCancel =
    isAdmin && memo?.status !== "approved" && memo?.status !== "cancelled";
  const canDelete = canCreate;

  const utils = trpc.useUtils();
  const cancelMutation = trpc.memos.cancel.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.memos.details.invalidate({ id: memoId }),
        utils.memos.list.invalidate({ type: memoType }),
      ]);
    },
  });
  const deleteMutation = trpc.memos.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.memos.list.invalidate({ type: memoType }),
        utils.inventory.listBalances.invalidate(),
      ]);
      setLocation(listPath);
    },
  });

  if (query.isLoading)
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        جار تحميل تفاصيل المذكرة…
      </div>
    );
  if (query.isError || !memo)
    return (
      <div className="legacy-panel mx-auto max-w-lg rounded-xl p-8 text-center">
        <h1 className="text-xl font-extrabold">تعذر فتح المذكرة</h1>
        <Button className="mt-5" onClick={() => setLocation("/inbound")}>
          العودة إلى السجل
        </Button>
      </div>
    );

  const hasPrice = memoClassificationHasPrice(classification);
  const total = memo.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );
  const memoNumber = displayMemoNumber(memo.sourceMemoNumber, memo.memoNumber);
  const fields = [
    ["رقم المذكرة", memoNumber],
    ["التاريخ", new Date(memo.memoDate).toLocaleDateString("ar")],
    ["الجهة", memo.partyName || "—"],
    ["المستودع", memo.warehouseName],
    ["رقم المجلد", memo.folderNumber || "—"],
    ["رقم الطلب", memo.orderNumber || "—"],
    ["تاريخ الطلب", memo.orderDate ? new Date(memo.orderDate).toLocaleDateString("ar") : "—"],
    ["رقم الفاتورة", memo.invoiceNumber || "—"],
    ["تاريخ الفاتورة", memo.invoiceDate ? new Date(memo.invoiceDate).toLocaleDateString("ar") : "—"],
    ...((classification === "purchase" || classification === "transfer")
      ? [["الرقم المالي", memo.referenceNumber || memoNumber]]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" size="sm" onClick={() => setLocation(listPath)}>
          <ArrowRight className="ml-2 h-4 w-4" /> العودة إلى السجل
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!previousMemo}
            aria-label="المذكرة السابقة"
            onClick={() => previousMemo && setLocation(`/memos/${previousMemo.id}`)}
          >
            <ChevronRight className="ml-1 h-4 w-4" /> السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextMemo}
            aria-label="المذكرة التالية"
            onClick={() => nextMemo && setLocation(`/memos/${nextMemo.id}`)}
          >
            التالي <ChevronLeft className="mr-1 h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setLocation(`${listPath}?newMemo=1`)}>
              <Plus className="ml-2 h-4 w-4" /> مذكرة جديدة
            </Button>
          )}
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              disabled={!canEdit}
              title={canEdit ? "تعديل قيم المذكرة وبنودها" : "التعديل متاح للمسودات والمذكرات قيد المراجعة فقط"}
              onClick={() => setLocation(`${listPath}?editMemo=${memo.id}`)}
            >
              <Pencil className="ml-2 h-4 w-4" /> تعديل المذكرة
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (window.confirm(`إلغاء المذكرة ${memoNumber}؟ سيبقى سجلها محفوظًا.`))
                  cancelMutation.mutate({ id: memo.id });
              }}
            >
              <Ban className="ml-2 h-4 w-4" /> إلغاء
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: memo.id })}
            >
              <Trash2 className="ml-2 h-4 w-4" /> حذف
            </Button>
          )}
          <Button size="sm" onClick={() => printMemo(memo)} className="bg-[#0071ba] hover:bg-[#00558d]">
            <FileText className="ml-2 h-4 w-4" /> معاينة قبل الطباعة
          </Button>
        </div>
      </div>

      <Card className="legacy-panel overflow-hidden rounded-xl print:border-0 print:shadow-none">
        <CardContent className="p-0">
          {/* تم تقليل الـ padding في الهيدر */}
          <header className="legacy-hero-sky flex flex-col gap-2 border-b-4 border-[#e44a32] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 bg-white/15">
                <ReceiptText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] text-white/80">نظام المستودعات — مركز الحاسب</p>
                <h1 className="mt-0.5 text-xl font-extrabold">
                  {inbound ? "مذكرة استلام وإدخال" : "مذكرة تسليم وإخراج"}
                </h1>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-[11px] text-white/75">رقم المذكرة</p>
              <p className="mt-0.5 text-lg font-extrabold tracking-wide">{memoNumber}</p>
            </div>
          </header>

          {/* تم تعديل المسافات بين الحقول هنا لتكون أكثر إحكاماً */}
          <div className="grid gap-0 lg:grid-cols-[0.7fr_1.8fr]">
            <aside className="border-b border-[#c4e7f6] bg-[#eaf8fe] p-4 lg:border-b-0 lg:border-l">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#07518e]">
                <ClipboardCheck className="h-4 w-4" /> حالة المذكرة
              </div>
              <Badge className="mt-2 border-0 bg-white text-[#0069ad] shadow-sm hover:bg-white">
                {statusLabel[memo.status]}
              </Badge>
              <div className="mt-4 space-y-3">
                {hasPrice && (
                  <div>
                    <p className="text-[11px] text-[#4b7792]">قيمة المذكرة النهائية</p>
                    <p className="mt-0.5 text-xl font-extrabold text-[#07518e]">
                      {total ? formatPrintNumber(total) : "—"}
                    </p>
                  </div>
                )}
                <div className="border-t border-[#c4e7f6] pt-3">
                  <p className="text-[11px] text-[#4b7792]">عدد بنود المواد</p>
                  <p className="mt-0.5 text-base font-extrabold text-[#07518e]">
                    {memo.items.length.toLocaleString("ar")} بند
                  </p>
                </div>
              </div>
            </aside>

            {/* هنا التغيير الأهم: min-h-20 إلى min-h-[50px] و p-4 إلى p-2 */}
            <section className="grid gap-px bg-[#c4e7f6] sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(([label, value]) => (
                <div key={label} className="min-h-[50px] bg-white/90 px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#4b7792]">{label}</p>
                  <p className="mt-1 text-xs font-extrabold text-[#153f61]">{value}</p>
                </div>
              ))}
            </section>
          </div>

          <section className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#084b89]">بنود المذكرة</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  تفاصيل المواد والكميات والسعر حسب المذكرة المحددة.
                </p>
              </div>
              <span className="rounded-md bg-[#fff0dc] px-2 py-1 text-[11px] font-bold text-[#ba6307]">
                {inbound ? "وارد إلى المستودع" : "صادر من المستودع"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${hasPrice ? "min-w-[700px]" : "min-w-[550px]"} text-right text-xs`}>
                <thead className="bg-[#dff4ff] text-[#17638d]">
                  <tr>
                    <th className="px-3 py-2 border-b border-[#bce2f3]">تسلسل</th>
                    <th className="px-3 py-2 border-b border-[#bce2f3]">رمز المادة</th>
                    <th className="px-3 py-2 border-b border-[#bce2f3]">اسم المادة</th>
                    <th className="px-3 py-2 border-b border-[#bce2f3]">الوحدة</th>
                    <th className="px-3 py-2 border-b border-[#bce2f3]">الكمية المستلمة</th>
                    {hasPrice && <><th className="px-3 py-2 border-b border-[#bce2f3]">السعر</th><th className="px-3 py-2 border-b border-[#bce2f3]">الإجمالي</th></>}
                  </tr>
                </thead>
                <tbody>
                  {memo.items.map((item, index) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
                    return (
                      <tr key={item.id} className="border-b border-[#d9eff9] hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-muted-foreground">{(index + 1).toLocaleString("ar")}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{displayCode(item.code)}</td>
                        <td className="px-3 py-1.5 font-bold">{item.name}</td>
                        <td className="px-3 py-1.5">{item.unit}</td>
                        <td className="px-3 py-1.5 font-extrabold text-[#0069ad]">{formatPrintNumber(item.quantity)}</td>
                        {hasPrice && (
                          <>
                            <td className="px-3 py-1.5">{item.unitPrice ? formatPrintNumber(item.unitPrice) : "—"}</td>
                            <td className="px-3 py-1.5 font-bold text-[#07518e]">{lineTotal ? formatPrintNumber(lineTotal) : "—"}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {memo.notes && (
            <div className="border-t border-[#c4e7f6] bg-[#edf9ff] p-3 text-xs">
              <span className="font-bold text-[#07518e]">ملاحظات: </span>{memo.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}