// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { MemoPartyPicker } from "@/components/MemoPartyPicker";
// import { MemoQuickMaterialDialog } from "@/components/MemoQuickMaterialDialog";
// import { useAuth } from "@/_core/hooks/useAuth";
// import { printMemo } from "@/lib/memoPrint";
// import { openPrintWindow } from "@/lib/printWindow";
// import { displayCode } from "@/lib/displayCode";
// import { trpc } from "@/lib/trpc";
// import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FilePlus2, FileText, PackageSearch, Plus, Printer, Search, Send, ShieldCheck, Trash2, X } from "lucide-react";
// import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "sonner";
// import { classifyMemo, memoClassificationDescription, memoClassificationHasPrice, memoClassificationLabel, type MemoClassification } from "@shared/memoClassification";
// import { filterMaterials } from "@shared/materialSearch";
// import { filterMemos } from "@shared/memoSearch";

// const statusLabel = { draft: "مسودة", pending_review: "بانتظار المراجعة", approved: "معتمدة", rejected: "مرفوضة", cancelled: "ملغاة" } as const;
// type Line = { materialId: string; quantity: string; unitPrice: string; materialName?: string; materialUnit?: string; materialCode?: string };
// const emptyLine = (): Line => ({ materialId: "", quantity: "1", unitPrice: "" });

// export default function MemosPage({ kind, mode = "standard", inboundMode = "receipt" }: { kind: "inbound" | "outbound"; mode?: "standard" | "transfer"; inboundMode?: "receipt" | "entry" }) {
//   const inbound = kind === "inbound";
//   const inboundEntry = inbound && inboundMode === "entry";
//   const entryClassification: "new_receipt" | "returned_old" = inboundEntry ? "returned_old" : "new_receipt";
//   const setEntryClassification = (_value?: "new_receipt" | "returned_old") => toast.info("نوع هذه المذكرة محدد من خيار القائمة: الاستلام للمواد الجديدة والإدخال للمواد المُعادة.");
//   const transferMode = mode === "transfer";
//   const accent = inbound ? "#0071ba" : "#d9442f";
//   const Icon = inbound ? ArrowDownToLine : ArrowUpFromLine;
//   const { isAuthenticated, user } = useAuth();
//   const isDevelopment = import.meta.env.DEV;
//   const [open, setOpen] = useState(false);
//   const [pickerLine, setPickerLine] = useState<number | null>(null);
//   const [quickMaterialOpen, setQuickMaterialOpen] = useState(false);
//   const [pendingMaterialName, setPendingMaterialName] = useState<string | null>(null);
//   const materialSearchEnterRef = useRef(false);
//   const [materialSearch, setMaterialSearch] = useState("");
//   const [memoGeneralSearch, setMemoGeneralSearch] = useState("");
//   const [memoFinancialSearch, setMemoFinancialSearch] = useState("");
//   const [memoSerialSearch, setMemoSerialSearch] = useState("");
//   const [printTargetId, setPrintTargetId] = useState<number | null>(null);
//   const [printWindow, setPrintWindow] = useState<Window | null>(null);
//   const [deleteTarget, setDeleteTarget] = useState<{ id: number; memoNumber: string } | null>(null);
//   const [memoNumber, setMemoNumber] = useState("");
//   const [memoDate, setMemoDate] = useState(() => new Date().toISOString().slice(0, 10));
//   const [warehouseId, setWarehouseId] = useState("");
//   const [partyId, setPartyId] = useState("");
//   const [folderNumber, setFolderNumber] = useState("");
//   const [orderNumber, setOrderNumber] = useState("");
//   const [orderDate, setOrderDate] = useState("");
//   const [invoiceNumber, setInvoiceNumber] = useState("");
//   const [invoiceDate, setInvoiceDate] = useState("");
//   const [referenceNumber, setReferenceNumber] = useState("");
//   const [outboundClassification, setOutboundClassification] = useState<"adjustment" | "transfer">(() => mode === "transfer" ? "transfer" : "adjustment");
//   const [memoNotes, setMemoNotes] = useState("");
//   const [lines, setLines] = useState<Line[]>([emptyLine()]);
//   const usePreview = isDevelopment && !isAuthenticated;
//   const live = trpc.memos.list.useQuery({ type: kind }, { enabled: isAuthenticated });
//   const preview = trpc.memos.previewList.useQuery({ type: kind }, { enabled: usePreview });
//   const entityLive = trpc.entities.overview.useQuery(undefined, { enabled: isAuthenticated });
//   const entityPreview = trpc.entities.previewOverview.useQuery(undefined, { enabled: usePreview });
// const nextMemoIdLive = trpc.memos.nextMemoId.useQuery(undefined, { enabled: isAuthenticated });
// const nextMemoIdPreview = trpc.memos.previewNextMemoId.useQuery(undefined, { enabled: usePreview });
// const nextSerialNumberLive = trpc.memos.nextSerialNumber.useQuery(undefined, { enabled: isAuthenticated });
// const nextSerialNumberPreview = trpc.memos.previewNextSerialNumber.useQuery(undefined, { enabled: usePreview });

//   // const nextSerialLive = trpc.memos.nextSerialNumber.useQuery(undefined, { enabled: isAuthenticated });
//   // const nextSerialPreview = trpc.memos.previewNextSerialNumber.useQuery(undefined, { enabled: usePreview });
//   const materialsLive = trpc.materials.list.useQuery({ search: materialSearch }, { enabled: isAuthenticated });
//   const materialsPreview = trpc.materials.previewList.useQuery({ search: materialSearch }, { enabled: usePreview });
//   const printLive = trpc.memos.details.useQuery({ id: printTargetId ?? 1 }, { enabled: Boolean(printTargetId) && isAuthenticated });
//   const printPreview = trpc.memos.previewDetails.useQuery({ id: printTargetId ?? 1 }, { enabled: Boolean(printTargetId) && usePreview });
//   const printQuery = usePreview ? printPreview : printLive;
//   const rows = (usePreview ? preview.data : live.data) ?? [];
//   const entities = usePreview ? entityPreview.data : entityLive.data;
//   const nextMemoId = usePreview ? nextMemoIdPreview.data : nextMemoIdLive.data;

//   // const nextSerialNumber = usePreview ? nextSerialPreview.data : nextSerialLive.data;
//   const loadedMaterials = (usePreview ? materialsPreview.data : materialsLive.data) ?? [];
//   const selectedMaterialCache = lines.filter(line => line.materialId && line.materialName).map(line => ({ id: Number(line.materialId), code: line.materialCode ?? "", name: line.materialName ?? "", description: null, unit: line.materialUnit ?? "", barcode: null, minimumStock: "0", isActive: true }));
//   const materials = [...loadedMaterials, ...selectedMaterialCache.filter(material => !loadedMaterials.some(loadedMaterial => loadedMaterial.id === material.id))];
//   const filteredMaterials = useMemo(() => filterMaterials(materials, { general: materialSearch }), [materials, materialSearch]);
//   const materialQueryIsFetching = usePreview ? materialsPreview.isFetching : materialsLive.isFetching;
//   const memoRows = useMemo(() => {
//     const scopedRows = inbound ? rows.filter(memo => classifyMemo({ type: memo.type, notes: memo.notes }) === (inboundEntry ? "return" : "purchase")) : rows;
//     return filterMemos(scopedRows, { general: memoGeneralSearch, financialNumber: memoFinancialSearch, serialNumber: memoSerialSearch });
//   }, [inbound, inboundEntry, memoFinancialSearch, memoGeneralSearch, memoSerialSearch, rows]);
//   const utils = trpc.useUtils();
//   const canCreate = isDevelopment || (isAuthenticated && ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user"));
//   const canCreateParty = isAuthenticated && ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
//   const canCreateMaterial = isAuthenticated && ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
//   const canApprove = isDevelopment || user?.role === "admin";
//   const clearForm = () => { setMemoNumber(""); setWarehouseId(""); setPartyId(""); setFolderNumber(""); setOrderNumber(""); setOrderDate(""); setInvoiceNumber(""); setInvoiceDate(""); setReferenceNumber(""); setOutboundClassification("adjustment"); setMemoNotes(""); setMaterialSearch(""); setMemoGeneralSearch(""); setMemoFinancialSearch(""); setMemoSerialSearch(""); setLines([emptyLine()]); };
//   const createMutation = trpc.memos.create.useMutation({ onSuccess: async () => { setOpen(false); clearForm(); await utils.memos.list.invalidate({ type: kind }); await utils.memos.nextSerialNumber.invalidate(); toast.success("تم إنشاء المذكرة بنجاح."); }, onError: error => toast.error(error.message || "تعذر إنشاء المذكرة.") });
//   const approveMutation = trpc.memos.approve.useMutation({ onSuccess: async () => { await utils.memos.list.invalidate({ type: kind }); await utils.inventory.listBalances.invalidate(); toast.success("تم اعتماد المذكرة وتحديث الرصيد."); }, onError: error => toast.error(error.message || "تعذر اعتماد المذكرة.") });
//   const cancelMutation = trpc.memos.cancel.useMutation({ onSuccess: async () => { await utils.memos.list.invalidate({ type: kind }); toast.success("تم إلغاء المذكرة دون حذف سجلها."); }, onError: error => toast.error(error.message || "تعذر إلغاء المذكرة.") });
//   const deleteMutation = trpc.memos.delete.useMutation({ onSuccess: async (_result, variables) => { const removeDeleted = (current: typeof rows | undefined) => current?.filter(memo => memo.id !== variables.id); utils.memos.list.setData({ type: kind }, removeDeleted); utils.memos.previewList.setData({ type: kind }, removeDeleted); await utils.memos.list.invalidate({ type: kind }); toast.success("تم حذف المسودة نهائيًا وإزالتها من الواجهة."); }, onError: error => toast.error(error.message || "تعذر الحذف النهائي؛ قد تكون المذكرة مرتبطة بسجل تاريخي.") });
//   const updateLine = (index: number, update: Partial<Line>) => setLines(current => current.map((line, row) => row === index ? { ...line, ...update } : line));
//   const selectMaterial = (id: number) => { const selectedMaterial = materials.find(material => material.id === id); const selectedMaterialDetails = selectedMaterial ? { materialId: String(id), materialName: selectedMaterial.name, materialUnit: selectedMaterial.unit, materialCode: selectedMaterial.code } : { materialId: String(id) }; setLines(current => { const requestedLine = pickerLine !== null && !current[pickerLine]?.materialId ? pickerLine : -1; const emptyLineIndex = current.findIndex(line => !line.materialId); const targetLine = requestedLine >= 0 ? requestedLine : emptyLineIndex >= 0 ? emptyLineIndex : (pickerLine ?? current.length); if (targetLine >= 0) return current.map((line, index) => index === targetLine ? { ...line, ...selectedMaterialDetails } : line); return [...current, { ...emptyLine(), ...selectedMaterialDetails }]; }); setPickerLine(null); setMaterialSearch(""); };
//   const addCreatedMaterial = (material: { id: number; code: string; name: string; unit: string }) => { const selectedMaterialDetails = { materialId: String(material.id), materialName: material.name, materialUnit: material.unit, materialCode: material.code }; setLines(current => { const requestedLine = pickerLine !== null && !current[pickerLine]?.materialId ? pickerLine : -1; const emptyLineIndex = current.findIndex(line => !line.materialId); const targetLine = requestedLine >= 0 ? requestedLine : emptyLineIndex >= 0 ? emptyLineIndex : (pickerLine ?? current.length); if (targetLine >= 0) return current.map((line, index) => index === targetLine ? { ...line, ...selectedMaterialDetails } : line); return [...current, { ...emptyLine(), ...selectedMaterialDetails }]; }); setPickerLine(null); setMaterialSearch(""); };
//   const openQuickMaterial = () => { if (!canCreateMaterial) { toast.error("لا تملك صلاحية إضافة مادة جديدة."); return; } setQuickMaterialOpen(true); };
//   const requestQuickMaterial = (name: string) => { const normalizedName = name.trim(); if (!normalizedName) return; materialSearchEnterRef.current = true; setMaterialSearch(normalizedName); setPendingMaterialName(normalizedName); };
//   useEffect(() => { if (!pendingMaterialName || materialQueryIsFetching || pendingMaterialName !== materialSearch.trim()) return; setPendingMaterialName(null); if (filteredMaterials.length === 0) openQuickMaterial(); }, [filteredMaterials.length, materialQueryIsFetching, materialSearch, pendingMaterialName]);
//   useEffect(() => {
//     if (!printTargetId || !printWindow) return;
//     if (printQuery.isError) { toast.error(printQuery.error.message || "تعذر تحميل المذكرة للطباعة."); printWindow.close(); setPrintWindow(null); setPrintTargetId(null); return; }
//     if (!printQuery.data) return;
//     if (!printMemo(printQuery.data, printWindow)) toast.error("تعذر تجهيز نموذج الطباعة. أعد المحاولة.");
//     setPrintWindow(null); setPrintTargetId(null);
//   }, [printQuery.data, printQuery.error, printQuery.isError, printTargetId, printWindow]);
//   const startMemoPrint = (id: number) => {
//     const page = openPrintWindow("مذكرة رسمية");
//     if (!page) { toast.error("المتصفح حجب نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة."); return; }
//     setPrintWindow(page); setPrintTargetId(id);
//   };
//   const draftClassification: MemoClassification = inbound ? (inboundEntry ? "return" : "purchase") : outboundClassification;
//   const priceAllowed = memoClassificationHasPrice(draftClassification);
//   useEffect(() => { if (!priceAllowed) setLines(current => current.some(line => line.unitPrice) ? current.map(line => ({ ...line, unitPrice: "" })) : current); }, [priceAllowed]);
//   // useEffect(() => {
//   //   if (!open) return;
//   //   const computerCenterWarehouse = entities?.warehouses.find(warehouse => warehouse.name.trim().includes("مركز الحاسب"));
//   //   if (computerCenterWarehouse) setWarehouseId(current => current || String(computerCenterWarehouse.id));
//   //   // if (nextSerialNumber) setMemoNumber(current => current || nextSerialNumber);
//   // }, [entities?.warehouses, nextSerialNumber, open]);

//   useEffect(() => {
//   if (!open) return;

//   const computerCenterWarehouse = entities?.warehouses.find(
//     warehouse => warehouse.name.trim().includes("مركز الحاسب")
//   );

//   if (computerCenterWarehouse) {
//     setWarehouseId(current => current || String(computerCenterWarehouse.id));
//   }
// }, [entities?.warehouses, open]);

//   const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (materialSearchEnterRef.current) { materialSearchEnterRef.current = false; return; } const invalidQuantity = lines.some(line => line.materialId && (!/^\d+(?:[.,]\d+)?$/.test(line.quantity.trim()) || Number(line.quantity.replace(",", ".")) <= 0)); if (invalidQuantity) { toast.error("أدخل كمية موجبة صحيحة أو عشرية مثل 1 أو 3.5."); return; } const items = lines.map(line => ({ materialId: Number(line.materialId), quantity: Number(line.quantity.replace(",", ".")), unitPrice: priceAllowed && line.unitPrice ? Number(line.unitPrice) : undefined })).filter(item => item.materialId > 0 && item.quantity > 0); const normalizedMemoNumber = memoNumber.trim(); if (!warehouseId || !normalizedMemoNumber) { toast.error("أدخل رقم المذكرة واختر المستودع."); return; } const duplicate = rows.find(memo => memo.memoNumber.trim() === normalizedMemoNumber); if (duplicate) { toast.error(`رقم المذكرة ${normalizedMemoNumber} موجود مسبقًا في السجل. استخدم زر المعاينة للسجل الموجود بدل إنشاء نسخة مكررة.`); return; } if (!items.length) { toast.error("اختر مادة واحدة على الأقل مع كمية صحيحة."); return; } createMutation.mutate({ type: kind, memoNumber: normalizedMemoNumber, memoDate: new Date(`${memoDate}T00:00:00`), warehouseId: Number(warehouseId), partyId: partyId ? Number(partyId) : undefined, folderNumber: folderNumber || undefined, orderNumber: orderNumber || undefined, orderDate: orderDate ? new Date(`${orderDate}T00:00:00`) : undefined, invoiceNumber: invoiceNumber || undefined, invoiceDate: invoiceDate ? new Date(`${invoiceDate}T00:00:00`) : undefined, referenceNumber: hasFinancialNumber ? normalizedMemoNumber : undefined, notes: `${memoClassificationLabel(draftClassification)} — ${memoClassificationDescription(draftClassification)}${memoNotes.trim() ? ` — ${memoNotes.trim()}` : ""}`, items }); };
//   const fields = [["الرقم المتسلسل", memoNumber, setMemoNumber, "text"], ["التاريخ", memoDate, setMemoDate, "date"], ["المستودع", warehouseId, setWarehouseId, "warehouse"], ["الجهة / المورد", partyId, setPartyId, "party"], ["رقم المجلد", folderNumber, setFolderNumber, "text"], ["رقم الطلب", orderNumber, setOrderNumber, "text"], ["تاريخ الطلب", orderDate, setOrderDate, "date"], ["رقم الفاتورة", invoiceNumber, setInvoiceNumber, "text"], ["تاريخ الفاتورة", invoiceDate, setInvoiceDate, "date"]] as const;
//   const activePickerLine = pickerLine ?? 0;
//   if (false && open) return <div className="memo-page mx-auto max-w-[1500px]" dir="rtl">
//     <form className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border border-[#86cef0] bg-[#f7fdff] shadow-xl" onSubmit={submit}>
//       <header className="legacy-hero-sky flex shrink-0 items-center justify-between border-b-4 border-[#e34b34] p-4 text-white"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/10"><Icon className="h-5 w-5" /></span><div><h1 className="text-xl font-extrabold">{inbound ? "مذكرة استلام" : transferMode ? "إنشاء محضر تركيب وتنسيق" : "إنشاء مذكرة تسليم وإخراج"}</h1><p className="mt-1 text-xs text-white/85">أدخل بيانات الرأس، ثم اختر الجهة والمواد قبل الحفظ.</p></div></div><Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-white/65 bg-white/10 text-white hover:bg-white/20">عودة إلى السجل</Button></header>
//       <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
//         <section className="grid shrink-0 gap-px overflow-hidden rounded-xl border border-[#bce2f3]  bg-white  md:grid-cols-4 xl:grid-cols-5">

//        <div className="bg-white/95 p-2">
//   <Label className="text-[11px] text-[#4b7792]">رقم المذكرة</Label>
//   <Input value={nextMemoId ? String(nextMemoId) : "جار التوليد…"} disabled className="mt-1.5 h-9 border-[#b8ddeb] disabled:bg-slate-100 disabled:text-slate-800" />
// </div>
// <div className="bg-white/95 p-2">
//   <Label className="text-[11px] text-[#4b7792]">الرقم المتسلسل</Label>
//   <Input required value={memoNumber} onChange={event => setMemoNumber(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" />
// </div>

//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">التاريخ</Label><Input required type="date" value={memoDate} onChange={event => setMemoDate(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">المستودع</Label><select required className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold" value={warehouseId} onChange={event => setWarehouseId(event.target.value)}><option value="">اختر المستودع</option>{entities?.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
//           <div className="bg-white/95 p-2"><MemoPartyPicker value={partyId} onChange={setPartyId} canCreate={canCreateParty} /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">رقم المجلد</Label><Input value={folderNumber} onChange={event => setFolderNumber(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">رقم الطلب</Label><Input value={orderNumber} onChange={event => setOrderNumber(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">تاريخ الطلب</Label><Input type="date" value={orderDate} onChange={event => setOrderDate(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">رقم الفاتورة</Label><Input value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">تاريخ الفاتورة</Label><Input type="date" value={invoiceDate} onChange={event => setInvoiceDate(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" /></div>
//           {priceAllowed && <div className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">الرقم المالي</Label><Input value={memoNumber} readOnly className="mt-1.5 h-9 border-[#b8ddeb] bg-slate-100" /></div>}
//         </section>
//         <section className="grid min-h-[420px] flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
//           <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#86cef0] bg-white"><div className="flex shrink-0 items-center justify-between gap-3 bg-[#eaf8fe] px-4 py-3"><div><h2 className="font-extrabold text-[#07518e]">مواد المذكرة</h2><p className="mt-0.5 text-xs text-[#4b7792]">تظهر كل مادة تضيفها كسطر مستقل.</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setLines(current => [...current, emptyLine()]); setPickerLine(lines.length); }}><Plus className="ml-1 h-4 w-4" />إضافة مادة</Button></div>
//             <div className="memo-items-scroll min-h-0 flex-1 overflow-auto"><table className={`w-full ${priceAllowed ? "min-w-[800px]" : "min-w-[650px]"} text-right`}><thead className="bg-[#dff4ff] text-xs text-[#17638d]"><tr><th className="px-3 py-2">تسلسل</th><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">اسم المادة</th><th className="px-3 py-2">ملاحظات المادة</th><th className="px-3 py-2">الوحدة</th><th className="px-3 py-2">الكمية</th>{priceAllowed && <th className="px-3 py-2">السعر</th>}<th className="px-3 py-2">إجراء</th></tr></thead><tbody>{lines.map((line, index) => { const material = materials.find(item => item.id === Number(line.materialId)); return <tr key={index} className="border-t border-[#d9eff9]"><td className="px-3 py-2 text-sm">{index + 1}</td><td className="px-3 py-2 text-sm text-muted-foreground">{displayCode(material?.code)}</td><td className="px-3 py-2"><Button type="button" variant="ghost" className="h-8 px-1 text-[#07518e]" onClick={() => setPickerLine(index)}><PackageSearch className="ml-1 h-4 w-4" />{material?.name || "اضغط لاختيار مادة"}</Button></td><td className="min-w-[220px] px-3 py-2"><Input className="h-8" value={line.materialNotes ?? material?.description ?? ""} onChange={event => updateLine(index, { materialNotes: event.target.value })} placeholder="أدخل ملاحظات المادة" /></td><td className="min-w-[220px] px-3 py-2"><Input className="h-8" value={line.materialNotes ?? material?.description ?? ""} onChange={event => updateLine(index, { materialNotes: event.target.value })} placeholder="أدخل ملاحظات المادة" /></td><td className="px-3 py-2 text-sm">{material?.unit || ""}</td><td className="px-3 py-2"><Input required type="number" min="0.001" step="0.001" inputMode="decimal" className="h-8 w-28" value={line.quantity} onChange={event => updateLine(index, { quantity: event.target.value })} /></td>{priceAllowed && <td className="px-3 py-2"><Input type="number" min="0" step="0.01" className="h-8 w-28" value={line.unitPrice} onChange={event => updateLine(index, { unitPrice: event.target.value })} /></td>}<td className="px-3 py-2">{lines.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setLines(current => current.filter((_, row) => row !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</td></tr>; })}</tbody></table></div>
//           </div>
//           <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#bce2f3] bg-[#f7fdff]"><div className="shrink-0 border-b border-[#bce2f3] bg-[#eaf8fe] p-3"><h2 className="font-extrabold text-[#07518e]">بحث المواد</h2><p className="mt-1 text-xs text-[#4b7792]">إذا لم تظهر نتيجة، اضغط Enter لإضافة المادة الجديدة.</p><div className="relative mt-3"><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input autoFocus className="h-9 pr-9" value={materialSearch} onChange={event => setMaterialSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); requestQuickMaterial(event.currentTarget.value); } }} placeholder="بحث عام بالاسم أو الرمز" /></div></div><div className="min-h-0 flex-1 overflow-auto p-2">{filteredMaterials.map(material => <button key={material.id} type="button" onClick={() => selectMaterial(material.id)} className="memo-material-row flex w-full items-center justify-between gap-2 rounded-md border-b border-[#d9eff9] px-2 py-2 text-right hover:bg-[#eaf8fe]"><span className="truncate text-xs font-bold text-[#07518e]">{material.name}</span><span className="shrink-0 text-[11px] text-muted-foreground">{displayCode(material.code)}</span></button>)}{materialSearch.trim() && !materialQueryIsFetching && filteredMaterials.length === 0 && <Button type="button" variant="outline" onClick={openQuickMaterial} className="mt-2 h-auto w-full whitespace-normal border-dashed border-[#86cef0] py-3 text-[#07518e]">إضافة مادة جديدة باسم «{materialSearch.trim()}»</Button>}</div></aside>
//         </section>
//         <footer className="flex shrink-0 justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button disabled={createMutation.isPending || updateMutation.isPending} style={{ backgroundColor: accent }}>{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editTargetId ? "حفظ التعديل" : "إنشاء المذكرة"}</Button></footer>
//       </div>
//     </form>
//     <MemoQuickMaterialDialog open={quickMaterialOpen} onOpenChange={setQuickMaterialOpen} initialName={materialSearch} onMaterialCreated={addCreatedMaterial} />
//   </div>;
//   return <div className="memo-page mx-auto max-w-[1480px] space-y-6" data-inbound-mode={inbound ? inboundMode : undefined} dir="rtl">
//     <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold" style={{ color: accent }}>{inbound ? "توريد وإدخال" : transferMode ? "محضر تركيب وتنسيق" : "صرف وتسليم"}</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">{inbound ? "مذكرات الاستلام" : transferMode ? "محضر تركيب وتنسيق" : "مذكرات التسليم"}</h1><p className="mt-2 text-sm text-muted-foreground">{transferMode ? "إدخال محضر تركيب وتنسيق ومواده وفق النموذج التشغيلي القديم." : "إدخال المذكرة وموادها ومراجع الفاتورة والطلب وفق النموذج التشغيلي."}</p></div>{canCreate && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded-xl" style={{ backgroundColor: accent }}><FilePlus2 className="ml-2 h-4 w-4" />{inbound ? "مذكرة استلام جديدة" : transferMode ? "محضر تركيب وتنسيق جديد" : "مذكرة تسليم جديدة"}</Button></DialogTrigger><DialogContent dir="rtl" className="memo-editor-dialog flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-h-none max-w-[1500px] flex-col overflow-hidden border-[#86cef0] p-0"><DialogHeader className="legacy-hero-sky shrink-0 border-b-4 border-[#e34b34] p-4 text-white"><div className="flex items-center justify-between gap-3"><DialogTitle className="flex items-center gap-3 text-right text-xl"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/10"><Icon className="h-5 w-5" /></span>{inbound ? "مذكرة استلام" : transferMode ? "إنشاء محضر تركيب وتنسيق" : "إنشاء مذكرة تسليم وإخراج"}</DialogTitle><Button form="memo-form" type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ backgroundColor: accent }}>{createMutation.isPending || updateMutation.isPending ? "جار الحفظ…" : editTargetId ? "حفظ التعديل" : "إنشاء المذكرة"}</Button></div></DialogHeader><form id="memo-form" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-4" onSubmit={submit}><div className="grid shrink-0 gap-px overflow-hidden rounded-xl border border-[#bce2f3] bg-[#bce2f3] md:grid-cols-4 xl:grid-cols-5">{fields.map(([label, value, setValue, type]) => <div key={label} className="bg-white/95 p-2"><Label className="text-[11px] text-[#4b7792]">{label}</Label>{type === "warehouse" ? <select required disabled={!inboundEntry} className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-700" value={value} onChange={event => setValue(event.target.value)}><option value="">اختر المستودع</option>{entities?.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select> : type === "party" ? <MemoPartyPicker value={partyId} onChange={setPartyId} canCreate={canCreateParty} /> : <Input required={label === "الرقم المتسلسل"} type={type} value={value} onChange={event => setValue(event.target.value)} className="mt-1.5 h-9 border-[#b8ddeb]" />}</div>)}</div><div className="grid shrink-0 gap-2 rounded-xl border border-[#bce2f3] bg-[#f7fdff] p-3 md:grid-cols-2"><div><Label className="text-[11px] text-[#4b7792]">نوع العملية</Label>{inbound ? <select className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold" value={entryClassification} onChange={event => setEntryClassification(event.target.value as "new_receipt" | "returned_old")}><option value="new_receipt">استلام مواد جديدة — تدخل أول مرة للمستودع</option><option value="returned_old">إدخال مواد قديمة — مواد مُرجعة</option></select> : transferMode ? <div className="mt-1.5 flex h-9 items-center rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold">تركيب وتنسيق</div> : <select className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold" value={outboundClassification} onChange={event => setOutboundClassification(event.target.value as "adjustment" | "transfer")}><option value="adjustment">تسليم — بلا سعر</option><option value="transfer">تركيب وتنسيق</option></select>}<p className="mt-1 text-[10px] text-[#4b7792]">{memoClassificationDescription(draftClassification)}</p></div><div><Label className="text-[11px] text-[#4b7792]">ملاحظات</Label><Input className="mt-1.5 h-9 border-[#b8ddeb]" value={memoNotes} onChange={event => setMemoNotes(event.target.value)} placeholder="ملاحظات اختيارية" /></div></div><div className="flex shrink-0 flex-wrap items-center justify-between gap-2"><Badge className="border-0 bg-[#e9f8ff] px-3 py-1.5 text-[#07518e] hover:bg-[#e9f8ff]">{inbound ? "مذكرة إدخال" : transferMode ? "محضر تركيب وتنسيق" : "مذكرة تسليم"}</Badge></div><div className="grid min-h-[360px] flex-none gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border-2 border-[#86cef0] bg-white"><div className="flex shrink-0 flex-col gap-2 bg-[#eaf8fe] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-[#07518e]">مواد المذكرة</h3><p className="mt-0.5 text-xs text-[#4b7792]">تظهر المواد المختارة هنا مباشرة، ويمكن تمرير القائمة عند زيادة المواد.</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setLines(current => [...current, emptyLine()]); setPickerLine(lines.length); }}><Plus className="ml-1 h-4 w-4" />إضافة مادة</Button></div><div className="memo-items-scroll min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-contain bg-white"><table className={`w-full ${priceAllowed ? "min-w-[800px]" : "min-w-[650px]"} text-right`}><thead className="bg-[#dff4ff] text-xs text-[#17638d]"><tr><th className="px-3 py-2">تسلسل</th><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">اسم المادة</th><th className="px-3 py-2">ملاحظات المادة</th><th className="px-3 py-2">الوحدة</th><th className="px-3 py-2">الكمية</th>{priceAllowed && <th className="px-3 py-2">السعر</th>}<th className="px-3 py-2">إجراء</th></tr></thead><tbody>{lines.length === 0 ? <tr><td colSpan={priceAllowed ? 7 : 6} className="h-28 px-3 py-8 text-center text-sm font-semibold text-[#4b7792]">لم تتم إضافة أي مادة بعد. اختر «إضافة مادة» ثم اضغط على مادة من لوحة البحث.</td></tr> : lines.map((line, index) => { const material = materials.find(item => item.id === Number(line.materialId)); return <tr key={index} className="border-t border-[#d9eff9]"><td className="px-3 py-2 text-sm">{index + 1}</td><td className="px-3 py-2 text-sm text-muted-foreground">{displayCode(material?.code)}</td><td className="px-3 py-2"><Button type="button" variant="ghost" className="h-8 px-1 text-[#07518e]" onClick={() => setPickerLine(index)}><PackageSearch className="ml-1 h-4 w-4" />{material?.name || "اضغط لاختيار مادة"}</Button></td><td className="min-w-[220px] px-3 py-2"><Input className="h-8" value={line.materialNotes ?? material?.description ?? ""} onChange={event => updateLine(index, { materialNotes: event.target.value })} placeholder="أدخل ملاحظات المادة" /></td><td className="px-3 py-2 text-sm">{material?.unit || ""}</td><td className="px-3 py-2"><Input required type="number" min="0.001" step="0.001" inputMode="decimal" pattern="[0-9]*" className="h-8 w-28" value={line.quantity} onChange={event => updateLine(index, { quantity: event.target.value })} /></td>{priceAllowed && <td className="px-3 py-2"><Input type="number" min="0" step="0.01" className="h-8 w-28" value={line.unitPrice} onChange={event => updateLine(index, { unitPrice: event.target.value })} /></td>}<td className="px-3 py-2">{lines.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setLines(current => current.filter((_, row) => row !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</td></tr>; })}</tbody></table></div></div><aside className="flex min-h-[320px] min-h-0 flex-col overflow-hidden rounded-xl border border-[#bce2f3] bg-[#f7fdff]" aria-label="البحث عن مادة"><div className="shrink-0 border-b border-[#bce2f3] bg-[#eaf8fe] p-3"><h3 className="font-extrabold text-[#07518e]">بحث المواد</h3><p className="mt-1 text-xs text-[#4b7792]">اختر السطر ثم اضغط المادة لإضافتها مباشرة.</p><div className="relative mt-3"><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pr-9" value={materialSearch} onChange={event => setMaterialSearch(event.target.value)} placeholder="بحث عام بالاسم أو الرمز" /></div></div><div className="min-h-0 flex-1 overflow-auto p-2">{filteredMaterials.map(material => <button key={material.id} type="button" onClick={() => selectMaterial(material.id) } className="memo-material-row flex w-full items-center justify-between gap-2 rounded-md border-b border-[#d9eff9] px-2 py-2 text-right hover:bg-[#eaf8fe]"><span className="truncate text-xs font-bold text-[#07518e]">{material.name}</span><span className="shrink-0 text-[11px] text-muted-foreground">{displayCode(material.code)}</span></button>)}</div></aside></div><div className="flex shrink-0 justify-end gap-2"><span className="text-xs text-muted-foreground">يمكن إنشاء المذكرة من الزر العلوي.</span></div></form></DialogContent></Dialog>}</section>
//     <Dialog open={pickerLine !== null} onOpenChange={visible => { if (!visible) { setPickerLine(null); setMaterialSearch(""); } }}><DialogContent dir="rtl" className="h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-h-none max-w-5xl overflow-hidden border-[#86cef0] p-0"><DialogHeader className="shrink-0 border-b border-[#bce2f3] bg-[#effbff] px-6 py-4"><DialogTitle className="text-right text-xl text-[#07518e]">اختيار مادة للمذكرة</DialogTitle><p className="mt-1 text-xs text-[#4b7792]">اكتب للبحث، ثم اضغط على صف المادة فقط لإضافتها إلى البند.</p></DialogHeader><div className="p-5"><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input autoFocus className="pr-9" value={materialSearch} onChange={event => setMaterialSearch(event.target.value)} onKeyDown={event => { if (event.key === "Escape") { setPickerLine(null); setMaterialSearch(""); return; } if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); requestQuickMaterial(event.currentTarget.value); } }} placeholder="بحث عام بالاسم أو الرمز أو الباركود" /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-right"><thead className="bg-[#dff4ff] text-xs text-[#17638d]"><tr><th className="px-3 py-3">الرمز</th><th className="px-3 py-3">اسم المادة</th><th className="px-3 py-3">الوحدة</th><th className="px-3 py-3">الباركود</th></tr></thead><tbody>{filteredMaterials.map(material => <tr key={material.id} tabIndex={0} role="button" onClick={() => selectMaterial(material.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectMaterial(material.id); } }} className="memo-material-row border-t border-[#d9eff9]"><td className="px-3 py-3 text-sm text-muted-foreground">{displayCode(material.code)}</td><td className="px-3 py-3 font-bold">{material.name}</td><td className="px-3 py-3 text-sm">{material.unit}</td><td className="px-3 py-3 text-sm text-muted-foreground">{material.barcode || ""}</td></tr>)}</tbody></table>{materialSearch.trim() && filteredMaterials.length === 0 && <Button type="button" variant="outline" onClick={openQuickMaterial} className="mt-3 h-auto w-full whitespace-normal border-dashed border-[#86cef0] py-3 text-[#07518e]">إضافة مادة جديدة باسم «{materialSearch.trim()}»</Button>}</div></div></DialogContent></Dialog>
//     <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-0"><div className="flex flex-col gap-3 border-b border-slate-100 p-5"><div><h2 className="font-extrabold">سجل المذكرات</h2><p className="mt-1 text-xs text-muted-foreground">البحث هنا يصفّي رأس المذكرة كاملًا، وليس موادها فقط.</p></div><div className="grid gap-2 md:grid-cols-3">{hasFinancialNumber && <Input value={memoFinancialSearch} onChange={event => setMemoFinancialSearch(event.target.value)} placeholder="بحث بالرقم المالي للمذكرة" aria-label="بحث بالرقم المالي للمذكرة" />}<Input value={memoSerialSearch} onChange={event => setMemoSerialSearch(event.target.value)} placeholder="بحث بالرقم المتسلسل للمذكرة" aria-label="بحث بالرقم المتسلسل للمذكرة" /><Input value={memoGeneralSearch} onChange={event => setMemoGeneralSearch(event.target.value)} placeholder="بحث عام برقم أو تاريخ أو جهة المذكرة" aria-label="بحث عام في المذكرات" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-right"><thead className="bg-slate-50/80 text-xs text-muted-foreground"><tr>
//       {/* <th className="px-5 py-3">الرقم</th> */}
//       <th className="px-5 py-3">رقم المذكرة</th>
// <th className="px-5 py-3">الرقم المتسلسل</th>

//       <th className="px-5 py-3">الجهة</th><th className="px-5 py-3">المستودع</th><th className="px-5 py-3">التاريخ</th><th className="px-5 py-3">الحالة</th><th className="px-5 py-3">إجراء</th></tr></thead><tbody>{memoRows.map(memo => <tr key={memo.id} className="border-t border-slate-100 text-sm">
//         {/* <td className="px-5 py-4 font-bold">{memo.memoNumber}</td> */}
//         <td className="px-5 py-4 font-bold">{memo.id}</td>
// <td className="px-5 py-4">{memo.memoNumber}</td>

//         <td className="px-5 py-4">{memo.partyName || ""}</td><td className="px-5 py-4 text-muted-foreground">{memo.warehouseName}</td><td className="px-5 py-4 text-muted-foreground">{new Date(memo.memoDate).toLocaleDateString("ar")}</td><td className="px-5 py-4"><Badge className={memo.status === "approved" ? "border-0 bg-[#e8f2e8] text-[#39744b]" : "border-0 bg-[#fff1dc] text-[#a4650b]"}>{statusLabel[memo.status]}</Badge></td><td className="px-5 py-4"><Button variant="ghost" size="sm" disabled={printTargetId === memo.id} onClick={() => startMemoPrint(memo.id)}><FileText className="ml-1 h-3.5 w-3.5" />{printTargetId === memo.id ? "جار التجهيز…" : "معاينة"}</Button>{canApprove && memo.status !== "approved" && memo.status !== "cancelled" && <Button variant="ghost" size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: memo.id })}><CheckCircle2 className="ml-1 h-3.5 w-3.5 text-[#39744b]" />اعتماد</Button>}{canApprove && memo.status !== "approved" && memo.status !== "cancelled" && <Button variant="ghost" size="sm" disabled={cancelMutation.isPending} onClick={() => { if (window.confirm(`إلغاء المذكرة ${memo.memoNumber}؟ سيبقى سجلها محفوظًا.`)) cancelMutation.mutate({ id: memo.id }); }}><Trash2 className="ml-1 h-3.5 w-3.5 text-destructive" />إلغاء</Button>}{canApprove && transferMode && (memo.status === "draft" || memo.status === "pending_review") && <Button variant="ghost" size="sm" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget({ id: memo.id, memoNumber: memo.memoNumber })}><Trash2 className="ml-1 h-3.5 w-3.5 text-red-700" />حذف نهائي</Button>}</td></tr>)}</tbody></table></div></CardContent></Card><Card className="soft-shadow border-white/75" style={{ backgroundColor: inbound ? "#e3f1f7" : "#fdebed" }}><CardContent className="p-6"><Icon className="h-6 w-6" style={{ color: accent }} /><h2 className="mt-7 text-xl font-extrabold">{inbound ? inboundEntry ? "مسار الإدخال" : "مسار الاستلام" : transferMode ? "مسار محضر تركيب وتنسيق" : "مسار اعتماد التسليم"}</h2><div className="mt-6 space-y-4"><p className="text-sm leading-7 text-muted-foreground">{inbound ? inboundEntry ? "إدخال مواد مستعملة مُعادة إلى المستودع. تُدخل مواد التنظيف والقرطاسية من هذا المسار دائمًا." : "استلام مواد جديدة تدخل أول مرة إلى المستودع." : transferMode ? "يشمل المحضر مراجع المجلد والطلب والفاتورة، مع إضافة مواد التركيب والتنسيق قبل الحفظ." : "يشمل النموذج مراجع المجلول والطلب والفاتورة، مع بحث سريع عن المواد قبل الحفظ والاعتماد."}</p></div>{!inbound && <div className="mt-7 flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}><Send className="h-4 w-4" />{transferMode ? "يُحفظ المحضر كعملية تركيب وتنسيق." : "تظهر للمراجع والمدير فقط عمليات الاعتماد."}</div>}</CardContent></Card></section>
//     <AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open) setDeleteTarget(null); }}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle className="text-right">تأكيد الحذف النهائي</AlertDialogTitle><AlertDialogDescription className="text-right leading-7">هل أنت متأكد من حذف المذكرة رقم «{deleteTarget?.memoNumber}» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء، وسيُسمح به لمحاضر التركيب المسودة أو قيد المراجعة فقط، إذا لم تكن مرتبطة بحركة مخزون.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteTarget(null)}>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-red-700 hover:bg-red-800" disabled={deleteMutation.isPending} onClick={() => { if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id }); setDeleteTarget(null); }}>{deleteMutation.isPending ? "جار الحذف…" : "نعم، احذف نهائيًا"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
//   </div>;
// }

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemoPartyPicker } from "@/components/MemoPartyPicker";
import { MemoQuickMaterialDialog } from "@/components/MemoQuickMaterialDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { printMemo } from "@/lib/memoPrint";
import { openPrintWindow } from "@/lib/printWindow";
import { displayCode } from "@/lib/displayCode";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  FilePlus2,
  FileText,
  PackageSearch,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  classifyMemo,
  memoClassificationDescription,
  memoClassificationHasPrice,
  memoClassificationLabel,
  type MemoClassification,
} from "@shared/memoClassification";
import { filterMaterials } from "@shared/materialSearch";
import { filterMemos } from "@shared/memoSearch";

const statusLabel = {
  draft: "مسودة",
  pending_review: "بانتظار المراجعة",
  approved: "معتمدة",
  rejected: "مرفوضة",
  cancelled: "ملغاة",
} as const;
type Line = {
  materialId: string;
  quantity: string;
  unitPrice: string;
  materialName?: string;
  materialUnit?: string;
  materialCode?: string;
  materialNotes?: string;
};
const emptyLine = (): Line => ({
  materialId: "",
  quantity: "1",
  unitPrice: "",
});

export default function MemosPage({
  kind,
  mode = "standard",
  inboundMode = "receipt",
}: {
  kind: "inbound" | "outbound";
  mode?: "standard" | "transfer";
  inboundMode?: "receipt" | "entry";
}) {
  const inbound = kind === "inbound";
  const inboundEntry = inbound && inboundMode === "entry";
  const entryClassification: "new_receipt" | "returned_old" = inboundEntry
    ? "returned_old"
    : "new_receipt";
  const setEntryClassification = (_value?: "new_receipt" | "returned_old") =>
    toast.info(
      "نوع هذه المذكرة محدد من خيار القائمة: الاستلام للمواد الجديدة والإدخال للمواد المُعادة."
    );
  const transferMode = mode === "transfer";
  const accent = inbound ? "#0071ba" : "#d9442f";
  const Icon = inbound ? ArrowDownToLine : ArrowUpFromLine;
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const [open, setOpen] = useState(false);
  const [pickerLine, setPickerLine] = useState<number | null>(null);
  const [quickMaterialOpen, setQuickMaterialOpen] = useState(false);
  const [pendingMaterialName, setPendingMaterialName] = useState<string | null>(
    null
  );
  const materialSearchEnterRef = useRef(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [memoGeneralSearch, setMemoGeneralSearch] = useState("");
  const [memoFinancialSearch, setMemoFinancialSearch] = useState("");
  const [memoSerialSearch, setMemoSerialSearch] = useState("");
  const [printTargetId, setPrintTargetId] = useState<number | null>(null);
  const [printWindow, setPrintWindow] = useState<Window | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    memoNumber: string;
  } | null>(null);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [memoNumber, setMemoNumber] = useState("");
  const [memoDate, setMemoDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [warehouseId, setWarehouseId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [folderNumber, setFolderNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [outboundClassification, setOutboundClassification] = useState<
    "adjustment" | "transfer"
  >(() => (mode === "transfer" ? "transfer" : "adjustment"));
  const [memoNotes, setMemoNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const usePreview = isDevelopment && !isAuthenticated;
  const live = trpc.memos.list.useQuery(
    { type: kind },
    { enabled: isAuthenticated }
  );
  const preview = trpc.memos.previewList.useQuery(
    { type: kind },
    { enabled: usePreview }
  );
  const entityLive = trpc.entities.overview.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const entityPreview = trpc.entities.previewOverview.useQuery(undefined, {
    enabled: usePreview,
  });
  const nextMemoIdLive = trpc.memos.nextMemoId.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const nextMemoIdPreview = trpc.memos.previewNextMemoId.useQuery(undefined, {
    enabled: usePreview,
  });
  const nextSerialLive = trpc.memos.nextSerialNumber.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const nextSerialPreview = trpc.memos.previewNextSerialNumber.useQuery(
    undefined,
    { enabled: usePreview }
  );
  const materialsLive = trpc.materials.list.useQuery(
    { search: materialSearch },
    { enabled: isAuthenticated }
  );
  const materialsPreview = trpc.materials.previewList.useQuery(
    { search: materialSearch },
    { enabled: usePreview }
  );
  const printLive = trpc.memos.details.useQuery(
    { id: printTargetId ?? 1 },
    {
      enabled: Boolean(printTargetId) && isAuthenticated,
      refetchOnMount: "always",
    }
  );
  const printPreview = trpc.memos.previewDetails.useQuery(
    { id: printTargetId ?? 1 },
    {
      enabled: Boolean(printTargetId) && usePreview,
      refetchOnMount: "always",
    }
  );
  const printQuery = usePreview ? printPreview : printLive;
  const editLive = trpc.memos.details.useQuery(
    { id: editTargetId ?? 1 },
    { enabled: Boolean(editTargetId) && isAuthenticated }
  );
  const editPreview = trpc.memos.previewDetails.useQuery(
    { id: editTargetId ?? 1 },
    { enabled: Boolean(editTargetId) && usePreview }
  );
  const editQuery = usePreview ? editPreview : editLive;
  const rows = (usePreview ? preview.data : live.data) ?? [];
  const entities = usePreview ? entityPreview.data : entityLive.data;
  const nextMemoId = usePreview ? nextMemoIdPreview.data : nextMemoIdLive.data;
  const nextSerialNumber = usePreview
    ? nextSerialPreview.data
    : nextSerialLive.data;
  const loadedMaterials =
    (usePreview ? materialsPreview.data : materialsLive.data) ?? [];
  const selectedMaterialCache = lines
    .filter(line => line.materialId && line.materialName)
    .map(line => ({
      id: Number(line.materialId),
      code: line.materialCode ?? "",
      name: line.materialName ?? "",
      description: line.materialNotes ?? null,
      unit: line.materialUnit ?? "",
      barcode: null,
      minimumStock: "0",
      isActive: true,
    }));
  const materials = [
    ...loadedMaterials,
    ...selectedMaterialCache.filter(
      material =>
        !loadedMaterials.some(
          loadedMaterial => loadedMaterial.id === material.id
        )
    ),
  ];
  const filteredMaterials = useMemo(
    () => filterMaterials(materials, { general: materialSearch }),
    [materials, materialSearch]
  );
  const materialQueryIsFetching = usePreview
    ? materialsPreview.isFetching
    : materialsLive.isFetching;
  const memoRows = useMemo(() => {
    const wantedClassification = inbound
      ? inboundEntry
        ? "return"
        : "purchase"
      : transferMode
        ? "transfer"
        : "adjustment";
    const scopedRows = rows.filter(
      memo =>
        (memo.classification ??
          classifyMemo({ type: memo.type, notes: memo.notes })) ===
        wantedClassification
    );
    return filterMemos(scopedRows, {
      general: memoGeneralSearch,
      financialNumber: memoFinancialSearch,
      serialNumber: memoSerialSearch,
    });
  }, [
    inbound,
    inboundEntry,
    memoFinancialSearch,
    memoGeneralSearch,
    memoSerialSearch,
    rows,
    transferMode,
  ]);
  const utils = trpc.useUtils();
  const canCreate =
    isDevelopment ||
    (isAuthenticated &&
      ["data_entry", "warehouse_keeper", "admin"].includes(
        user?.role ?? "user"
      ));
  const canCreateParty =
    isAuthenticated &&
    ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
  const canCreateMaterial =
    isAuthenticated &&
    ["data_entry", "warehouse_keeper", "admin"].includes(user?.role ?? "user");
  const canApprove = isDevelopment || user?.role === "admin";
  const clearForm = () => {
    setMemoNumber("");
    setWarehouseId("");
    setPartyId("");
    setFolderNumber("");
    setOrderNumber("");
    setOrderDate("");
    setInvoiceNumber("");
    setInvoiceDate("");
    setReferenceNumber("");
    setOutboundClassification("adjustment");
    setMemoNotes("");
    setMaterialSearch("");
    setMemoGeneralSearch("");
    setMemoFinancialSearch("");
    setMemoSerialSearch("");
    setLines([emptyLine()]);
  };
  const createMutation = trpc.memos.create.useMutation({
    onSuccess: async () => {
      setOpen(false);
      clearForm();
      await utils.memos.list.invalidate({ type: kind });
      await utils.memos.nextSerialNumber.invalidate();
      await utils.memos.previewNextSerialNumber.invalidate();
      await utils.memos.nextMemoId.invalidate();
      await utils.memos.previewNextMemoId.invalidate();
      toast.success("تم إنشاء المذكرة بنجاح.");
    },
    onError: error => toast.error(error.message || "تعذر إنشاء المذكرة."),
  });
  const updateMutation = trpc.memos.update.useMutation({
    onSuccess: async () => {
      const updatedId = editTargetId;
      setOpen(false);
      setEditTargetId(null);
      clearForm();
      await utils.memos.list.invalidate({ type: kind });
      if (updatedId) {
        await Promise.all([
          utils.memos.details.invalidate({ id: updatedId }),
          utils.memos.previewDetails.invalidate({ id: updatedId }),
        ]);
      }
      toast.success("تم تعديل المذكرة وتحديث المعاينة.");
      window.location.reload();
    },
    onError: error => toast.error(error.message || "تعذر تعديل المذكرة."),
  });
  const approveMutation = trpc.memos.approve.useMutation({
    onSuccess: async () => {
      await utils.memos.list.invalidate({ type: kind });
      await utils.inventory.listBalances.invalidate();
      toast.success("تم اعتماد المذكرة وتحديث الرصيد.");
    },
    onError: error => toast.error(error.message || "تعذر اعتماد المذكرة."),
  });
  const cancelMutation = trpc.memos.cancel.useMutation({
    onSuccess: async () => {
      await utils.memos.list.invalidate({ type: kind });
      toast.success("تم إلغاء المذكرة دون حذف سجلها.");
    },
    onError: error => toast.error(error.message || "تعذر إلغاء المذكرة."),
  });
  const deleteMutation = trpc.memos.delete.useMutation({
    onSuccess: async (_result, variables) => {
      const removeDeleted = (current: typeof rows | undefined) =>
        current?.filter(memo => memo.id !== variables.id);
      utils.memos.list.setData({ type: kind }, removeDeleted);
      utils.memos.previewList.setData({ type: kind }, removeDeleted);
      await utils.memos.list.invalidate({ type: kind });
      toast.success("تم حذف المسودة نهائيًا وإزالتها من الواجهة.");
    },
    onError: error =>
      toast.error(
        error.message ||
          "تعذر الحذف النهائي؛ قد تكون المذكرة مرتبطة بسجل تاريخي."
      ),
  });
  const updateLine = (index: number, update: Partial<Line>) =>
    setLines(current =>
      current.map((line, row) =>
        row === index ? { ...line, ...update } : line
      )
    );
  const selectMaterial = (id: number) => {
    const selectedMaterial = materials.find(material => material.id === id);
    const selectedMaterialDetails = selectedMaterial
      ? {
          materialId: String(id),
          materialName: selectedMaterial.name,
          materialUnit: selectedMaterial.unit,
          materialCode: selectedMaterial.code,
          materialNotes: selectedMaterial.description ?? "",
        }
      : { materialId: String(id) };
    setLines(current => {
      const requestedLine =
        pickerLine !== null && !current[pickerLine]?.materialId
          ? pickerLine
          : -1;
      const emptyLineIndex = current.findIndex(line => !line.materialId);
      const targetLine = requestedLine >= 0 ? requestedLine : emptyLineIndex;
      if (targetLine >= 0)
        return current.map((line, index) =>
          index === targetLine ? { ...line, ...selectedMaterialDetails } : line
        );
      return [...current, { ...emptyLine(), ...selectedMaterialDetails }];
    });
    setPickerLine(null);
    setMaterialSearch("");
  };
  const addCreatedMaterial = (material: {
    id: number;
    code: string;
    name: string;
    unit: string;
  }) => {
    const selectedMaterialDetails = {
      materialId: String(material.id),
      materialName: material.name,
      materialUnit: material.unit,
      materialCode: material.code,
      materialNotes: "",
    };
    setLines(current => {
      const requestedLine =
        pickerLine !== null && !current[pickerLine]?.materialId
          ? pickerLine
          : -1;
      const emptyLineIndex = current.findIndex(line => !line.materialId);
      const targetLine = requestedLine >= 0 ? requestedLine : emptyLineIndex;
      if (targetLine >= 0)
        return current.map((line, index) =>
          index === targetLine ? { ...line, ...selectedMaterialDetails } : line
        );
      return [...current, { ...emptyLine(), ...selectedMaterialDetails }];
    });
    setPickerLine(null);
    setMaterialSearch("");
  };
  const openQuickMaterial = () => {
    if (!canCreateMaterial) {
      toast.error("لا تملك صلاحية إضافة مادة جديدة.");
      return;
    }
    setQuickMaterialOpen(true);
  };
  const requestQuickMaterial = (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) return;
    materialSearchEnterRef.current = true;
    setMaterialSearch(normalizedName);
    const matchingMaterials = filterMaterials(materials, {
      general: normalizedName,
    });
    if (matchingMaterials.length > 0) return;
    openQuickMaterial();
  };
  useEffect(() => {
    if (!printTargetId || !printWindow) return;
    if (printQuery.isError) {
      toast.error(printQuery.error.message || "تعذر تحميل المذكرة للطباعة.");
      printWindow.close();
      setPrintWindow(null);
      setPrintTargetId(null);
      return;
    }
    if (!printQuery.data) return;
    if (!printMemo(printQuery.data, printWindow))
      toast.error("تعذر تجهيز نموذج الطباعة. أعد المحاولة.");
    setPrintWindow(null);
    setPrintTargetId(null);
  }, [
    printQuery.data,
    printQuery.error,
    printQuery.isError,
    printTargetId,
    printWindow,
  ]);
  const startMemoPrint = (id: number) => {
    const page = openPrintWindow("مذكرة رسمية");
    if (!page) {
      toast.error(
        "المتصفح حجب نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة."
      );
      return;
    }
    setPrintWindow(page);
    setPrintTargetId(id);
  };
  const draftClassification: MemoClassification = inbound
    ? inboundEntry
      ? "return"
      : "purchase"
    : transferMode
      ? "transfer"
      : outboundClassification;
  const priceAllowed = memoClassificationHasPrice(draftClassification);
  const hasFinancialNumber = (inbound && !inboundEntry) || transferMode;
  useEffect(() => {
    const memo = editQuery.data;
    if (!editTargetId || !memo) return;
    setMemoNumber(memo.memoNumber);
    setWarehouseId(String(memo.warehouseId ?? ""));
    setPartyId(memo.partyId ? String(memo.partyId) : "");
    setMemoDate(new Date(memo.memoDate).toISOString().slice(0, 10));
    setFolderNumber(memo.folderNumber ?? "");
    setOrderNumber(memo.orderNumber ?? "");
    setOrderDate(
      memo.orderDate ? new Date(memo.orderDate).toISOString().slice(0, 10) : ""
    );
    setInvoiceNumber(memo.invoiceNumber ?? "");
    setInvoiceDate(
      memo.invoiceDate
        ? new Date(memo.invoiceDate).toISOString().slice(0, 10)
        : ""
    );
    setReferenceNumber(memo.referenceNumber ?? "");
    // setMemoNotes(memo.notes ?? "");
    setMemoNotes("");

    setLines(
      memo.items.map(item => ({
        materialId: String(item.materialId),
        quantity: String(item.quantity),
        unitPrice: item.unitPrice ? String(item.unitPrice) : "",
        materialName: item.name,
        materialUnit: item.unit,
        materialCode: item.code,
        materialNotes: item.notes ?? "",
      }))
    );
  }, [editQuery.data, editTargetId]);
  useEffect(() => {
    if (!priceAllowed)
      setLines(current =>
        current.some(line => line.unitPrice)
          ? current.map(line => ({ ...line, unitPrice: "" }))
          : current
      );
  }, [priceAllowed]);
  useEffect(() => {
    if (!open) return;
    const currentWarehouse =
      entities?.warehouses.find(warehouse =>
        warehouse.name.trim().includes("المستودع المركزي")
      ) ??
      entities?.warehouses.find(warehouse =>
        warehouse.name.trim().includes("مركز الحاسب")
      ) ??
      entities?.warehouses.find(
        warehouse => warehouse.isActive && warehouse.kind === "central"
      ) ??
      entities?.warehouses.find(warehouse => warehouse.isActive);
    if (currentWarehouse && !inboundEntry)
      setWarehouseId(current => current || String(currentWarehouse.id));
    if (hasFinancialNumber && nextSerialNumber)
      setMemoNumber(current => current || nextSerialNumber);
  }, [entities?.warehouses, nextSerialNumber, open]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (materialSearchEnterRef.current) {
      materialSearchEnterRef.current = false;
      return;
    }
    const invalidQuantity = lines.some(
      line =>
        line.materialId &&
        (!/^\d+(?:[.,]\d+)?$/.test(line.quantity.trim()) ||
          Number(line.quantity.replace(",", ".")) <= 0)
    );
    if (invalidQuantity) {
      toast.error("أدخل كمية موجبة صحيحة أو عشرية مثل 1 أو 3.5.");
      return;
    }
    const items = lines
      .map(line => ({
        materialId: Number(line.materialId),
        quantity: Number(line.quantity.replace(",", ".")),
        unitPrice:
          priceAllowed && line.unitPrice ? Number(line.unitPrice) : undefined,
        notes: line.materialNotes?.trim() || undefined,
      }))
      .filter(item => item.materialId > 0 && item.quantity > 0);
    const normalizedMemoNumber = memoNumber.trim();
    if (!warehouseId || !normalizedMemoNumber) {
      toast.error("أدخل رقم المذكرة واختر المستودع.");
      return;
    }
    const duplicate = rows.find(
      memo =>
        memo.id !== editTargetId &&
        memo.memoNumber.trim() === normalizedMemoNumber
    );
    if (duplicate) {
      toast.error(
        `رقم المذكرة ${normalizedMemoNumber} موجود مسبقًا في السجل. استخدم زر المعاينة للسجل الموجود بدل إنشاء نسخة مكررة.`
      );
      return;
    }
    if (!items.length) {
      toast.error("اختر مادة واحدة على الأقل مع كمية صحيحة.");
      return;
    }
    const mutationInput = {
      type: kind,
      classification: draftClassification,
      memoNumber: normalizedMemoNumber,
      memoDate: new Date(`${memoDate}T00:00:00`),
      warehouseId: Number(warehouseId),
      partyId: partyId ? Number(partyId) : undefined,
      folderNumber: folderNumber || undefined,
      orderNumber: orderNumber || undefined,
      orderDate: orderDate ? new Date(`${orderDate}T00:00:00`) : undefined,
      invoiceNumber: invoiceNumber || undefined,
      invoiceDate: invoiceDate
        ? new Date(`${invoiceDate}T00:00:00`)
        : undefined,
      referenceNumber: hasFinancialNumber ? normalizedMemoNumber : undefined,
      notes: `${memoClassificationLabel(draftClassification)} — ${memoClassificationDescription(draftClassification)}${memoNotes.trim() ? ` — ${memoNotes.trim()}` : ""}`,
      items,
    };
    if (editTargetId)
      updateMutation.mutate({ id: editTargetId, ...mutationInput });
    else createMutation.mutate(mutationInput);
  };
  const fields = [
    ["الرقم المتسلسل", memoNumber, setMemoNumber, "text"],
    ["التاريخ", memoDate, setMemoDate, "date"],
    ["المستودع", warehouseId, setWarehouseId, "warehouse"],
    ["الجهة / المورد", partyId, setPartyId, "party"],
    ["رقم المجلد", folderNumber, setFolderNumber, "text"],
    ["رقم الطلب", orderNumber, setOrderNumber, "text"],
    ["تاريخ الطلب", orderDate, setOrderDate, "date"],
    ["رقم الفاتورة", invoiceNumber, setInvoiceNumber, "text"],
    ["تاريخ الفاتورة", invoiceDate, setInvoiceDate, "date"],
  ] as const;
  const allowedPartyTypes =
    inbound && !inboundEntry
      ? ["supplier", "both"]
      : ["recipient", "internal", "both"];
  const partyTypeLabel = (type: string) =>
    type === "supplier"
      ? "مورد / مسلم"
      : type === "recipient"
        ? "موظف / مستلم"
        : type === "internal"
          ? "موظف"
          : "مورد ومستلم";
  const activePickerLine = pickerLine ?? 0;
  if (false && open)
    return (
      <div className="memo-page mx-auto max-w-[1500px]" dir="rtl">
        <form
          className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border border-[#86cef0] bg-[#f7fdff] shadow-xl"
          onSubmit={submit}
        >
          <header className="legacy-hero-sky flex shrink-0 items-center justify-between border-b-4 border-[#e34b34] p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold">
                  {inbound
                    ? "مذكرة استلام"
                    : transferMode
                      ? "إنشاء محضر تركيب وتنسيق"
                      : "إنشاء مذكرة تسليم وإخراج"}
                </h1>
                <p className="mt-1 text-xs text-white/85">
                  أدخل بيانات الرأس، ثم اختر الجهة والمواد قبل الحفظ.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/65 bg-white/10 text-white hover:bg-white/20"
            >
              عودة إلى السجل
            </Button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <section className="grid shrink-0 gap-px overflow-hidden rounded-xl border border-[#bce2f3] bg-[#bce2f3] md:grid-cols-4 xl:grid-cols-5">
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  رقم المذكرة
                </Label>
                <Input
                  value={nextMemoId ? String(nextMemoId) : "جار التوليد…"}
                  disabled
                  className="mt-1.5 h-9 border-[#b8ddeb] disabled:bg-slate-100 disabled:text-slate-800"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  الرقم المتسلسل
                </Label>
                <Input
                  required
                  value={memoNumber}
                  onChange={event => setMemoNumber(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">التاريخ</Label>
                <Input
                  required
                  type="date"
                  value={memoDate}
                  onChange={event => setMemoDate(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">المستودع</Label>
                <select
                  required
                  className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold"
                  value={warehouseId}
                  onChange={event => setWarehouseId(event.target.value)}
                >
                  <option value="">اختر المستودع</option>
                  {entities?.warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-white/95 p-2">
                <MemoPartyPicker
                  value={partyId}
                  onChange={setPartyId}
                  canCreate={canCreateParty}
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">رقم المجلد</Label>
                <Input
                  value={folderNumber}
                  onChange={event => setFolderNumber(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">رقم الطلب</Label>
                <Input
                  value={orderNumber}
                  onChange={event => setOrderNumber(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  تاريخ الطلب
                </Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={event => setOrderDate(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  رقم الفاتورة
                </Label>
                <Input
                  value={invoiceNumber}
                  onChange={event => setInvoiceNumber(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  تاريخ الفاتورة
                </Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={event => setInvoiceDate(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
              <div className="bg-white/95 p-2">
                <Label className="text-[11px] text-[#4b7792]">
                  الرقم المالي
                </Label>
                <Input
                  value={referenceNumber}
                  onChange={event => setReferenceNumber(event.target.value)}
                  className="mt-1.5 h-9 border-[#b8ddeb]"
                />
              </div>
            </section>
            <section className="grid min-h-[420px] flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#86cef0] bg-white">
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#eaf8fe] px-4 py-3">
                  <div>
                    <h2 className="font-extrabold text-[#07518e]">
                      مواد المذكرة
                    </h2>
                    <p className="mt-0.5 text-xs text-[#4b7792]">
                      تظهر كل مادة تضيفها كسطر مستقل.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLines(current => [...current, emptyLine()]);
                      setPickerLine(lines.length);
                    }}
                  >
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة مادة
                  </Button>
                </div>
                <div className="memo-items-scroll min-h-0 flex-1 overflow-auto">
                  <table
                    className={`w-full ${priceAllowed ? "min-w-[1000px]" : "min-w-[850px]"} text-right`}
                  >
                    <thead className="bg-[#dff4ff] text-xs text-[#17638d]">
                      <tr>
                        <th className="px-3 py-2">تسلسل</th>
                        <th className="px-3 py-2">الرمز</th>
                        <th className="px-3 py-2">اسم المادة</th>
                        <th className="px-3 py-2">ملاحظات المادة</th>
                        <th className="px-3 py-2">الوحدة</th>
                        <th className="px-3 py-2">الكمية</th>
                        {priceAllowed && <th className="px-3 py-2">السعر</th>}
                        <th className="px-3 py-2">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => {
                        const material = materials.find(
                          item => item.id === Number(line.materialId)
                        );
                        return (
                          <tr key={index} className="border-t border-[#d9eff9]">
                            <td className="px-3 py-2 text-sm">{index + 1}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">
                              {displayCode(material?.code)}
                            </td>
                            <td className="px-3 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 px-1 text-[#07518e]"
                                onClick={() => setPickerLine(index)}
                              >
                                <PackageSearch className="ml-1 h-4 w-4" />
                                {material?.name || "اضغط لاختيار مادة"}
                              </Button>
                            </td>
                            <td className="min-w-[220px] px-3 py-2">
                              <Input
                                className="h-8"
                                value={
                                  line.materialNotes ??
                                  material?.description ??
                                  ""
                                }
                                onChange={event =>
                                  updateLine(index, {
                                    materialNotes: event.target.value,
                                  })
                                }
                                placeholder="أدخل ملاحظات المادة"
                              />
                            </td>
                            <td className="min-w-[220px] px-3 py-2">
                              <Input
                                className="h-8"
                                value={
                                  line.materialNotes ??
                                  material?.description ??
                                  ""
                                }
                                onChange={event =>
                                  updateLine(index, {
                                    materialNotes: event.target.value,
                                  })
                                }
                                placeholder="أدخل ملاحظات المادة"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {material?.unit || ""}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                required
                                type="number"
                                min="0.001"
                                step="0.001"
                                inputMode="decimal"
                                className="h-8 w-28"
                                value={line.quantity}
                                onChange={event =>
                                  updateLine(index, {
                                    quantity: event.target.value,
                                  })
                                }
                              />
                            </td>
                            {priceAllowed && (
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-8 w-28"
                                  value={line.unitPrice}
                                  onChange={event =>
                                    updateLine(index, {
                                      unitPrice: event.target.value,
                                    })
                                  }
                                />
                              </td>
                            )}
                            <td className="px-3 py-2">
                              {lines.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setLines(current =>
                                      current.filter((_, row) => row !== index)
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#bce2f3] bg-[#f7fdff]">
                <div className="shrink-0 border-b border-[#bce2f3] bg-[#eaf8fe] p-3">
                  <h2 className="font-extrabold text-[#07518e]">بحث المواد</h2>
                  <p className="mt-1 text-xs text-[#4b7792]">
                    إذا لم تظهر نتيجة، اضغط Enter لإضافة المادة الجديدة.
                  </p>
                  <div className="relative mt-3">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      className="h-9 pr-9"
                      value={materialSearch}
                      onChange={event => setMaterialSearch(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          requestQuickMaterial(event.currentTarget.value);
                        }
                      }}
                      placeholder="بحث عام بالاسم أو الرمز"
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-2">
                  {filteredMaterials.map(material => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => selectMaterial(material.id)}
                      className="memo-material-row flex w-full items-center justify-between gap-2 rounded-md border-b border-[#d9eff9] px-2 py-2 text-right hover:bg-[#eaf8fe]"
                    >
                      <span className="truncate text-xs font-bold text-[#07518e]">
                        {material.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {displayCode(material.code)}
                      </span>
                    </button>
                  ))}
                  {materialSearch.trim() &&
                    !materialQueryIsFetching &&
                    filteredMaterials.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openQuickMaterial}
                        className="mt-2 h-auto w-full whitespace-normal border-dashed border-[#86cef0] py-3 text-[#07518e]"
                      >
                        إضافة مادة جديدة باسم «{materialSearch.trim()}»
                      </Button>
                    )}
                </div>
              </aside>
            </section>
            <footer className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: accent }}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "جار الحفظ…"
                  : editTargetId
                    ? "حفظ التعديل"
                    : "إنشاء المذكرة"}
              </Button>
            </footer>
          </div>
        </form>
        <MemoQuickMaterialDialog
          open={quickMaterialOpen}
          onOpenChange={setQuickMaterialOpen}
          initialName={materialSearch}
          onMaterialCreated={addCreatedMaterial}
        />
      </div>
    );
  return (
    <div
      className="memo-page mx-auto max-w-[1480px] space-y-6"
      data-inbound-mode={inbound ? inboundMode : undefined}
      dir="rtl"
    >
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: accent }}>
            {inbound
              ? "توريد وإدخال"
              : transferMode
                ? "محضر تركيب وتنسيق"
                : "صرف وتسليم"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {inbound
              ? "مذكرات الاستلام"
              : transferMode
                ? "محضر تركيب وتنسيق"
                : "مذكرات التسليم"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {transferMode
              ? "إدخال محضر تركيب وتنسيق ومواده وفق النموذج التشغيلي القديم."
              : "إدخال المذكرة وموادها ومراجع الفاتورة والطلب وفق النموذج التشغيلي."}
          </p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-xl"
                style={{ backgroundColor: accent }}
              >
                <FilePlus2 className="ml-2 h-4 w-4" />
                {editTargetId
                  ? "تعديل المذكرة"
                  : inbound
                    ? "مذكرة استلام جديدة"
                    : transferMode
                      ? "محضر تركيب وتنسيق جديد"
                      : "مذكرة تسليم جديدة"}
              </Button>
            </DialogTrigger>
            <DialogContent
              dir="rtl"
              className="memo-editor-dialog flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-h-none max-w-[1500px] flex-col overflow-hidden border-[#86cef0] p-0"
            >
              <DialogHeader className="legacy-hero-sky shrink-0 border-b-4 border-[#e34b34] p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="flex items-center gap-3 text-right text-xl">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    {inbound
                      ? "مذكرة استلام"
                      : transferMode
                        ? "إنشاء محضر تركيب وتنسيق"
                        : "إنشاء مذكرة تسليم وإخراج"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    نموذج إنشاء أو تعديل المذكرة وموادها.
                  </DialogDescription>
                  <Button
                    form="memo-form"
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    style={{ backgroundColor: accent }}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "جار الحفظ…"
                      : editTargetId
                        ? "حفظ التعديل"
                        : "إنشاء المذكرة"}
                  </Button>
                </div>
              </DialogHeader>
              <form
                id="memo-form"
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-4"
                onSubmit={submit}
              >
                <div className="grid shrink-0 gap-px overflow-hidden rounded-xl border border-[#bce2f3] bg-[#bce2f3] md:grid-cols-4 xl:grid-cols-5">
                  {fields.map(([label, value, setValue, type]) => (
                    <div key={label} className="bg-white/95 p-2">
                      <Label className="text-[11px] text-[#4b7792]">
                        {label}
                      </Label>
                      {type === "warehouse" ? (
                        <select
                          required
                          disabled={!inboundEntry}
                          className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-700"
                          value={value}
                          onChange={event => setValue(event.target.value)}
                        >
                          <option value="">اختر المستودع</option>
                          {entities?.warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      ) : type === "party" ? (
                        <MemoPartyPicker
                          value={partyId}
                          onChange={setPartyId}
                          canCreate={canCreateParty}
                        />
                      ) : (
                        <Input
                          required={label === "الرقم المتسلسل"}
                          type={type}
                          value={value}
                          onChange={event => setValue(event.target.value)}
                          className="mt-1.5 h-9 border-[#b8ddeb]"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid shrink-0 gap-2 rounded-xl border border-[#bce2f3] bg-[#f7fdff] p-3 md:grid-cols-2">
                  <div className="hidden">
                    <Label className="text-[11px] text-[#4b7792]">
                      نوع العملية
                    </Label>
                    {inbound ? (
                      <select
                        className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold"
                        value={entryClassification}
                        onChange={event =>
                          setEntryClassification(
                            event.target.value as "new_receipt" | "returned_old"
                          )
                        }
                      >
                        <option value="new_receipt">
                          استلام مواد جديدة — تدخل أول مرة للمستودع
                        </option>
                        <option value="returned_old">
                          إدخال مواد قديمة — مواد مُرجعة
                        </option>
                      </select>
                    ) : transferMode ? (
                      <div className="mt-1.5 flex h-9 items-center rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold">
                        تركيب وتنسيق
                      </div>
                    ) : (
                      <select
                        className="mt-1.5 h-9 w-full rounded-md border border-[#b8ddeb] bg-white px-2 text-sm font-semibold"
                        value={outboundClassification}
                        onChange={event =>
                          setOutboundClassification(
                            event.target.value as "adjustment" | "transfer"
                          )
                        }
                      >
                        <option value="adjustment">تسليم — بلا سعر</option>
                        <option value="transfer">تركيب وتنسيق</option>
                      </select>
                    )}
                    <p className="mt-1 text-[10px] text-[#4b7792]">
                      {memoClassificationDescription(draftClassification)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#4b7792]">
                      ملاحظات
                    </Label>
                    <Input
                      className="mt-1.5 h-9 border-[#b8ddeb]"
                      value={memoNotes}
                      onChange={event => setMemoNotes(event.target.value)}
                      placeholder="ملاحظات اختيارية"
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                  <Badge className="border-0 bg-[#e9f8ff] px-3 py-1.5 text-[#07518e] hover:bg-[#e9f8ff]">
                    {inbound
                      ? "مذكرة إدخال"
                      : transferMode
                        ? "محضر تركيب وتنسيق"
                        : "مذكرة تسليم"}
                  </Badge>
                </div>
                <div className="grid min-h-[360px] flex-none gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border-2 border-[#86cef0] bg-white">
                    <div className="flex shrink-0 flex-col gap-2 bg-[#eaf8fe] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-extrabold text-[#07518e]">
                          مواد المذكرة
                        </h3>
                        <p className="mt-0.5 text-xs text-[#4b7792]">
                          تظهر المواد المختارة هنا مباشرة، ويمكن تمرير القائمة
                          عند زيادة المواد.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLines(current => [...current, emptyLine()]);
                          setPickerLine(lines.length);
                        }}
                      >
                        <Plus className="ml-1 h-4 w-4" />
                        إضافة مادة
                      </Button>
                    </div>
                    <div className="memo-items-scroll min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-contain bg-white">
                      <table
                        className={`w-full ${priceAllowed ? "min-w-[800px]" : "min-w-[650px]"} text-right`}
                      >
                        <thead className="bg-[#dff4ff] text-xs text-[#17638d]">
                          <tr>
                            <th className="px-3 py-2">تسلسل</th>
                            <th className="px-3 py-2">الرمز</th>
                            <th className="px-3 py-2">اسم المادة</th>
                            <th className="px-3 py-2">ملاحظات المادة</th>
                            <th className="px-3 py-2">الوحدة</th>
                            <th className="px-3 py-2">الكمية</th>
                            {priceAllowed && (
                              <th className="px-3 py-2">السعر</th>
                            )}
                            <th className="px-3 py-2">إجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.length === 0 ? (
                            <tr>
                              <td
                                colSpan={priceAllowed ? 7 : 6}
                                className="h-28 px-3 py-8 text-center text-sm font-semibold text-[#4b7792]"
                              >
                                لم تتم إضافة أي مادة بعد. اختر «إضافة مادة» ثم
                                اضغط على مادة من لوحة البحث.
                              </td>
                            </tr>
                          ) : (
                            lines.map((line, index) => {
                              const material = materials.find(
                                item => item.id === Number(line.materialId)
                              );
                              return (
                                <tr
                                  key={index}
                                  className="border-t border-[#d9eff9]"
                                >
                                  <td className="px-3 py-2 text-sm">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-muted-foreground">
                                    {displayCode(material?.code)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-8 px-1 text-[#07518e]"
                                      onClick={() => setPickerLine(index)}
                                    >
                                      <PackageSearch className="ml-1 h-4 w-4" />
                                      {material?.name || "اضغط لاختيار مادة"}
                                    </Button>
                                  </td>
                                  <td className="min-w-[220px] px-3 py-2">
                                    <Input
                                      className="h-8"
                                      value={
                                        line.materialNotes ??
                                        material?.description ??
                                        ""
                                      }
                                      onChange={event =>
                                        updateLine(index, {
                                          materialNotes: event.target.value,
                                        })
                                      }
                                      placeholder="أدخل ملاحظات المادة"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {material?.unit || ""}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      required
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      inputMode="decimal"
                                      pattern="[0-9]*"
                                      className="h-8 w-28"
                                      value={line.quantity}
                                      onChange={event =>
                                        updateLine(index, {
                                          quantity: event.target.value,
                                        })
                                      }
                                    />
                                  </td>
                                  {priceAllowed && (
                                    <td className="px-3 py-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="h-8 w-28"
                                        value={line.unitPrice}
                                        onChange={event =>
                                          updateLine(index, {
                                            unitPrice: event.target.value,
                                          })
                                        }
                                      />
                                    </td>
                                  )}
                                  <td className="px-3 py-2">
                                    {lines.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          setLines(current =>
                                            current.filter(
                                              (_, row) => row !== index
                                            )
                                          )
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <aside
                    className="flex min-h-[320px] min-h-0 flex-col overflow-hidden rounded-xl border border-[#bce2f3] bg-[#f7fdff]"
                    aria-label="البحث عن مادة"
                  >
                    <div className="shrink-0 border-b border-[#bce2f3] bg-[#eaf8fe] p-3">
                      <h3 className="font-extrabold text-[#07518e]">
                        بحث المواد
                      </h3>
                      <p className="mt-1 text-xs text-[#4b7792]">
                        اختر السطر ثم اضغط المادة لإضافتها مباشرة.
                      </p>
                      <div className="relative mt-3">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="h-9 pr-9"
                          value={materialSearch}
                          onChange={event =>
                            setMaterialSearch(event.target.value)
                          }
                          placeholder="بحث عام بالاسم أو الرمز"
                        />
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-2">
                      {filteredMaterials.map(material => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => selectMaterial(material.id)}
                          className="memo-material-row flex w-full items-center justify-between gap-2 rounded-md border-b border-[#d9eff9] px-2 py-2 text-right hover:bg-[#eaf8fe]"
                        >
                          <span className="truncate text-xs font-bold text-[#07518e]">
                            {material.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {displayCode(material.code)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
                <div className="flex shrink-0 justify-end gap-2">
                  <Button
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    style={{ backgroundColor: accent }}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "جار الحفظ…"
                      : editTargetId
                        ? "حفظ التعديل"
                        : inbound
                          ? "إنشاء مذكرة الاستلام"
                          : transferMode
                            ? "حفظ محضر تركيب وتنسيق"
                            : "إرسال للمراجعة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </section>
      <Dialog
        open={pickerLine !== null}
        onOpenChange={visible => {
          if (!visible) {
            setPickerLine(null);
            setMaterialSearch("");
          }
        }}
      >
        <DialogContent
          dir="rtl"
          className="h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-h-none max-w-5xl overflow-hidden border-[#86cef0] p-0"
        >
          <DialogHeader className="shrink-0 border-b border-[#bce2f3] bg-[#effbff] px-6 py-4">
            <DialogTitle className="text-right text-xl text-[#07518e]">
              اختيار مادة للمذكرة
            </DialogTitle>
            <DialogDescription className="sr-only">
              ابحث عن مادة واخترها لإضافتها إلى سطر المذكرة.
            </DialogDescription>
            <p className="mt-1 text-xs text-[#4b7792]">
              اكتب للبحث، ثم اضغط على صف المادة فقط لإضافتها إلى البند.
            </p>
          </DialogHeader>
          <div className="p-5">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                className="pr-9"
                value={materialSearch}
                onChange={event => setMaterialSearch(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    requestQuickMaterial(event.currentTarget.value);
                  }
                }}
                placeholder="بحث عام بالاسم أو الرمز أو الباركود"
              />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-right">
                <thead className="bg-[#dff4ff] text-xs text-[#17638d]">
                  <tr>
                    <th className="px-3 py-3">الرمز</th>
                    <th className="px-3 py-3">اسم المادة</th>
                    <th className="px-3 py-3">الوحدة</th>
                    <th className="px-3 py-3">الباركود</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map(material => (
                    <tr
                      key={material.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => selectMaterial(material.id)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectMaterial(material.id);
                        }
                      }}
                      className="memo-material-row border-t border-[#d9eff9]"
                    >
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {displayCode(material.code)}
                      </td>
                      <td className="px-3 py-3 font-bold">{material.name}</td>
                      <td className="px-3 py-3 text-sm">{material.unit}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {material.barcode || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="soft-shadow border-white/75 bg-white/85">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="font-extrabold">سجل المذكرات</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  البحث هنا يصفّي رأس المذكرة كاملًا، وليس موادها فقط.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {hasFinancialNumber && (
                  <Input
                    value={memoFinancialSearch}
                    onChange={event =>
                      setMemoFinancialSearch(event.target.value)
                    }
                    placeholder="بحث بالرقم المالي للمذكرة"
                    aria-label="بحث بالرقم المالي للمذكرة"
                  />
                )}
                <Input
                  value={memoSerialSearch}
                  onChange={event => setMemoSerialSearch(event.target.value)}
                  placeholder="بحث بالرقم المتسلسل للمذكرة"
                  aria-label="بحث بالرقم المتسلسل للمذكرة"
                />
                <Input
                  value={memoGeneralSearch}
                  onChange={event => setMemoGeneralSearch(event.target.value)}
                  placeholder="بحث عام برقم أو تاريخ أو جهة المذكرة"
                  aria-label="بحث عام في المذكرات"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-right">
                <thead className="bg-slate-50/80 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">الرقم</th>
                    <th className="px-5 py-3">الجهة</th>
                    <th className="px-5 py-3">المستودع</th>
                    <th className="px-5 py-3">التاريخ</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {memoRows.map(memo => (
                    <tr
                      key={memo.id}
                      className="border-t border-slate-100 text-sm"
                    >
                      <td className="px-5 py-4 font-bold">{memo.memoNumber}</td>
                      <td className="px-5 py-4">{memo.partyName || ""}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {memo.warehouseName}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(memo.memoDate).toLocaleDateString("ar")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={
                            memo.status === "approved"
                              ? "border-0 bg-[#e8f2e8] text-[#39744b]"
                              : "border-0 bg-[#fff1dc] text-[#a4650b]"
                          }
                        >
                          {statusLabel[memo.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {canCreate &&
                          (memo.status === "draft" ||
                            memo.status === "pending_review") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditTargetId(memo.id);
                                setOpen(true);
                              }}
                            >
                              <FileText className="ml-1 h-3.5 w-3.5" />
                              تعديل
                            </Button>
                          )}

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={printTargetId === memo.id}
                          onClick={() => startMemoPrint(memo.id)}
                        >
                          <FileText className="ml-1 h-3.5 w-3.5" />
                          {printTargetId === memo.id
                            ? "جار التجهيز…"
                            : "معاينة"}
                        </Button>
                        {canApprove &&
                          memo.status !== "approved" &&
                          memo.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate({ id: memo.id })
                              }
                            >
                              <CheckCircle2 className="ml-1 h-3.5 w-3.5 text-[#39744b]" />
                              اعتماد
                            </Button>
                          )}
                        {canApprove &&
                          memo.status !== "approved" &&
                          memo.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancelMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `إلغاء المذكرة ${memo.memoNumber}؟ سيبقى سجلها محفوظًا.`
                                  )
                                )
                                  cancelMutation.mutate({ id: memo.id });
                              }}
                            >
                              <Trash2 className="ml-1 h-3.5 w-3.5 text-destructive" />
                              إلغاء
                            </Button>
                          )}
                        {canApprove &&
                          (memo.status === "draft" ||
                            memo.status === "pending_review") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={() =>
                                setDeleteTarget({
                                  id: memo.id,
                                  memoNumber: memo.memoNumber,
                                })
                              }
                            >
                              <Trash2 className="ml-1 h-3.5 w-3.5 text-red-700" />
                              حذف نهائي
                            </Button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card
          className="soft-shadow border-white/75"
          style={{ backgroundColor: inbound ? "#e3f1f7" : "#fdebed" }}
        >
          <CardContent className="p-6">
            <Icon className="h-6 w-6" style={{ color: accent }} />
            <h2 className="mt-7 text-xl font-extrabold">
              {inbound
                ? inboundEntry
                  ? "مسار الإدخال"
                  : "مسار الاستلام"
                : transferMode
                  ? "مسار محضر تركيب وتنسيق"
                  : "مسار اعتماد التسليم"}
            </h2>
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                {inbound
                  ? inboundEntry
                    ? "إدخال مواد مستعملة مُعادة إلى المستودع. تُدخل مواد التنظيف والقرطاسية من هذا المسار دائمًا."
                    : "استلام مواد جديدة تدخل أول مرة إلى المستودع."
                  : transferMode
                    ? "يشمل المحضر مراجع المجلد والطلب والفاتورة، مع إضافة مواد التركيب والتنسيق قبل الحفظ."
                    : "يشمل النموذج مراجع المجلول والطلب والفاتورة، مع بحث سريع عن المواد قبل الحفظ والاعتماد."}
              </p>
            </div>
            {!inbound && (
              <div
                className="mt-7 flex items-center gap-2 text-sm font-semibold"
                style={{ color: accent }}
              >
                <Send className="h-4 w-4" />
                {transferMode
                  ? "يُحفظ المحضر كعملية تركيب وتنسيق."
                  : "تظهر للمراجع والمدير فقط عمليات الاعتماد."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف النهائي
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              هل أنت متأكد من حذف المذكرة رقم «{deleteTarget?.memoNumber}»
              نهائيًا؟ لا يمكن التراجع عن هذا الإجراء، وسيُسمح به لمحاضر التركيب
              المسودة أو قيد المراجعة فقط، إذا لم تكن مرتبطة بحركة مخزون.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget)
                  deleteMutation.mutate({ id: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              {deleteMutation.isPending ? "جار الحذف…" : "نعم، احذف نهائيًا"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
