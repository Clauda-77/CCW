import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, FilePlus2, Landmark, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const formatDate = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium" }).format(new Date(value))
    : "—";

const formatAmount = (value: string | number | null, currency = "SYP") =>
  `${Number(value ?? 0).toLocaleString("ar-SY", { maximumFractionDigits: 2 })} ${currency}`;

export default function FinancePage() {
  const { isAuthenticated, user } = useAuth();
  const canUse = isAuthenticated && ["warehouse_keeper", "reviewer", "admin"].includes(user?.role ?? "");
  const entries = trpc.finance.entries.useQuery(undefined, { enabled: canUse });
  const warehouses = trpc.entities.listWarehouses.useQuery({ limit: 500 }, { enabled: canUse });
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [entryNumber, setEntryNumber] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [warehouseId, setWarehouseId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SYP");
  const [description, setDescription] = useState("");

  const createEntry = trpc.finance.createEntry.useMutation({
    onSuccess: async () => {
      await utils.finance.entries.invalidate();
      setEntryNumber("");
      setInvoiceNumber("");
      setReferenceNumber("");
      setAmount("");
      setDescription("");
      toast.success("تم حفظ القيد المالي.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ القيد المالي."),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (entries.data ?? []).filter(row =>
      !term || [row.entryNumber, row.invoiceNumber, row.referenceNumber, row.warehouseName, row.description]
        .some(value => String(value ?? "").toLocaleLowerCase().includes(term))
    );
  }, [entries.data, search]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!warehouseId) {
      toast.error("اختر المستودع المرتبط بالقيد المالي.");
      return;
    }
    createEntry.mutate({
      entryNumber: entryNumber.trim(),
      entryDate: new Date(`${entryDate}T12:00:00`),
      warehouseId: Number(warehouseId),
      invoiceNumber: invoiceNumber.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      amount: Number(amount),
      currency: currency.trim() || "SYP",
      description: description.trim() || undefined,
    });
  };

  if (!isAuthenticated) {
    return <div className="mx-auto max-w-2xl py-16 text-center" dir="rtl"><Landmark className="mx-auto h-12 w-12 text-[#17698a]" /><h1 className="mt-4 text-2xl font-extrabold">دفتر المالية</h1><p className="mt-3 text-sm text-muted-foreground">سجّل الدخول للوصول إلى القيود المالية.</p></div>;
  }

  if (!canUse) {
    return <div className="mx-auto max-w-2xl py-16 text-center" dir="rtl"><Landmark className="mx-auto h-12 w-12 text-[#17698a]" /><h1 className="mt-4 text-2xl font-extrabold">دفتر المالية</h1><p className="mt-3 text-sm text-muted-foreground">ليس لديك صلاحية الوصول إلى دفتر المالية.</p></div>;
  }

  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section>
      <p className="text-sm font-semibold text-[#17698a]">المالية والمطابقة</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">دفتر المالية والفواتير</h1>
      <p className="mt-2 text-sm text-muted-foreground">أدخل القيود المالية واربطها برقم الفاتورة أو الرقم المالي لمطابقتها مع المذكرات.</p>
    </section>

    <Card className="soft-shadow border-white/75 bg-white/85">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#07518e]"><FilePlus2 className="h-5 w-5" />إضافة قيد مالي أو فاتورة</div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2"><Label htmlFor="finance-entry-number">رقم القيد المالي *</Label><Input id="finance-entry-number" required value={entryNumber} onChange={event => setEntryNumber(event.target.value)} placeholder="مثال: 2026/145" /></div>
          <div className="grid gap-2"><Label htmlFor="finance-entry-date">تاريخ القيد *</Label><Input id="finance-entry-date" required type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="finance-warehouse">المستودع *</Label><Select value={warehouseId} onValueChange={setWarehouseId}><SelectTrigger id="finance-warehouse"><SelectValue placeholder={warehouses.isLoading ? "جار التحميل…" : "اختر المستودع"} /></SelectTrigger><SelectContent dir="rtl">{(warehouses.data ?? []).filter(row => row.isActive).map(row => <SelectItem key={row.id} value={String(row.id)}>{row.name} — {row.code}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label htmlFor="finance-amount">القيمة *</Label><Input id="finance-amount" required min="0" step="0.01" type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div>
          <div className="grid gap-2"><Label htmlFor="finance-invoice">رقم الفاتورة</Label><Input id="finance-invoice" value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="finance-reference">الرقم المالي</Label><Input id="finance-reference" value={referenceNumber} onChange={event => setReferenceNumber(event.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="finance-currency">العملة</Label><Input id="finance-currency" value={currency} onChange={event => setCurrency(event.target.value)} /></div>
          <div className="grid gap-2 lg:col-span-2"><Label htmlFor="finance-description">الوصف أو الملاحظات</Label><Input id="finance-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="وصف القيد أو مصدر الفاتورة" /></div>
          <div className="flex items-end lg:col-span-2"><Button type="submit" disabled={createEntry.isPending || warehouses.isLoading} className="h-10 w-full rounded-xl bg-[#17698a] hover:bg-[#125875]">{createEntry.isPending ? "جار الحفظ…" : "حفظ القيد المالي"}</Button></div>
        </form>
      </CardContent>
    </Card>

    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-extrabold text-[#07518e]">القيود المسجلة</h2><p className="mt-1 text-xs text-muted-foreground">تظهر القيود الخاصة بالمستودعات المسندة إلى حسابك.</p></div><div className="relative w-full lg:max-w-md"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl pr-9" placeholder="ابحث برقم القيد أو الفاتورة أو المستودع" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">رقم القيد</th><th className="px-4 py-3">الفاتورة</th><th className="px-4 py-3">الرقم المالي</th><th className="px-4 py-3">المستودع</th><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">المصدر</th></tr></thead><tbody>{entries.isLoading && <tr><td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">جار تحميل دفتر المالية…</td></tr>}{entries.isError && <tr><td colSpan={7} className="p-10 text-center text-sm text-destructive">تعذر تحميل القيود المالية.</td></tr>}{!entries.isLoading && !entries.isError && rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">لا توجد قيود مطابقة.</td></tr>}{rows.map(row => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 text-slate-600">{formatDate(row.entryDate)}</td><td className="px-4 py-4 font-bold text-[#07518e]">{row.entryNumber}</td><td className="px-4 py-4">{row.invoiceNumber || "—"}</td><td className="px-4 py-4">{row.referenceNumber || "—"}</td><td className="px-4 py-4 font-semibold text-[#17698a]">{row.warehouseName}</td><td className="px-4 py-4 font-bold">{formatAmount(row.amount, row.currency)}</td><td className="px-4 py-4"><Badge className="border-0 bg-[#eef8ff] text-[#17698a] hover:bg-[#eef8ff]">{row.source === "excel" ? "استيراد Excel" : row.source === "legacy" ? "قديم" : "يدوي"}</Badge></td></tr>)}</tbody></table></div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#bee4f5] bg-[#eefaff] p-3 text-xs text-[#17698a]"><ClipboardCheck className="h-4 w-4 shrink-0" />لإجراء المطابقة، افتح تفاصيل المذكرة واضغط «مطابقة مع المالية». تتم المطابقة برقم الفاتورة أو الرقم المالي أو رقم المذكرة.</div>
    </CardContent></Card>
  </div>;
}
