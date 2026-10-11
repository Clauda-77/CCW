import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BarChart3, Building2, CalendarDays, ExternalLink, FileText, Package, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

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

function StatCard({ icon: Icon, title, description, children }: { icon: typeof Package; title: string; description: string; children: React.ReactNode }) {
  return <Card className="soft-shadow border-white/75 bg-white/90"><CardHeader className="pb-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7fd] text-[#0876ba]"><Icon className="h-5 w-5" /></span><div><CardTitle className="text-base font-extrabold text-[#124c69]">{title}</CardTitle><p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p></div></div></CardHeader><CardContent>{children}</CardContent></Card>;
}

function Empty({ text = "لا توجد بيانات كافية حتى الآن." }) { return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>; }

export default function StatisticsPage() {
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const canView = isDevelopment || user?.role === "admin" || user?.role === "warehouse_keeper" || user?.role === "reviewer";
  const live = trpc.statistics.dashboard.useQuery(undefined, { enabled: isAuthenticated && canView && !isDevelopment });
  const preview = trpc.statistics.previewDashboard.useQuery(undefined, { enabled: isDevelopment && canView });
  const query = isDevelopment ? preview : live;

  if (!isDevelopment && (!isAuthenticated || !canView)) return <div className="mx-auto max-w-3xl py-14 text-center" dir="rtl"><BarChart3 className="mx-auto h-10 w-10 text-[#3284ae]" /><h1 className="mt-4 text-2xl font-extrabold">الإحصائيات للمستخدمين المصرح لهم فقط</h1><p className="mt-3 text-sm text-muted-foreground">لا تملك الصلاحية المطلوبة لعرض إحصائيات المستودع.</p></div>;
  const data = query.data;
  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section><p className="text-sm font-semibold text-[#17698a]">أدوات المستودع</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">الإحصائيات</h1><p className="mt-2 text-sm leading-7 text-muted-foreground">ملخص تشغيلي مبني على المذكرات المعتمدة وحركات المخزون والأرصدة الحالية.</p></section>
    {query.isLoading && <Card className="bg-white/85"><CardContent className="p-10 text-center text-sm text-muted-foreground">جار تحميل الإحصائيات…</CardContent></Card>}
    {query.isError && <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center text-sm text-red-700">تعذر تحميل الإحصائيات. تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.</CardContent></Card>}
    {data && <div className="grid gap-5 xl:grid-cols-2">
      <StatCard icon={TrendingUp} title="المواد الأكثر طلباً — Top 5 Items" description="ترتيب المواد حسب مجموع الكميات المسلّمة في المذكرات المعتمدة.">
        {data.topRequested.length === 0 ? <Empty /> : <div className="space-y-3">{data.topRequested.map((row, index) => <div key={row.materialId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17698a] text-xs font-extrabold text-white">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.code} · {row.unit}</p></div></div><div className="text-left"><strong className="block text-[#07518e]">{number(row.quantity)}</strong><span className="text-[11px] text-muted-foreground">وحدة مسلّمة</span></div><LinkButton label="بطاقة المادة" path={`/materials?materialId=${row.materialId}`} /></div>)}</div>}
      </StatCard>
      <StatCard icon={Building2} title="الجهات / الكليات الأكثر استهلاكاً" description="ربط استهلاك الجهة بمذكرات التسليم المعتمدة وحساب مجموع الكميات المسلّمة.">
        {data.topConsumers.length === 0 ? <Empty /> : <div className="space-y-3">{data.topConsumers.map((row, index) => <div key={`${row.partyId}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex min-w-0 items-center gap-3"><span className="text-sm font-extrabold text-[#17698a]">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold">{row.name || "جهة غير محددة"}</p><p className="text-xs text-muted-foreground">{row.memoCount.toLocaleString("ar-SY")} مذكرة تسليم</p></div></div><div className="text-left"><strong className="block text-[#07518e]">{number(row.quantity)}</strong><span className="text-[11px] text-muted-foreground">وحدة مستهلكة</span></div><LinkButton label="مذكرات التسليم" path="/outbound" /></div>)}</div>}
      </StatCard>
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
  </div>;
}
