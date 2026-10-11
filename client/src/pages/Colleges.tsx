import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type CollegeForm = { code: string; name: string; notes: string };
type CollegeRow = CollegeForm & { id: number; isActive: boolean };
const initialForm: CollegeForm = { code: "", name: "", notes: "" };

export default function CollegesPage() {
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CollegeForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const canManage = isDevelopment || (isAuthenticated && user?.role === "admin");
  const utils = trpc.useUtils();
  const liveQuery = trpc.entities.listColleges.useQuery({ search, limit: 200 }, { enabled: isAuthenticated && !isDevelopment });
  const previewQuery = trpc.entities.previewListColleges.useQuery({ search, limit: 200 }, { enabled: isDevelopment });
  const query = isDevelopment ? previewQuery : liveQuery;
  const rows = (query.data ?? []) as CollegeRow[];
  const refresh = async () => {
    await Promise.all([utils.entities.listColleges.invalidate(), utils.entities.previewListColleges.invalidate()]);
  };
  const createMutation = trpc.entities.createCollege.useMutation({
    onSuccess: async () => { await refresh(); setDialogOpen(false); setForm(initialForm); toast.success("تمت إضافة الكلية."); },
    onError: error => toast.error(error.message || "تعذر حفظ الكلية."),
  });
  const updateMutation = trpc.entities.updateCollege.useMutation({
    onSuccess: async () => { await refresh(); setDialogOpen(false); setEditingId(null); setForm(initialForm); toast.success("تم تحديث الكلية."); },
    onError: error => toast.error(error.message || "تعذر تحديث الكلية."),
  });
  const deactivateMutation = trpc.entities.deactivateCollege.useMutation({
    onSuccess: async () => { await refresh(); toast.success("تم تعطيل الكلية من دون حذف سجلها."); },
    onError: error => toast.error(error.message || "تعذر تعطيل الكلية."),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(form);
  };
  const editCollege = (row: CollegeRow) => { setEditingId(row.id); setForm({ code: row.code || "", name: row.name, notes: row.notes || "" }); setDialogOpen(true); };
  const closeDialog = (open: boolean) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(initialForm); } };

  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm font-semibold text-[#17698a]">الدليل الأكاديمي</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">أسماء الكليات</h1><p className="mt-2 text-sm text-muted-foreground">إدارة أسماء الكليات والجهات الأكاديمية المرتبطة بالعمليات اليومية.</p></div>
      {canManage && <Dialog open={dialogOpen} onOpenChange={closeDialog}><DialogTrigger asChild><Button className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><Plus className="ml-2 h-4 w-4" />كلية جديدة</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right">{editingId ? "تعديل الكلية" : "إضافة كلية جديدة"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4"><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="college-code">الرمز</Label><Input id="college-code" value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="college-name">اسم الكلية</Label><Input id="college-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div></div><div className="grid gap-2"><Label htmlFor="college-notes">ملاحظات</Label><Input id="college-notes" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></div><Button disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editingId ? "حفظ التعديلات" : "حفظ الكلية"}</Button></form></DialogContent></Dialog>}
    </section>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="relative max-w-lg"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl pr-9" placeholder="ابحث باسم الكلية أو الرمز" /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-right"><thead className="bg-[#e5f2f7] text-xs text-[#315b72]"><tr><th className="px-4 py-3">الرمز</th><th className="px-4 py-3">اسم الكلية</th><th className="px-4 py-3">ملاحظات</th><th className="px-4 py-3">الحالة</th>{canManage && <th className="px-4 py-3">إجراء</th>}</tr></thead><tbody>{query.isLoading && <tr><td colSpan={canManage ? 5 : 4} className="p-10 text-center text-sm text-muted-foreground">جار تحميل الكليات…</td></tr>}{query.isError && <tr><td colSpan={canManage ? 5 : 4} className="p-10 text-center text-sm text-destructive">تعذر تحميل الكليات.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="p-10 text-center text-sm text-muted-foreground">لا توجد كليات مطابقة.</td></tr>}{rows.map(row => <tr key={row.id} className="border-t border-slate-100 text-sm"><td className="px-4 py-4 font-mono text-muted-foreground">{row.code || "—"}</td><td className="px-4 py-4 font-bold"><span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#17698a]" />{row.name}</span></td><td className="px-4 py-4 text-muted-foreground">{row.notes || "—"}</td><td className="px-4 py-4"><Badge className={row.isActive ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-slate-100 text-slate-500 hover:bg-slate-100"}>{row.isActive ? "نشطة" : "موقوفة"}</Badge></td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editCollege(row)} aria-label={`تعديل ${row.name}`}><Pencil className="h-4 w-4" /></Button>{row.isActive && <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(`تعطيل الكلية ${row.name}؟`)) deactivateMutation.mutate({ id: row.id }); }} aria-label={`تعطيل ${row.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td>}</tr>)}</tbody></table></div></CardContent></Card>
  </div>;
}

