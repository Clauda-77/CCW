import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BarChart3, Building2, CalendarDays, ExternalLink, FileText, Package, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const number = (value: unknown) => Number(value ?? 0).toLocaleString("ar-SY", { maximumFractionDigits: 3 });
const monthLabel = (value: string) => {
  const [year, month] = value.split("-");
  return year && month ? `${month}/${year}` : value;
};

type LinkButtonProps = { label: string; path: string };
function LinkButton({ label, path }: LinkButtonProps) {
  const [, setLocation] = useLocation();
  return <button type="button" onClick={() => setLocation(path)} className="inline-flex items-center gap-1 rounded-lg border border-[#b9e1f1] bg-white px-2.5 py-1 text-xs font-bold text-[#17698a] hover:bg-[#eefaff]"><ExternalLink className="h-3.5 w-3.5" />{label}</button>;
}


type SearchableOption = { value: string; label: string; searchText?: string };
function SearchableSelect({ value, onChange, options, placeholder, searchPlaceholder }: { value: string; onChange: (value: string) => void; options: SearchableOption[]; placeholder: string; searchPlaceholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(option => option.value === value);
  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const filtered = options.filter(option => (option.searchText ?? option.label).toLocaleLowerCase("ar").includes(normalizedSearch));
  return <div className="relative">
    <button type="button" onClick={() => { setOpen(current => !current); setSearch(""); }} className="flex h-10 w-full items-center justify-between rounded-xl border border-[#b9ddec] bg-white px-3 text-right text-sm font-normal text-[#173f53]">
      <span className="truncate">{selected?.label ?? placeholder}</span><span className="mr-2 text-xs text-[#17698a]">▼</span>
    </button>
    {open && <div className="absolute right-0 top-11 z-50 w-full min-w-[260px] rounded-xl border border-[#b9ddec] bg-white p-2 shadow-xl">
      <Input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder={searchPlaceholder} className="mb-2 h-9 rounded-lg" />
      <div className="max-h-56 overflow-y-auto">
        <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-right text-sm text-[#17698a] hover:bg-[#eefaff]">{placeholder}</button>
        {filtered.map(option => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-right text-sm hover:bg-[#eefaff] ${option.value === value ? "bg-[#e8f7fd] font-bold text-[#07518e]" : "text-[#173f53]"}`}>{option.label}</button>)}
        {filtered.length === 0 && <p className="px-3 py-3 text-center text-xs text-muted-foreground">لا توجد نتائج مطابقة</p>}
      </div>
    </div>}
  </div>;
}

function StatCard({ icon: Icon, title, description, children }: { icon: typeof Package; title: string; description: string; children: React.ReactNode }) {
  return <Card className="soft-shadow border-white/75 bg-white/90"><CardHeader className="pb-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7fd] text-[#0876ba]"><Icon className="h-5 w-5" /></span><div><CardTitle className="text-base font-extrabold text-[#124c69]">{title}</CardTitle><p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p></div></div></CardHeader><CardContent>{children}</CardContent></Card>;
}

function Empty({ text = "لا توجد بيانات كافية حتى الآن." }) { return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>; }

export default function StatisticsPage() {
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const canView = isDevelopment || user?.role === "admin" || user?.role === "warehouse_keeper" || user?.role === "reviewer";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);
  const dateFilters = invalidRange ? undefined : {
    fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined,
    toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined,
  };
  const queryEnabled = isAuthenticated && canView && !invalidRange;
  const live = trpc.statistics.dashboard.useQuery(dateFilters, { enabled: queryEnabled && !isDevelopment });
  const preview = trpc.statistics.previewDashboard.useQuery(dateFilters, { enabled: queryEnabled && isDevelopment });
  const query = isDevelopment ? preview : live;
  const [deliveryPartyId, setDeliveryPartyId] = useState("");
  const [deliveryMaterialId, setDeliveryMaterialId] = useState("");
  const [deliveryFromDate, setDeliveryFromDate] = useState("");
  const [deliveryToDate, setDeliveryToDate] = useState("");
  const invalidDeliveryRange = Boolean(deliveryFromDate && deliveryToDate && deliveryFromDate > deliveryToDate);
  const deliveryFilters = invalidDeliveryRange ? undefined : {
    partyId: deliveryPartyId ? Number(deliveryPartyId) : undefined,
    materialId: deliveryMaterialId ? Number(deliveryMaterialId) : undefined,
    fromDate: deliveryFromDate ? new Date(`${deliveryFromDate}T00:00:00`) : undefined,
    toDate: deliveryToDate ? new Date(`${deliveryToDate}T23:59:59.999`) : undefined,
  };
  const partiesLive = trpc.entities.listParties.useQuery({ limit: 5000 }, { enabled: queryEnabled && !isDevelopment });
  const partiesPreview = trpc.entities.previewListParties.useQuery({ limit: 5000 }, { enabled: queryEnabled && isDevelopment });
  const materialsLive = trpc.materials.list.useQuery({ limit: 5000 }, { enabled: queryEnabled && !isDevelopment });
  const materialsPreview = trpc.materials.previewList.useQuery({ limit: 5000 }, { enabled: queryEnabled && isDevelopment });
  const partyOptions = (isDevelopment ? partiesPreview.data : partiesLive.data) ?? [];
  const materialOptions = (isDevelopment ? materialsPreview.data : materialsLive.data) ?? [];
  const deliveredLive = trpc.statistics.deliveredQuantity.useQuery(deliveryFilters, { enabled: queryEnabled && !invalidDeliveryRange && !isDevelopment });
  const deliveredPreview = trpc.statistics.previewDeliveredQuantity.useQuery(deliveryFilters, { enabled: queryEnabled && !invalidDeliveryRange && isDevelopment });
  const deliveredQuery = isDevelopment ? deliveredPreview : deliveredLive;

  if (!isDevelopment && (!isAuthenticated || !canView)) return <div className="mx-auto max-w-3xl py-14 text-center" dir="rtl"><BarChart3 className="mx-auto h-10 w-10 text-[#3284ae]" /><h1 className="mt-4 text-2xl font-extrabold">الإحصائيات للمستخدمين المصرح لهم فقط</h1><p className="mt-3 text-sm text-muted-foreground">لا تملك الصلاحية المطلوبة لعرض إحصائيات المستودع.</p></div>;
  const data = query.data;
  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section><p className="text-sm font-semibold text-[#17698a]">أدوات المستودع</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">الإحصائيات</h1><p className="mt-2 text-sm leading-7 text-muted-foreground">ملخص تشغيلي مبني على المذكرات المعتمدة وحركات المخزون والأرصدة الحالية.</p></section>
    <Card className="soft-shadow border-white/75 bg-white/90"><CardContent className="p-5"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>من تاريخ</span><Input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="h-10 rounded-xl" /></label><label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>إلى تاريخ</span><Input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="h-10 rounded-xl" /></label></div>{invalidRange ? <p className="mt-3 text-sm font-bold text-red-700">تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساويًا له.</p> : <p className="mt-3 text-xs text-muted-foreground">اترك التاريخين فارغين لعرض النتائج منذ بداية النظام. عند تحديدهما ستظهر النتائج ضمن الفترة فقط.</p>}</CardContent></Card>
    {query.isLoading && <Card className="bg-white/85"><CardContent className="p-10 text-center text-sm text-muted-foreground">جار تحميل الإحصائيات…</CardContent></Card>}
    {query.isError && <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center text-sm text-red-700">تعذر تحميل الإحصائيات. تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.</CardContent></Card>}
    {data && <div className="grid gap-5 xl:grid-cols-2">
      <StatCard icon={TrendingUp} title="المواد الأكثر طلباً — Top 5 Items" description="ترتيب المواد حسب مجموع الكميات المسلّمة في المذكرات المعتمدة.">
        {data.topRequested.length === 0 ? <Empty /> : <div className="space-y-3">{data.topRequested.map((row, index) => <div key={row.materialId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17698a] text-xs font-extrabold text-white">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.code} · {row.unit}</p></div></div><div className="text-left"><strong className="block text-[#07518e]">{number(row.quantity)}</strong><span className="text-[11px] text-muted-foreground">وحدة مسلّمة</span></div><LinkButton label="بطاقة المادة" path={`/materials?materialId=${row.materialId}`} /></div>)}</div>}
      </StatCard>
      <div className="min-h-0">
      <StatCard icon={Building2} title="كل كلية / جهة: ماذا طلبت" description="إجمالي الكميات حسب الجهة من مذكرات التسليم المعتمدة ضمن الفترة المحددة. مذكرات التسليم لا تحتوي سعرًا إفراديًا، لذلك لا يتم عرض تكلفة مالية.">
        <div className="max-h-[430px] overflow-y-auto pl-1">
        {data.topConsumers.length === 0 ? <Empty /> : <div className="space-y-3">{data.topConsumers.map((row, index) => <div key={`${row.partyId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex min-w-0 items-center gap-3"><span className="text-sm font-extrabold text-[#17698a]">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold">{row.name || "جهة غير محددة"}</p><p className="text-xs text-muted-foreground">{row.memoCount.toLocaleString("ar-SY")} مذكرة تسليم</p></div></div><div className="text-left"><strong className="block text-[#07518e]">{number(row.quantity)}</strong><span className="text-[11px] text-muted-foreground">وحدة مطلوبة</span></div><LinkButton label="مذكرات التسليم" path="/outbound" /></div>)}</div>}
        </div>
      </StatCard>
    </div>
      <StatCard icon={CalendarDays} title="الأشهر الأكثر حركة — ذروة العمل" description="تجميع الإدخالات والتسليمات حسب شهر تاريخ الحركة الفعلي.">
        {data.peakMonths.length === 0 ? <Empty /> : <div className="space-y-3">{data.peakMonths.map((row, index) => <div key={row.month} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><span className="w-16 font-bold text-[#17698a]">{monthLabel(row.month)}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#2b9ac3]" style={{ width: `${Math.max(6, Math.round((row.total / Math.max(data.peakMonths[0]?.total || 1, 1)) * 100))}%` }} /></div><span className="w-20 text-left text-sm font-extrabold">{number(row.total)}</span><span className="text-xs text-muted-foreground">({number(row.inbound)} إدخال / {number(row.outbound)} تسليم)</span></div>)}</div>}
      </StatCard>
      <StatCard icon={FileText} title="المواد الأكثر تركيباً / تلفاً" description="ربط محاضر التركيب والتنسيق والمذكرات التي تتضمن وصف التلف مع بطاقة المادة.">
        {data.coordinationDamage.length === 0 ? <Empty text="لا توجد حركات تركيب أو تلف مسجلة." /> : <div className="space-y-3">{data.coordinationDamage.map(row => <div key={row.materialId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="min-w-0"><p className="truncate font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.code} · {row.memoCount.toLocaleString("ar-SY")} محضر/مذكرة</p></div><strong className="text-[#07518e]">{number(row.quantity)}</strong><LinkButton label="بطاقة المادة" path={`/materials?materialId=${row.materialId}`} /></div>)}</div>}
      </StatCard>
      <StatCard icon={AlertTriangle} title="المواد الراكدة أو الحرجة — نواقص" description="مقارنة الرصيد الحالي مع الحد الأدنى، مع تمييز المواد التي لم تسجل حركة.">
        {data.criticalMaterials.length === 0 ? <Empty text="لا توجد مواد حرجة أو راكدة حالياً." /> : <div className="space-y-3">{data.criticalMaterials.map(row => <div key={row.materialId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex min-w-0 items-center gap-2"><Package className="h-4 w-4 shrink-0 text-[#17698a]" /><div className="min-w-0"><p className="truncate font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.code} · الحد الأدنى {number(row.minimumStock)}</p></div></div><div className="text-left"><strong className={row.isCritical ? "block text-red-700" : "block text-amber-700"}>{number(row.balance)}</strong><span className="text-[11px] text-muted-foreground">{row.isCritical ? "رصيد حرج" : "راكدة"}</span></div><LinkButton label="الجرد" path="/reports" /></div>)}</div>}
      </StatCard>
    </div>}
    <Card className="soft-shadow border-white/75 bg-white/90">
      <CardHeader><CardTitle className="text-xl font-extrabold text-[#124c69]">كمية المواد المسلّمة حسب الجهة والمادة</CardTitle><p className="text-sm leading-7 text-muted-foreground">حدد الجهة المستلمة والمادة والتاريخين لمعرفة الكمية التي تم تسليمها ضمن الفترة المحددة.</p></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>الجهة المستلمة</span><SearchableSelect value={deliveryPartyId} onChange={setDeliveryPartyId} placeholder="كل الجهات" searchPlaceholder="ابحث باسم الجهة…" options={partyOptions.map(party => ({ value: String(party.id), label: party.name }))} /></label>
          <label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>المادة</span><SearchableSelect value={deliveryMaterialId} onChange={setDeliveryMaterialId} placeholder="كل المواد" searchPlaceholder="ابحث باسم المادة أو رمزها…" options={materialOptions.map(material => ({ value: String(material.id), label: `${material.name} — ${material.code}`, searchText: `${material.name} ${material.code}` }))} /></label>
          <label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>من تاريخ</span><Input type="date" value={deliveryFromDate} onChange={event => setDeliveryFromDate(event.target.value)} className="h-10 rounded-xl" /></label>
          <label className="space-y-2 text-sm font-extrabold text-[#124c69]"><span>إلى تاريخ</span><Input type="date" value={deliveryToDate} onChange={event => setDeliveryToDate(event.target.value)} className="h-10 rounded-xl" /></label>
        </div>
        {invalidDeliveryRange && <p className="text-sm font-bold text-red-700">تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساويًا له.</p>}
        {!invalidDeliveryRange && deliveredQuery.isLoading && <p className="py-5 text-center text-sm text-muted-foreground">جار حساب الكمية المسلّمة…</p>}
        {!invalidDeliveryRange && deliveredQuery.isError && <p className="py-5 text-center text-sm font-bold text-red-700">تعذر حساب كمية التسليم.</p>}
        {!invalidDeliveryRange && deliveredQuery.data && <div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-[#c7e8f3] bg-[#f2fbfe] p-5 text-center"><strong className="block text-3xl font-extrabold text-[#07518e]">{number(deliveredQuery.data.quantity)}</strong><span className="text-sm font-bold text-[#17698a]">إجمالي الكمية المسلّمة</span></div><div className="rounded-xl border border-[#c7e8f3] bg-[#f2fbfe] p-5 text-center"><strong className="block text-3xl font-extrabold text-[#07518e]">{number(deliveredQuery.data.memoCount)}</strong><span className="text-sm font-bold text-[#17698a]">مذكرة تسليم معتمدة</span></div><div className="rounded-xl border border-[#f2dfb2] bg-[#fffaf0] p-5 text-center"><strong className="block text-lg font-extrabold text-[#8a5a00]">لا يوجد سعر إفرادي</strong><span className="text-sm text-[#765d2e]">مذكرات التسليم لا تحتوي سعرًا إفراديًا، لذلك لا يتم احتساب تكلفة مالية هنا.</span></div></div>}
        <p className="text-xs leading-6 text-muted-foreground">الحساب يعتمد فقط على مذكرات التسليم المعتمدة، وتاريخ المذكرة يقع بين التاريخين المحددين. اترك الجهة والمادة والتاريخين فارغة لعرض إجمالي التسليم منذ بداية النظام.</p>
      </CardContent>
    </Card>
  </div>;
}
