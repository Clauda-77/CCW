import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { displayMemoNumber } from "@/lib/memoNumber";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpLeft, Boxes, ClipboardList, KeyRound, PackagePlus, ScanLine, Warehouse } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const previewDashboard = trpc.warehouse.previewDashboard.useQuery(undefined, { enabled: isDevelopment });
  const protectedDashboard = trpc.warehouse.dashboard.useQuery(undefined, { enabled: !isDevelopment && isAuthenticated });
  const dashboard = isDevelopment ? previewDashboard : protectedDashboard;
  const data = dashboard.data;
  const isLoading = dashboard.isLoading;
  const mostUsedMaterials = data?.mostUsedMaterials ?? [];
  const memos = data?.latestMemos ?? [];
  const canCreateMemo = isDevelopment || ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
  const metrics = [
    { label: "إجمالي المواد", value: data?.materialCount ?? 0, detail: "بطاقة مادة نشطة", icon: Boxes },
    { label: "إجمالي المستودعات", value: data?.warehouseCount ?? 0, detail: "مستودعات مسجلة بالنظام", icon: Warehouse },
    { label: "إجمالي المذكرات", value: data?.memoCount ?? 0, detail: "إدخال وتسليم مرحّل", icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-[1540px] space-y-5" dir="rtl">
      <section className="legacy-old-hero relative min-h-[360px] overflow-hidden rounded-lg border border-[#68aeca] shadow-[0_16px_32px_-24px_rgba(0,67,128,0.75)]">
        <div className="legacy-chart-bars legacy-chart-bars-home absolute bottom-0 left-0 h-[82%] w-[57%] overflow-hidden opacity-95" aria-hidden="true"><span className="legacy-chart-bar h-[94%]" /><span className="legacy-chart-bar h-[78%]" /><span className="legacy-chart-bar h-[88%]" /><span className="legacy-chart-bar h-[66%]" /><span className="legacy-chart-bar h-[82%]" /><span className="legacy-chart-bar h-[72%]" /><span className="legacy-chart-bar h-[90%]" /><span className="legacy-chart-bar h-[62%]" /></div>
        <div className="legacy-hero-wave absolute inset-0" />
        <div className="absolute bottom-10 left-[18%] h-1.5 w-[32%] rotate-[-22deg] bg-[#f28a13] shadow-[0_0_12px_rgba(255,255,255,0.85)]" />
        <div className="absolute bottom-[29%] left-[31%] h-1.5 w-[18%] rotate-[24deg] bg-[#f28a13] shadow-[0_0_12px_rgba(255,255,255,0.85)]" />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-between p-7 sm:p-10">
          <div className="flex items-start justify-between gap-5 text-white">
            <div className="max-w-xl">
              <h1 className="mt-2 text-4xl font-black tracking-tight drop-shadow-[0_2px_0_rgba(0,53,104,0.3)] sm:text-5xl">الصفحة الرئيسية</h1>
              <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/85">إدارة المستودعات ومتابعة المواد والمذكرات وحركة الإدخال والإخراج والتقارير الرسمية.</p>
            </div>
            <div className="hidden min-w-[260px] border-r-2 border-white/45 pr-5 text-right md:block">
              {/* <p className="mt-3 text-xs font-semibold leading-6 text-[#0a527f]">إدارة المواد والعمليات اليومية</p> */}
              {!isAuthenticated && <Button onClick={() => setLocation("/login")} className="mt-4 h-9 rounded-sm border border-[#f8b29b] bg-[#e54b32] text-xs font-extrabold text-white shadow transition-colors hover:bg-[#c93b27]"><KeyRound className="ml-2 h-3.5 w-3.5" />واجهة الدخول</Button>}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setLocation("/inventory")} className="rounded-sm border border-white/70 bg-white text-[#07518e] shadow hover:bg-[#eaf8ff]"><ScanLine className="ml-2 h-4 w-4" />حركة المواد</Button>
              {canCreateMemo && <Button onClick={() => setLocation("/inbound")} className="rounded-sm border border-[#f8b29b] bg-[#e54b32] text-white shadow hover:bg-[#c93b27]"><PackagePlus className="ml-2 h-4 w-4" />مذكرة استلام جديدة</Button>}
            </div>
            <div className="hidden border-t border-white/35 pt-2 text-xs font-bold text-white/75 sm:block">نظام إدارة المستودعات</div>
          </div>
        </div>
      </section>

      <section className="legacy-old-metrics grid overflow-hidden border border-[#9bc8da] bg-white/85 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return <div key={metric.label} className={`flex items-center justify-between gap-4 px-5 py-4 ${index > 0 ? "border-t border-[#d6e8ef] sm:border-t-0 sm:border-r" : ""}`}><div><p className="text-xs font-bold text-[#4e6d7d]">{metric.label}</p><p className="metric-underline mt-2 text-2xl font-black text-[#0a4d93]">{isLoading ? "…" : Number(metric.value).toLocaleString("ar")}</p><p className="mt-2 text-[11px] text-[#6b8793]">{metric.detail}</p></div><span className={`grid h-10 w-10 place-items-center rounded-sm ${index === 2 ? "bg-[#ffe5e0] text-[#d94231]" : "bg-[#dff3ff] text-[#006db9]"}`}><Icon className="h-5 w-5" /></span></div>;
        })}
      </section>

      {dashboard.isError && <div className="border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">تعذر تحميل لوحة التحكم حاليًا. يمكن إعادة المحاولة بعد التأكد من اتصال قاعدة البيانات.</div>}

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="legacy-panel overflow-hidden rounded-sm"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-[#c8e2ed] bg-[#edf9ff] px-5 py-4"><div><h2 className="font-extrabold text-[#07518e]">المواد الأكثر استخدامًا</h2><p className="mt-1 text-xs text-[#5c7b8b]">مرتبة حسب إجمالي كميات الإخراج الفعلية.</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/materials")} className="text-[#17698a]">دليل المواد <ArrowUpLeft className="mr-1 h-4 w-4" /></Button></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right"><thead className="bg-[#e5f2f7] text-xs text-[#315b72]"><tr><th className="px-5 py-3 font-bold">المادة</th><th className="px-4 py-3 font-bold">الرمز</th><th className="px-4 py-3 font-bold">الكمية المستخدمة</th><th className="px-5 py-3 font-bold">عدد الحركات</th></tr></thead><tbody>{isLoading && <tr><td colSpan={4} className="px-5 py-9 text-center text-sm text-muted-foreground">جار تحميل المواد…</td></tr>}{!isLoading && mostUsedMaterials.length === 0 && <tr><td colSpan={4} className="px-5 py-9 text-center text-sm text-muted-foreground">لا توجد حركات إخراج مسجلة بعد.</td></tr>}{mostUsedMaterials.map((item, index) => <tr key={`${item.id}-${item.code}-${index}`} className={`border-t border-[#d8e8ee] text-sm ${index % 2 === 0 ? "bg-[#f3faed]" : "bg-[#fff3ec]"}`}><td className="px-5 py-3 font-semibold">{item.name}<span className="mr-2 text-xs font-normal text-muted-foreground">{item.unit}</span></td><td className="px-4 py-3 text-muted-foreground">{displayCode(item.code)}</td><td className="px-4 py-3 font-bold text-[#a4650b]">{item.usageQuantity}</td><td className="px-5 py-3 font-bold text-[#07518e]">{Number(item.movementCount).toLocaleString("ar")}</td></tr>)}</tbody></table></div></CardContent></Card>

        <Card className="legacy-panel rounded-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-extrabold text-[#07518e]">آخر المذكرات</h2><p className="mt-1 text-xs text-[#5c7b8b]">سجل العمليات المعتمدة مؤخرًا.</p></div><ClipboardList className="h-5 w-5 text-[#17698a]" /></div><div className="mt-4 space-y-1">{isLoading && <p className="p-3 text-sm text-muted-foreground">جار تحميل المذكرات…</p>}{!isLoading && memos.length === 0 && <p className="p-3 text-sm text-muted-foreground">لا توجد مذكرات لعرضها.</p>}{memos.map(memo => { const inbound = memo.type === "inbound"; return <button key={memo.id} onClick={() => setLocation(inbound ? "/inbound" : "/outbound")} className="flex w-full items-center justify-between border-b border-[#e2edf2] p-3 text-right transition-colors hover:bg-[#edf9ff]"><div><p className="text-sm font-bold">{inbound ? "استلام" : "تسليم"} #{displayMemoNumber(memo.sourceMemoNumber, memo.memoNumber)}</p><p className="mt-1 text-xs text-muted-foreground">{memo.partyName || "جهة غير محددة"}</p></div><div className="flex flex-col items-end gap-1"><Badge className={`border-0 ${inbound ? "bg-[#e3f1f7] text-[#17698a] hover:bg-[#e3f1f7]" : "bg-[#fdebed] text-[#a64758] hover:bg-[#fdebed]"}`}>{inbound ? "استلام" : "تسليم"}</Badge><span className="text-[11px] text-muted-foreground">{new Date(memo.memoDate).toLocaleDateString("ar")}</span></div></button>; })}</div><Button variant="outline" onClick={() => setLocation("/inventory")} className="mt-4 w-full rounded-sm border-[#8cc6dd] text-[#07518e]">عرض حركة المواد والتقارير</Button></CardContent></Card>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {canCreateMemo && <button onClick={() => setLocation("/inbound")} className="group border border-[#73c9ee] bg-[#e7f9ff] p-5 text-right shadow-[0_14px_24px_-22px_rgba(0,86,158,0.8)] transition-transform hover:-translate-y-0.5"><ArrowDownToLine className="h-5 w-5 text-[#0071bc]" /><h3 className="mt-5 text-base font-extrabold text-[#074b88]">تسجيل استلام</h3><p className="mt-2 text-sm leading-6 text-[#356987]">أضف موادًا واردة واربطها بالجهة والمستودع.</p></button>}
        {canCreateMemo && <button onClick={() => setLocation("/outbound")} className="group border border-[#ffc0ac] bg-[#fff2e8] p-5 text-right shadow-[0_14px_24px_-22px_rgba(162,62,29,0.55)] transition-transform hover:-translate-y-0.5"><ArrowUpFromLine className="h-5 w-5 text-[#d9442f]" /><h3 className="mt-5 text-base font-extrabold text-[#90411e]">إنشاء تسليم</h3><p className="mt-2 text-sm leading-6 text-[#875765]">أنشئ مذكرة صرف ثم أرسلها للمراجعة والاعتماد.</p></button>}
        {(isDevelopment || user?.role === "admin") && <button onClick={() => setLocation("/import")} className="group border border-[#91c8ec] bg-[#eefaff] p-5 text-right shadow-[0_14px_24px_-22px_rgba(0,86,158,0.5)] transition-transform hover:-translate-y-0.5"><ClipboardList className="h-5 w-5 text-[#0069af]" /><h3 className="mt-5 text-base font-extrabold text-[#074b88]">استيراد البيانات</h3><p className="mt-2 text-sm leading-6 text-[#356987]">جهّز ملفات Excel القديمة للترحيل مع فحص الحقول.</p></button>}
      </section>
    </div>
  );
}
