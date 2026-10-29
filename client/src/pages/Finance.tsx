import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { displayMemoNumber } from "@/lib/memoNumber";
import { BarChart3, ClipboardCheck, Landmark, RefreshCw, Search } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const formatDate = (value: Date | string | null) =>
  value ? new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium" }).format(new Date(value)) : "—";
const formatAmount = (value: string | number | null, currency = "SYP") =>
  `${Number(value ?? 0).toLocaleString("ar-SY", { maximumFractionDigits: 2 })} ${currency}`;
function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type ImportResult = { isValid: boolean; totalRows: number; missingColumns: string[]; warnings: string[] };

export default function FinancePage() {
  const { isAuthenticated, user } = useAuth();
  const canUse = isAuthenticated && ["warehouse_keeper", "reviewer", "admin"].includes(user?.role ?? "");
  const canImport = user?.role === "admin";
  const entries = trpc.finance.entries.useQuery(undefined, { enabled: canUse });
  const reconciliation = trpc.finance.reconciliationSummary.useQuery(undefined, { enabled: canUse });
  const reconcileAll = trpc.finance.reconcileAll.useMutation({
    onSuccess: async result => {
      await reconciliation.refetch();
      toast.success(`تمت مطابقة ${result.total} مذكرة: ${result.matched} مطابقة، ${result.mismatch} غير مطابقة، ${result.notFound} بلا قيد.`);
    },
    onError: error => toast.error(error.message || "تعذر تشغيل المطابقة الجماعية."),
  });
  const [search, setSearch] = useState("");
  const [financeFile, setFinanceFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const validateImport = trpc.finance.validateImport.useMutation({
    onSuccess: result => setImportResult(result),
    onError: error => toast.error(error.message || "تعذر فحص ملف المالية."),
  });
  const commitImport = trpc.finance.commitImport.useMutation({
    onSuccess: async result => {
      await entries.refetch();
      setFinanceFile(null);
      setImportResult(null);
      toast.success(result.summary);
    },
    onError: error => toast.error(error.message || "تعذر اعتماد ملف المالية."),
  });
  const inspectFinanceFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFinanceFile(file);
    setImportResult(null);
    if (!file) return;
    try { validateImport.mutate({ base64: await toBase64(file) }); }
    catch { toast.error("تعذر قراءة ملف المالية."); }
  };
  const commitFinanceFile = async () => {
    if (!financeFile || !importResult?.isValid) return;
    commitImport.mutate({ base64: await toBase64(financeFile), filename: financeFile.name });
  };
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (entries.data ?? []).filter(row => !term || [row.entryNumber, row.invoiceNumber, row.referenceNumber, row.warehouseName, row.description, row.disbursementNumber, row.receiptMemoNumber].some(value => String(value ?? "").toLocaleLowerCase().includes(term)));
  }, [entries.data, search]);
  const reconciliationRows = reconciliation.data ?? [];
  const matchedRows = reconciliationRows.filter(row => row.status === "matched");
  const mismatchRows = reconciliationRows.filter(row => row.status === "mismatch");
  const notFoundRows = reconciliationRows.filter(row => row.status === "not_found");
  const varianceByWarehouse = Object.values(reconciliationRows.reduce<Record<string, { name: string; total: number }>>((groups, row) => {
    const key = String(row.warehouseId);
    const current = groups[key] ?? { name: row.warehouseName, total: 0 };
    current.total += Math.abs(Number(row.differenceAmount ?? 0));
    groups[key] = current;
    return groups;
  }, {})).sort((a, b) => b.total - a.total);
  const maxVariance = Math.max(...varianceByWarehouse.map(row => row.total), 1);

  if (!isAuthenticated) return <div className="mx-auto max-w-2xl py-16 text-center" dir="rtl"><Landmark className="mx-auto h-12 w-12 text-[#17698a]" /><h1 className="mt-4 text-2xl font-extrabold">دفتر المالية</h1><p className="mt-3 text-sm text-muted-foreground">سجّل الدخول للوصول إلى سجلات المالية.</p></div>;
  if (!canUse) return <div className="mx-auto max-w-2xl py-16 text-center" dir="rtl"><Landmark className="mx-auto h-12 w-12 text-[#17698a]" /><h1 className="mt-4 text-2xl font-extrabold">دفتر المالية</h1><p className="mt-3 text-sm text-muted-foreground">ليس لديك صلاحية الوصول إلى دفتر المالية.</p></div>;

  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section><p className="text-sm font-semibold text-[#17698a]">المالية والمطابقة</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">سجلات المالية والفواتير</h1><p className="mt-2 text-sm text-muted-foreground">هذه السجلات مصدرها المالية الرسمية، وتستخدم للمقارنة مع فواتير ومذكرات المستودعات. لا يمكن إنشاء أو تعديل قيد مالي من هذا التطبيق.</p></section>
    <Card className="border-[#bee4f5] bg-[#eefaff] shadow-sm"><CardContent className="flex items-start gap-3 p-5 text-sm text-[#17698a]"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">مصدر البيانات: المالية الرسمية</p><p className="mt-1 leading-6">يتم تحميل سجلات المالية عبر استيراد رسمي يحدده المدير، ثم تتم مطابقة رقم الفاتورة والقيمة والتاريخ والمستودع ورقم مذكرة الاستلام مع المذكرات الموجودة في النظام.</p></div></CardContent></Card>
    {canImport && <Card className="soft-shadow border-dashed border-[#b7d4e0] bg-white/85"><CardContent className="p-5"><h2 className="text-lg font-extrabold text-[#07518e]">استيراد ملف المالية الرسمي</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">يقبل Excel أو CSV. يجب أن يحتوي الملف على رقم القيد والتاريخ والقيمة والمستودع، ويفضل رقم الفاتورة ورقم أمر الصرف ورقم مذكرة الاستلام.</p><div className="mt-4 flex flex-wrap items-center gap-3"><input id="finance-file" type="file" accept=".xls,.xlsx,.csv" onChange={inspectFinanceFile} className="block max-w-full text-sm" />{financeFile && <span className="text-xs font-semibold text-[#17698a]">{financeFile.name}</span>}{importResult?.isValid && <Button type="button" disabled={commitImport.isPending} onClick={commitFinanceFile} className="bg-[#17698a]">{commitImport.isPending ? "جار الاعتماد…" : "اعتماد سجلات المالية"}</Button>}</div>{importResult && <div className={`mt-4 rounded-xl p-3 text-sm ${importResult.isValid ? "bg-[#e8f2e8] text-[#39744b]" : "bg-[#fdebed] text-[#ab5062]"}`}><p className="font-bold">{importResult.isValid ? `الملف صالح — ${importResult.totalRows.toLocaleString("ar")} صف` : `الملف يحتاج تصحيحاً — الأعمدة الناقصة: ${importResult.missingColumns.join("، ") || "الملف فارغ"}`}</p>{importResult.warnings.map(warning => <p key={warning} className="mt-1">تنبيه: {warning}</p>)}</div>}</CardContent></Card>}
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#bfe3f4] bg-white/85 p-4"><div><p className="font-extrabold text-[#07518e]">المطابقة التلقائية</p><p className="mt-1 text-xs text-muted-foreground">افحص جميع المذكرات غير الملغاة ضمن مستودعاتك دفعة واحدة.</p></div><Button type="button" disabled={reconcileAll.isPending || user?.role === "warehouse_keeper"} onClick={() => reconcileAll.mutate()} className="bg-[#17698a]"><RefreshCw className={`ml-2 h-4 w-4 ${reconcileAll.isPending ? "animate-spin" : ""}`} />{reconcileAll.isPending ? "جار فحص جميع المذكرات…" : "مطابقة جميع المذكرات"}</Button></section>
    <section className="grid gap-3 md:grid-cols-3">
      <Card className="border-[#b8dfc1] bg-[#f1fbf2]"><CardContent className="p-5"><p className="text-sm font-bold text-[#39744b]">فواتير مطابقة</p><p className="mt-2 text-3xl font-extrabold text-[#39744b]">{matchedRows.length}</p><p className="mt-1 text-xs text-[#39744b]">رقم الفاتورة والمذكرة والقيمة متطابقة</p></CardContent></Card>
      <Card className="border-[#f1d39d] bg-[#fff9ed]"><CardContent className="p-5"><p className="text-sm font-bold text-[#a4650b]">فواتير غير مطابقة</p><p className="mt-2 text-3xl font-extrabold text-[#a4650b]">{mismatchRows.length}</p><p className="mt-1 text-xs text-[#a4650b]">اختلاف بالقيمة أو رقم مذكرة الاستلام</p></CardContent></Card>
      <Card className="border-[#efc0c9] bg-[#fff4f5]"><CardContent className="p-5"><p className="text-sm font-bold text-[#ab5062]">القيد غير موجود</p><p className="mt-2 text-3xl font-extrabold text-[#ab5062]">{notFoundRows.length}</p><p className="mt-1 text-xs text-[#ab5062]">لا يوجد سجل مالي مطابق بعد</p></CardContent></Card>
    </section>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#07518e]" /><h2 className="text-xl font-extrabold text-[#07518e]">إجمالي الفروقات حسب المستودع</h2></div>{varianceByWarehouse.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-muted-foreground">شغّل المطابقة التلقائية أو طابق مذكرة واحدة حتى يظهر المخطط.</p> : <div className="space-y-4">{varianceByWarehouse.map(row => <div key={row.name}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-bold">{row.name}</span><span className="font-extrabold text-[#ab5062]">{formatAmount(row.total)}</span></div><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#d9442f]" style={{ width: `${Math.max((row.total / maxVariance) * 100, row.total > 0 ? 3 : 0)}%` }} /></div></div>)}</div>}</CardContent></Card>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><h2 className="mb-4 text-xl font-extrabold text-[#07518e]">تفاصيل المطابقة</h2><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-right text-sm"><thead className="bg-slate-50 text-xs text-muted-foreground"><tr><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">رقم الفاتورة</th><th className="px-3 py-3">مذكرة المستودع</th><th className="px-3 py-3">مذكرة المالية</th><th className="px-3 py-3">أمر الصرف</th><th className="px-3 py-3">المستودع</th><th className="px-3 py-3">الفرق</th></tr></thead><tbody>{reconciliationRows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لم يتم تشغيل المطابقة على أي مذكرة بعد.</td></tr>}{reconciliationRows.map(row => <tr key={row.reconciliationId} className="border-t border-slate-100"><td className="px-3 py-3"><Badge className={row.status === "matched" ? "border-0 bg-[#e8f2e8] text-[#39744b]" : row.status === "mismatch" ? "border-0 bg-[#fff1dc] text-[#a4650b]" : "border-0 bg-[#fdebed] text-[#ab5062]"}>{row.status === "matched" ? "مطابقة" : row.status === "mismatch" ? "غير مطابقة" : "القيد غير موجود"}</Badge></td><td className="px-3 py-3 font-bold">{row.invoiceNumber || "—"}</td><td className="px-3 py-3">{displayMemoNumber(row.sourceMemoNumber, row.memoNumber)}</td><td className="px-3 py-3">{row.receiptMemoNumber || "—"}</td><td className="px-3 py-3">{row.disbursementNumber || "—"}</td><td className="px-3 py-3">{row.warehouseName}</td><td className="px-3 py-3 font-bold">{formatAmount(row.differenceAmount)}</td></tr>)}</tbody></table></div></CardContent></Card>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-extrabold text-[#07518e]">السجلات المستوردة</h2><p className="mt-1 text-xs text-muted-foreground">تظهر فقط السجلات الخاصة بالمستودعات المسموحة لحسابك.</p></div><div className="relative w-full lg:max-w-md"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl pr-9" placeholder="ابحث برقم القيد أو الفاتورة أو أمر الصرف أو مذكرة الاستلام" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">رقم القيد</th><th className="px-4 py-3">الفاتورة</th><th className="px-4 py-3">أمر الصرف</th><th className="px-4 py-3">مذكرة الاستلام</th><th className="px-4 py-3">الرقم المالي</th><th className="px-4 py-3">المستودع</th><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">المصدر</th></tr></thead><tbody>{entries.isLoading && <tr><td colSpan={9} className="p-10 text-center text-sm text-muted-foreground">جار تحميل سجلات المالية…</td></tr>}{entries.isError && <tr><td colSpan={9} className="p-10 text-center text-sm text-destructive">تعذر تحميل سجلات المالية. تأكد من تطبيق ترحيل جدول المالية.</td></tr>}{!entries.isLoading && !entries.isError && rows.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-sm text-muted-foreground">لا توجد سجلات مالية مستوردة مطابقة.</td></tr>}{rows.map(row => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 text-slate-600">{formatDate(row.entryDate)}</td><td className="px-4 py-4 font-bold text-[#07518e]">{row.entryNumber}</td><td className="px-4 py-4">{row.invoiceNumber || "—"}</td><td className="px-4 py-4">{row.disbursementNumber || "—"}</td><td className="px-4 py-4 font-semibold text-[#17698a]">{row.receiptMemoNumber || "—"}</td><td className="px-4 py-4">{row.referenceNumber || "—"}</td><td className="px-4 py-4 font-semibold text-[#17698a]">{row.warehouseName}</td><td className="px-4 py-4 font-bold">{formatAmount(row.amount, row.currency)}</td><td className="px-4 py-4"><Badge className="border-0 bg-[#eef8ff] text-[#17698a] hover:bg-[#eef8ff]">{row.source === "excel" ? "استيراد المالية" : row.source === "legacy" ? "سجل قديم" : "سجل مالي"}</Badge></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center gap-2 rounded-xl border border-[#bee4f5] bg-[#eefaff] p-3 text-xs text-[#17698a]"><ClipboardCheck className="h-4 w-4 shrink-0" />للمطابقة، افتح تفاصيل المذكرة واضغط «مطابقة مع المالية». إذا اختلف رقم مذكرة الاستلام أو القيمة فلن تعتبر النتيجة مطابقة.</div></CardContent></Card>
  </div>;
}
