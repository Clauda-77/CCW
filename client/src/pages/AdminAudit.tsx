import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

type AuditAction = "memo_deleted" | "user_role_changed" | "user_created" | "material_created" | "material_updated" | "material_deactivated" | "material_deleted" | "warehouse_created" | "warehouse_updated" | "warehouse_deactivated" | "warehouse_deleted" | "party_created" | "party_updated" | "party_deactivated" | "college_created" | "college_updated" | "college_deactivated" | "memo_created" | "memo_reviewed" | "memo_cancelled" | "memo_approved" | "import_committed" | "memo_import_committed";
type AuditEntity = "memo" | "user" | "material" | "warehouse" | "party" | "college" | "import_batch";

const actionLabel: Record<AuditAction, string> = { memo_deleted: "حذف مذكرة", user_role_changed: "تعديل صلاحية", user_created: "إضافة مستخدم", material_created: "إضافة مادة", material_updated: "تعديل مادة", material_deactivated: "تعطيل مادة", material_deleted: "حذف مادة", warehouse_created: "إضافة مستودع", warehouse_updated: "تعديل مستودع", warehouse_deactivated: "تعطيل مستودع", warehouse_deleted: "حذف مستودع", party_created: "إضافة جهة", party_updated: "تعديل جهة", party_deactivated: "تعطيل جهة", college_created: "إضافة كلية", college_updated: "تعديل كلية", college_deactivated: "تعطيل كلية", memo_created: "إنشاء مذكرة", memo_reviewed: "مراجعة مذكرة", memo_cancelled: "إلغاء مذكرة", memo_approved: "اعتماد مذكرة", import_committed: "اعتماد استيراد", memo_import_committed: "اعتماد استيراد مذكرات" };
const entityLabel: Record<AuditEntity, string> = { memo: "مذكرة", user: "مستخدم", material: "مادة", warehouse: "مستودع", party: "جهة", college: "كلية", import_batch: "دفعة استيراد" };
const formatDate = (value: Date | string | null) => value ? new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function AdminAuditPage() {
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const canView = isDevelopment || user?.role === "admin";
  const liveQuery = trpc.adminAudit.list.useQuery({ limit: 500 }, { enabled: isAuthenticated && canView && !isDevelopment });
  const previewQuery = trpc.adminAudit.previewList.useQuery({ limit: 500 }, { enabled: isDevelopment });
  const query = isDevelopment ? previewQuery : liveQuery;
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"all" | AuditAction>("all");
  const [entity, setEntity] = useState<"all" | AuditEntity>("all");
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (query.data ?? []).filter(row => {
      const matchesSearch = !term || [row.actorName, row.entityLabel, row.details, String(row.entityId)].some(value => String(value ?? "").toLocaleLowerCase().includes(term));
      return matchesSearch && (action === "all" || row.action === action) && (entity === "all" || row.entityType === entity);
    });
  }, [action, entity, query.data, search]);

  if (!isDevelopment && (!isAuthenticated || !canView)) return <div className="mx-auto max-w-3xl py-14 text-center" dir="rtl"><ShieldCheck className="mx-auto h-10 w-10 text-[#3284ae]" /><h1 className="mt-4 text-2xl font-extrabold">سجل الإدارة للمدير فقط</h1><p className="mt-3 text-sm text-muted-foreground">لا يمكن عرض سجل العمليات الإدارية إلا للمدير.</p></div>;

  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section><p className="text-sm font-semibold text-[#17698a]">الرقابة الإدارية</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">سجل الحركات الإدارية</h1><p className="mt-2 text-sm text-muted-foreground">يتتبع عمليات المواد والمستودعات والجهات والمذكرات والاستيراد مع اسم المنفّذ والتاريخ والتفاصيل.</p></section>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]"><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl pr-9" placeholder="ابحث بالمنفّذ أو الكيان أو التفاصيل" /></div><Select value={action} onValueChange={value => setAction(value as typeof action)}><SelectTrigger className="rounded-xl"><SelectValue placeholder="كل العمليات" /></SelectTrigger><SelectContent dir="rtl"><SelectItem value="all">كل العمليات</SelectItem>{Object.entries(actionLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={entity} onValueChange={value => setEntity(value as typeof entity)}><SelectTrigger className="rounded-xl"><SelectValue placeholder="كل الكيانات" /></SelectTrigger><SelectContent dir="rtl"><SelectItem value="all">كل الكيانات</SelectItem>{Object.entries(entityLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="flex items-center justify-center gap-2 rounded-xl border border-[#bee4f5] bg-[#eefaff] px-3 text-sm font-bold text-[#17698a]"><ClipboardList className="h-4 w-4" />{rows.length} حركة</div></div></CardContent></Card>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">التاريخ</th><th className="px-4 py-3 font-medium">المنفّذ</th><th className="px-4 py-3 font-medium">العملية</th><th className="px-4 py-3 font-medium">الكيان</th><th className="px-4 py-3 font-medium">المعرّف</th><th className="px-4 py-3 font-medium">التفاصيل</th></tr></thead><tbody>{query.isLoading && <tr><td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">جار تحميل سجل الحركات…</td></tr>}{query.isError && <tr><td colSpan={6} className="p-10 text-center text-sm text-destructive">تعذر تحميل سجل الحركات.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">لا توجد حركات مطابقة حتى الآن.</td></tr>}{rows.map(row => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 text-slate-600">{formatDate(row.createdAt)}</td><td className="px-4 py-4 font-bold">{row.actorName || `#${row.actorId}`}</td><td className="px-4 py-4 font-semibold text-[#07518e]">{actionLabel[row.action as AuditAction]}</td><td className="px-4 py-4">{entityLabel[row.entityType as AuditEntity]}</td><td className="px-4 py-4 font-mono text-slate-500">{row.entityLabel || `#${row.entityId}`}</td><td className="px-4 py-4 text-slate-600">{row.details || "—"}</td></tr>)}</tbody></table></div></CardContent></Card>
  </div>;
}

export { actionLabel, entityLabel };
