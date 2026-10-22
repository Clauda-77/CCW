// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { useAuth } from "@/_core/hooks/useAuth";
// // import { trpc } from "@/lib/trpc";
// // import { displayCode } from "@/lib/displayCode";
// // import { formatPrintNumber } from "@/lib/printNumber";
// // import { Barcode, Filter, PackagePlus, Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
// // import { FormEvent, useState } from "react";
// // import { toast } from "sonner";

// // type MaterialForm = { code: string; name: string; description: string; unit: string; barcode: string; minimumStock: string };
// // const initialForm: MaterialForm = { code: "", name: "", description: "", unit: "عدد", barcode: "", minimumStock: "0" };

// // export default function MaterialsPage() {
// //   const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
// //   const [dialogOpen, setDialogOpen] = useState(false);
// //   const [form, setForm] = useState<MaterialForm>(initialForm);
// //   const [editingId, setEditingId] = useState<number | null>(null);
// //   const { isAuthenticated, user } = useAuth();
// //   const isDevelopment = import.meta.env.DEV;
// //   const usePreview = isDevelopment && !isAuthenticated;
// //   const liveQuery = trpc.materials.list.useQuery({ search }, { enabled: isAuthenticated });
// //   const previewQuery = trpc.materials.previewList.useQuery({ search }, { enabled: usePreview });
// //   const query = usePreview ? previewQuery : liveQuery;
// //   const utils = trpc.useUtils();
// //   const canManage = isAuthenticated && user?.role === "admin";
// //   const canDelete = isAuthenticated && user?.role === "admin";
// //   const createMutation = trpc.materials.create.useMutation({
// //     onSuccess: async () => {
// //       setDialogOpen(false);
// //       setForm(initialForm);
// //       await utils.materials.list.invalidate();
// //       await utils.materials.previewList.invalidate();
// //       toast.success("تمت إضافة المادة إلى دليل المواد.");
// //     },
// //     onError: error => toast.error(error.message || "تعذر حفظ المادة."),
// //   });
// //   const updateMutation = trpc.materials.update.useMutation({
// //     onSuccess: async () => { setDialogOpen(false); setEditingId(null); setForm(initialForm); await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم تحديث المادة."); },
// //     onError: error => toast.error(error.message || "تعذر تحديث المادة."),
// //   });
// //   const deleteMutation = trpc.materials.delete.useMutation({
// //     onSuccess: async () => { await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم حذف المادة نهائيًا."); },
// //     onError: error => toast.error(error.message || "تعذر حذف المادة نهائيًا."),
// //   });

// //   const submit = (event: FormEvent<HTMLFormElement>) => {
// //     event.preventDefault();
// //     const input = { ...form, minimumStock: Number(form.minimumStock) || 0 };
// //     if (editingId) updateMutation.mutate({ id: editingId, ...input }); else createMutation.mutate(input);
// //   };
// //   const editMaterial = (material: { id: number; code: string; name: string; description: string | null; unit: string; barcode: string | null; minimumStock: string }) => { setEditingId(material.id); setForm({ code: material.code, name: material.name, description: material.description || "", unit: material.unit, barcode: material.barcode || "", minimumStock: material.minimumStock }); setDialogOpen(true); };
// //   const rows = query.data ?? [];

// //   return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
// //     <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[#17698a]">إدارة المخزون</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">دليل المواد</h1><p className="mt-2 text-sm text-muted-foreground">تعريف المواد ووحدات القياس والحدود الدنيا وباركود التتبع.</p></div>{canManage && <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(initialForm); } }}><DialogTrigger asChild><Button className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><PackagePlus className="ml-2 h-4 w-4" />مادة جديدة</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right text-xl">{editingId ? "تعديل المادة" : "إضافة مادة جديدة"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4 pt-2"><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-code">رمز المادة</Label><Input id="material-code" required value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} placeholder="مثال: 2001" /></div><div className="grid gap-2"><Label htmlFor="material-name">اسم المادة</Label><Input id="material-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="اسم المادة" /></div></div><div className="grid gap-2"><Label htmlFor="material-description">الوصف</Label><Input id="material-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="وصف اختياري للمادة" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-unit">الوحدة</Label><Input id="material-unit" required value={form.unit} onChange={event => setForm(current => ({ ...current, unit: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="minimum-stock">الحد الأدنى</Label><Input id="minimum-stock" required type="number" min="0" step="0.001" value={form.minimumStock} onChange={event => setForm(current => ({ ...current, minimumStock: event.target.value }))} /></div></div><div className="grid gap-2"><Label htmlFor="barcode">الباركود</Label><Input id="barcode" value={form.barcode} onChange={event => setForm(current => ({ ...current, barcode: event.target.value }))} placeholder="اختياري" /></div><Button disabled={createMutation.isPending || updateMutation.isPending} className="mt-2 rounded-xl bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editingId ? "حفظ التعديلات" : "حفظ المادة"}</Button></form></DialogContent></Dialog>}</section>
// //     <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-lg flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-slate-200 pr-9" placeholder="ابحث بالاسم أو الرمز أو الباركود" /></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl"><Filter className="ml-2 h-4 w-4" />الفلاتر</Button><Button variant="outline" className="rounded-xl"><SlidersHorizontal className="ml-2 h-4 w-4" />الأعمدة</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">الرمز</th><th className="px-4 py-3 font-medium">اسم المادة</th><th className="px-4 py-3 font-medium">الوحدة</th><th className="px-4 py-3 font-medium">الحد الأدنى</th><th className="px-4 py-3 font-medium">الباركود</th><th className="px-4 py-3 font-medium">الحالة</th>{canManage && <th className="px-4 py-3 font-medium">إجراء</th>}</tr></thead><tbody>{query.isLoading && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">جار تحميل المواد…</td></tr>}{query.isError && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-destructive">تعذر تحميل المواد.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}{rows.map(material => <tr key={material.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 font-mono text-muted-foreground">{displayCode(material.code)}</td><td className="px-4 py-4 font-bold">{material.name}</td><td className="px-4 py-4">{material.unit}</td><td className="px-4 py-4 text-muted-foreground">{formatPrintNumber(material.minimumStock)}</td><td className="px-4 py-4 text-muted-foreground">{material.barcode || "—"}</td><td className="px-4 py-4"><Badge className={material.isActive ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-slate-100 text-slate-500 hover:bg-slate-100"}>{material.isActive ? "نشطة" : "موقوفة"}</Badge></td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editMaterial(material)} aria-label={`تعديل ${material.name}`}><Pencil className="h-4 w-4" /></Button>{canDelete && <Button variant="ghost" size="icon" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`حذف المادة ${material.name} نهائيًا؟ لا يمكن التراجع عن الحذف، ولن ينجح إذا كانت المادة مرتبطة بمذكرة أو رصيد أو حركة مخزون.`)) deleteMutation.mutate({ id: material.id }); }} aria-label={`حذف ${material.name} نهائيًا`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td>}</tr>)}</tbody></table></div><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>عرض {rows.length} مادة</span><span className="flex items-center gap-1"><Barcode className="h-3.5 w-4" />الباركود مدعوم في بطاقة المادة</span></div></CardContent></Card>
// //   </div>;
// // }




// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useAuth } from "@/_core/hooks/useAuth";
// import { trpc } from "@/lib/trpc";
// import { displayCode } from "@/lib/displayCode";
// import { formatPrintNumber } from "@/lib/printNumber";
// import { Barcode, ChevronLeft, ChevronRight, Filter, PackagePlus, Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
// import { FormEvent, useEffect, useState } from "react";
// import { toast } from "sonner";

// type MaterialForm = { code: string; name: string; description: string; unit: string; barcode: string; minimumStock: string };
// const initialForm: MaterialForm = { code: "", name: "", description: "", unit: "عدد", barcode: "", minimumStock: "0" };

// export default function MaterialsPage() {
//   const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
//   const [page, setPage] = useState(1);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [form, setForm] = useState<MaterialForm>(initialForm);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const { isAuthenticated, user } = useAuth();
//   const isDevelopment = import.meta.env.DEV;
//   const usePreview = isDevelopment && !isAuthenticated;
//   const queryInput = { search, page, pageSize: 20 };
//   const liveQuery = trpc.materials.list.useQuery(queryInput, { enabled: isAuthenticated });
//   const previewQuery = trpc.materials.previewList.useQuery(queryInput, { enabled: usePreview });
//   const query = usePreview ? previewQuery : liveQuery;
//   const utils = trpc.useUtils();
//   const canManage = isAuthenticated && ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
//   const canDelete = isAuthenticated && user?.role === "admin";
//   const createMutation = trpc.materials.create.useMutation({
//     onSuccess: async () => {
//       setDialogOpen(false);
//       setForm(initialForm);
//       await utils.materials.list.invalidate();
//       await utils.materials.previewList.invalidate();
//       toast.success("تمت إضافة المادة إلى دليل المواد.");
//     },
//     onError: error => toast.error(error.message || "تعذر حفظ المادة."),
//   });
//   const updateMutation = trpc.materials.update.useMutation({
//     onSuccess: async () => { setDialogOpen(false); setEditingId(null); setForm(initialForm); await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم تحديث المادة."); },
//     onError: error => toast.error(error.message || "تعذر تحديث المادة."),
//   });
//   const deleteMutation = trpc.materials.delete.useMutation({
//     onSuccess: async () => { await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم حذف المادة نهائيًا."); },
//     onError: error => toast.error(error.message || "تعذر حذف المادة نهائيًا."),
//   });

//   const submit = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const input = { ...form, minimumStock: Number(form.minimumStock) || 0 };
//     if (editingId) updateMutation.mutate({ id: editingId, ...input }); else createMutation.mutate(input);
//   };
//   const editMaterial = (material: { id: number; code: string; name: string; description: string | null; unit: string; barcode: string | null; minimumStock: string }) => { setEditingId(material.id); setForm({ code: material.code, name: material.name, description: material.description || "", unit: material.unit, barcode: material.barcode || "", minimumStock: material.minimumStock }); setDialogOpen(true); };
//   const rows = query.data?.items ?? [];
//   const totalPages = query.data?.totalPages ?? 0;
//   useEffect(() => { setPage(1); }, [search]);

//   return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
//     <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[#17698a]">إدارة المخزون</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">دليل المواد</h1><p className="mt-2 text-sm text-muted-foreground">تعريف المواد ووحدات القياس والحدود الدنيا وباركود التتبع.</p></div>{canManage && <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(initialForm); } }}><DialogTrigger asChild><Button className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><PackagePlus className="ml-2 h-4 w-4" />مادة جديدة</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right text-xl">{editingId ? "تعديل المادة" : "إضافة مادة جديدة"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4 pt-2"><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-code">رمز المادة</Label><Input id="material-code" required value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} placeholder="مثال: 2001" /></div><div className="grid gap-2"><Label htmlFor="material-name">اسم المادة</Label><Input id="material-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="اسم المادة" /></div></div><div className="grid gap-2"><Label htmlFor="material-description">الوصف</Label><Input id="material-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="وصف اختياري للمادة" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-unit">الوحدة</Label><Input id="material-unit" required value={form.unit} onChange={event => setForm(current => ({ ...current, unit: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="minimum-stock">الحد الأدنى</Label><Input id="minimum-stock" required type="number" min="0" step="0.001" value={form.minimumStock} onChange={event => setForm(current => ({ ...current, minimumStock: event.target.value }))} /></div></div><div className="grid gap-2"><Label htmlFor="barcode">الباركود</Label><Input id="barcode" value={form.barcode} onChange={event => setForm(current => ({ ...current, barcode: event.target.value }))} placeholder="اختياري" /></div><Button disabled={createMutation.isPending || updateMutation.isPending} className="mt-2 rounded-xl bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editingId ? "حفظ التعديلات" : "حفظ المادة"}</Button></form></DialogContent></Dialog>}</section>
//     <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-lg flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-slate-200 pr-9" placeholder="ابحث بالاسم أو الرمز أو الباركود" /></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl"><Filter className="ml-2 h-4 w-4" />الفلاتر</Button><Button variant="outline" className="rounded-xl"><SlidersHorizontal className="ml-2 h-4 w-4" />الأعمدة</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">الرمز</th><th className="px-4 py-3 font-medium">اسم المادة</th><th className="px-4 py-3 font-medium">الوحدة</th><th className="px-4 py-3 font-medium">الحد الأدنى</th><th className="px-4 py-3 font-medium">الباركود</th><th className="px-4 py-3 font-medium">الحالة</th>{canManage && <th className="px-4 py-3 font-medium">إجراء</th>}</tr></thead><tbody>{query.isLoading && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">جار تحميل المواد…</td></tr>}{query.isError && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-destructive">تعذر تحميل المواد.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}{rows.map(material => <tr key={material.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 font-mono text-muted-foreground">{displayCode(material.code)}</td><td className="px-4 py-4 font-bold">{material.name}</td><td className="px-4 py-4">{material.unit}</td><td className="px-4 py-4 text-muted-foreground">{formatPrintNumber(material.minimumStock)}</td><td className="px-4 py-4 text-muted-foreground">{material.barcode || "—"}</td><td className="px-4 py-4"><Badge className={material.isActive ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-slate-100 text-slate-500 hover:bg-slate-100"}>{material.isActive ? "نشطة" : "موقوفة"}</Badge></td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editMaterial(material)} aria-label={`تعديل ${material.name}`}><Pencil className="h-4 w-4" /></Button>{canDelete && <Button variant="ghost" size="icon" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`حذف المادة ${material.name} نهائيًا؟ لا يمكن التراجع عن الحذف، ولن ينجح إذا كانت المادة مرتبطة بمذكرة أو رصيد أو حركة مخزون.`)) deleteMutation.mutate({ id: material.id }); }} aria-label={`حذف المادة ${material.name} نهائيًا`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td>}</tr>)}</tbody></table></div><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>عرض {rows.length} من أصل {query.data?.total ?? 0} مادة</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage(current => current - 1)}><ChevronRight className="h-4 w-4" />السابق</Button><span>صفحة {page} من {Math.max(1, totalPages)}</span><Button variant="outline" size="sm" disabled={page >= totalPages || query.isFetching} onClick={() => setPage(current => current + 1)}>التالي<ChevronLeft className="h-4 w-4" /></Button></div><span className="flex items-center gap-1"><Barcode className="h-3.5 w-4" />الباركود مدعوم في بطاقة المادة</span></div></CardContent></Card>
//   </div>;
// }


// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useAuth } from "@/_core/hooks/useAuth";
// import { trpc } from "@/lib/trpc";
// import { displayCode } from "@/lib/displayCode";
// import { formatPrintNumber } from "@/lib/printNumber";
// import { Barcode, Filter, PackagePlus, Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
// import { FormEvent, useState } from "react";
// import { toast } from "sonner";

// type MaterialForm = { code: string; name: string; description: string; unit: string; barcode: string; minimumStock: string };
// const initialForm: MaterialForm = { code: "", name: "", description: "", unit: "عدد", barcode: "", minimumStock: "0" };

// export default function MaterialsPage() {
//   const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [form, setForm] = useState<MaterialForm>(initialForm);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const { isAuthenticated, user } = useAuth();
//   const isDevelopment = import.meta.env.DEV;
//   const usePreview = isDevelopment && !isAuthenticated;
//   const liveQuery = trpc.materials.list.useQuery({ search }, { enabled: isAuthenticated });
//   const previewQuery = trpc.materials.previewList.useQuery({ search }, { enabled: usePreview });
//   const query = usePreview ? previewQuery : liveQuery;
//   const utils = trpc.useUtils();
//   const canManage = isAuthenticated && user?.role === "admin";
//   const canDelete = isAuthenticated && user?.role === "admin";
//   const createMutation = trpc.materials.create.useMutation({
//     onSuccess: async () => {
//       setDialogOpen(false);
//       setForm(initialForm);
//       await utils.materials.list.invalidate();
//       await utils.materials.previewList.invalidate();
//       toast.success("تمت إضافة المادة إلى دليل المواد.");
//     },
//     onError: error => toast.error(error.message || "تعذر حفظ المادة."),
//   });
//   const updateMutation = trpc.materials.update.useMutation({
//     onSuccess: async () => { setDialogOpen(false); setEditingId(null); setForm(initialForm); await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم تحديث المادة."); },
//     onError: error => toast.error(error.message || "تعذر تحديث المادة."),
//   });
//   const deleteMutation = trpc.materials.delete.useMutation({
//     onSuccess: async () => { await utils.materials.list.invalidate(); await utils.materials.previewList.invalidate(); toast.success("تم حذف المادة نهائيًا."); },
//     onError: error => toast.error(error.message || "تعذر حذف المادة نهائيًا."),
//   });

//   const submit = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const input = { ...form, minimumStock: Number(form.minimumStock) || 0 };
//     if (editingId) updateMutation.mutate({ id: editingId, ...input }); else createMutation.mutate(input);
//   };
//   const editMaterial = (material: { id: number; code: string; name: string; description: string | null; unit: string; barcode: string | null; minimumStock: string }) => { setEditingId(material.id); setForm({ code: material.code, name: material.name, description: material.description || "", unit: material.unit, barcode: material.barcode || "", minimumStock: material.minimumStock }); setDialogOpen(true); };
//   const rows = query.data ?? [];

//   return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
//     <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[#17698a]">إدارة المخزون</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">دليل المواد</h1><p className="mt-2 text-sm text-muted-foreground">تعريف المواد ووحدات القياس والحدود الدنيا وباركود التتبع.</p></div>{canManage && <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(initialForm); } }}><DialogTrigger asChild><Button className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><PackagePlus className="ml-2 h-4 w-4" />مادة جديدة</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right text-xl">{editingId ? "تعديل المادة" : "إضافة مادة جديدة"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4 pt-2"><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-code">رمز المادة</Label><Input id="material-code" required value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} placeholder="مثال: 2001" /></div><div className="grid gap-2"><Label htmlFor="material-name">اسم المادة</Label><Input id="material-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="اسم المادة" /></div></div><div className="grid gap-2"><Label htmlFor="material-description">الوصف</Label><Input id="material-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="وصف اختياري للمادة" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-unit">الوحدة</Label><Input id="material-unit" required value={form.unit} onChange={event => setForm(current => ({ ...current, unit: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="minimum-stock">الحد الأدنى</Label><Input id="minimum-stock" required type="number" min="0" step="0.001" value={form.minimumStock} onChange={event => setForm(current => ({ ...current, minimumStock: event.target.value }))} /></div></div><div className="grid gap-2"><Label htmlFor="barcode">الباركود</Label><Input id="barcode" value={form.barcode} onChange={event => setForm(current => ({ ...current, barcode: event.target.value }))} placeholder="اختياري" /></div><Button disabled={createMutation.isPending || updateMutation.isPending} className="mt-2 rounded-xl bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editingId ? "حفظ التعديلات" : "حفظ المادة"}</Button></form></DialogContent></Dialog>}</section>
//     <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-lg flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-slate-200 pr-9" placeholder="ابحث بالاسم أو الرمز أو الباركود" /></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl"><Filter className="ml-2 h-4 w-4" />الفلاتر</Button><Button variant="outline" className="rounded-xl"><SlidersHorizontal className="ml-2 h-4 w-4" />الأعمدة</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">الرمز</th><th className="px-4 py-3 font-medium">اسم المادة</th><th className="px-4 py-3 font-medium">الوحدة</th><th className="px-4 py-3 font-medium">الحد الأدنى</th><th className="px-4 py-3 font-medium">الباركود</th><th className="px-4 py-3 font-medium">الحالة</th>{canManage && <th className="px-4 py-3 font-medium">إجراء</th>}</tr></thead><tbody>{query.isLoading && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">جار تحميل المواد…</td></tr>}{query.isError && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-destructive">تعذر تحميل المواد.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}{rows.map(material => <tr key={material.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 font-mono text-muted-foreground">{displayCode(material.code)}</td><td className="px-4 py-4 font-bold">{material.name}</td><td className="px-4 py-4">{material.unit}</td><td className="px-4 py-4 text-muted-foreground">{formatPrintNumber(material.minimumStock)}</td><td className="px-4 py-4 text-muted-foreground">{material.barcode || "—"}</td><td className="px-4 py-4"><Badge className={material.isActive ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-slate-100 text-slate-500 hover:bg-slate-100"}>{material.isActive ? "نشطة" : "موقوفة"}</Badge></td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editMaterial(material)} aria-label={`تعديل ${material.name}`}><Pencil className="h-4 w-4" /></Button>{canDelete && <Button variant="ghost" size="icon" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`حذف المادة ${material.name} نهائيًا؟ لا يمكن التراجع عن الحذف، ولن ينجح إذا كانت المادة مرتبطة بمذكرة أو رصيد أو حركة مخزون.`)) deleteMutation.mutate({ id: material.id }); }} aria-label={`حذف ${material.name} نهائيًا`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td>}</tr>)}</tbody></table></div><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>عرض {rows.length} مادة</span><span className="flex items-center gap-1"><Barcode className="h-3.5 w-4" />الباركود مدعوم في بطاقة المادة</span></div></CardContent></Card>
//   </div>;
// }




import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { formatPrintNumber } from "@/lib/printNumber";
import { Barcode, ChevronLeft, ChevronRight, Filter, PackagePlus, Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type MaterialForm = { code: string; name: string; description: string; unit: string; barcode: string; minimumStock: string };
const initialForm: MaterialForm = { code: "", name: "", description: "", unit: "عدد", barcode: "", minimumStock: "0" };

export default function MaterialsPage() {
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MaterialForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const usePreview = isDevelopment && !isAuthenticated;
  const queryInput = { search, page, pageSize: 20 };
  const liveQuery = trpc.materials.page.useQuery(queryInput, { enabled: isAuthenticated });
  const previewQuery = trpc.materials.previewPage.useQuery(queryInput, { enabled: usePreview });
  const query = usePreview ? previewQuery : liveQuery;
  const utils = trpc.useUtils();
  const canManage = isAuthenticated && ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
  const canDelete = isAuthenticated && user?.role === "admin";
  const createMutation = trpc.materials.create.useMutation({
    onSuccess: async () => {
      setDialogOpen(false);
      setForm(initialForm);
      await utils.materials.page.invalidate();
      await utils.materials.previewPage.invalidate();
      toast.success("تمت إضافة المادة إلى دليل المواد.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ المادة."),
  });
  const updateMutation = trpc.materials.update.useMutation({
    onSuccess: async () => { setDialogOpen(false); setEditingId(null); setForm(initialForm); await utils.materials.page.invalidate(); await utils.materials.previewPage.invalidate(); toast.success("تم تحديث المادة."); },
    onError: error => toast.error(error.message || "تعذر تحديث المادة."),
  });
  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: async () => { await utils.materials.page.invalidate(); await utils.materials.previewPage.invalidate(); toast.success("تم حذف المادة نهائيًا."); },
    onError: error => toast.error(error.message || "تعذر حذف المادة نهائيًا."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = { ...form, minimumStock: Number(form.minimumStock) || 0 };
    if (editingId) updateMutation.mutate({ id: editingId, ...input }); else createMutation.mutate(input);
  };
  const editMaterial = (material: { id: number; code: string; name: string; description: string | null; unit: string; barcode: string | null; minimumStock: string }) => { setEditingId(material.id); setForm({ code: material.code, name: material.name, description: material.description || "", unit: material.unit, barcode: material.barcode || "", minimumStock: material.minimumStock }); setDialogOpen(true); };
  const rows = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  useEffect(() => { setPage(1); }, [search]);

  return <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[#17698a]">إدارة المخزون</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">دليل المواد</h1><p className="mt-2 text-sm text-muted-foreground">تعريف المواد ووحدات القياس والحدود الدنيا وباركود التتبع.</p></div>{canManage && <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(initialForm); } }}><DialogTrigger asChild><Button className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><PackagePlus className="ml-2 h-4 w-4" />مادة جديدة</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right text-xl">{editingId ? "تعديل المادة" : "إضافة مادة جديدة"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4 pt-2"><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-code">رمز المادة</Label><Input id="material-code" required value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} placeholder="مثال: 2001" /></div><div className="grid gap-2"><Label htmlFor="material-name">اسم المادة</Label><Input id="material-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="اسم المادة" /></div></div><div className="grid gap-2"><Label htmlFor="material-description">الوصف</Label><Input id="material-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="وصف اختياري للمادة" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="material-unit">الوحدة</Label><Input id="material-unit" required value={form.unit} onChange={event => setForm(current => ({ ...current, unit: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="minimum-stock">الحد الأدنى</Label><Input id="minimum-stock" required type="number" min="0" step="0.001" value={form.minimumStock} onChange={event => setForm(current => ({ ...current, minimumStock: event.target.value }))} /></div></div><div className="grid gap-2"><Label htmlFor="barcode">الباركود</Label><Input id="barcode" value={form.barcode} onChange={event => setForm(current => ({ ...current, barcode: event.target.value }))} placeholder="اختياري" /></div><Button disabled={createMutation.isPending || updateMutation.isPending} className="mt-2 rounded-xl bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editingId ? "حفظ التعديلات" : "حفظ المادة"}</Button></form></DialogContent></Dialog>}</section>
    <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-lg flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-slate-200 pr-9" placeholder="ابحث بالاسم أو الرمز أو الباركود" /></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl"><Filter className="ml-2 h-4 w-4" />الفلاتر</Button><Button variant="outline" className="rounded-xl"><SlidersHorizontal className="ml-2 h-4 w-4" />الأعمدة</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-right"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">الرمز</th><th className="px-4 py-3 font-medium">اسم المادة</th><th className="px-4 py-3 font-medium">الوحدة</th><th className="px-4 py-3 font-medium">الحد الأدنى</th><th className="px-4 py-3 font-medium">الباركود</th><th className="px-4 py-3 font-medium">الحالة</th>{canManage && <th className="px-4 py-3 font-medium">إجراء</th>}</tr></thead><tbody>{query.isLoading && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">جار تحميل المواد…</td></tr>}{query.isError && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-destructive">تعذر تحميل المواد.</td></tr>}{!query.isLoading && !query.isError && rows.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}{rows.map(material => <tr key={material.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 font-mono text-muted-foreground">{displayCode(material.code)}</td><td className="px-4 py-4 font-bold">{material.name}</td><td className="px-4 py-4">{material.unit}</td><td className="px-4 py-4 text-muted-foreground">{formatPrintNumber(material.minimumStock)}</td><td className="px-4 py-4 text-muted-foreground">{material.barcode || "—"}</td><td className="px-4 py-4"><Badge className={material.isActive ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-slate-100 text-slate-500 hover:bg-slate-100"}>{material.isActive ? "نشطة" : "موقوفة"}</Badge></td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editMaterial(material)} aria-label={`تعديل ${material.name}`}><Pencil className="h-4 w-4" /></Button>{canDelete && <Button variant="ghost" size="icon" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`حذف المادة ${material.name} نهائيًا؟ لا يمكن التراجع عن الحذف، ولن ينجح إذا كانت المادة مرتبطة بمذكرة أو رصيد أو حركة مخزون.`)) deleteMutation.mutate({ id: material.id }); }} aria-label={`حذف المادة ${material.name} نهائيًا`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td>}</tr>)}</tbody></table></div><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>عرض {rows.length} من أصل {query.data?.total ?? 0} مادة</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage(current => current - 1)}><ChevronRight className="h-4 w-4" />السابق</Button><span>صفحة {page} من {Math.max(1, totalPages)}</span><Button variant="outline" size="sm" disabled={page >= totalPages || query.isFetching} onClick={() => setPage(current => current + 1)}>التالي<ChevronLeft className="h-4 w-4" /></Button></div><span className="flex items-center gap-1"><Barcode className="h-3.5 w-4" />الباركود مدعوم في بطاقة المادة</span></div></CardContent></Card>
  </div>;
}
