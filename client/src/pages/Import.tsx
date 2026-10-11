import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";

const categories = [
  { value: "materials", name: "دليل المواد", files: "INVENTRY.xls", fields: "الرمز، الاسم، الوحدة، الحد الأدنى" },
  { value: "balances", name: "أرصدة المخزون", files: "DETINVENTRY.xls", fields: "الموقع، الرصيد الافتتاحي والحالي" },
  { value: "memos", name: "المذكرات", files: "MSTBIL*.xls + DETBIL*.xls", fields: "رؤوس المذكرات وبنودها المترابطة" },
  { value: "parties", name: "الجهات", files: "MOUARIDIN.xls + NAMEKOU.xls", fields: "الجهات والمستودعات" },
] as const;
type Category = (typeof categories)[number]["value"];

type CommitResult = { inserted: number; skipped: number; unresolved: number; summary: string };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ImportPage() {
  const [category, setCategory] = useState<Category>("materials");
  const [file, setFile] = useState<File | null>(null);
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const { user } = useAuth();
  const canImport = user?.role === "admin";
  const validate = trpc.imports.validate.useMutation({ onError: error => toast.error(error.message || "تعذر فحص الملف.") });
  const validateMemos = trpc.imports.validateMemos.useMutation({ onError: error => toast.error(error.message || "تعذر فحص ملفي المذكرات.") });
  const commit = trpc.imports.commit.useMutation({ onSuccess: result => { setCommitResult(result); toast.success("تم اعتماد الدفعة التراكمية من دون تعديل السجلات القائمة."); }, onError: error => toast.error(error.message || "تعذر اعتماد الدفعة.") });
  const commitMemos = trpc.imports.commitMemos.useMutation({ onSuccess: result => { setCommitResult({ inserted: result.inserted, skipped: result.skipped, unresolved: result.unresolved, summary: result.summary }); toast.success("تم اعتماد المذكرات المترابطة برأس واحد لكل رقم."); }, onError: error => toast.error(error.message || "تعذر اعتماد ملفات المذكرات.") });
  const handleCategory = (next: Category) => { setCategory(next); setFile(null); setItemFile(null); setCommitResult(null); validate.reset(); validateMemos.reset(); };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (category === "memos") {
      const header = selected.find(candidate => candidate.name.toUpperCase().includes("MSTBIL")) ?? selected[0] ?? null;
      const items = selected.find(candidate => candidate.name.toUpperCase().includes("DETBIL")) ?? selected.find(candidate => candidate !== header) ?? null;
      setFile(header); setItemFile(items);
    } else { setFile(selected[0] ?? null); setItemFile(null); }
  };
  const inspect = async () => {
    if (!file) { toast.error("اختر ملف Excel أولًا."); return; }
    if (category === "memos") {
      if (!itemFile) { toast.error("اختر ملف الرؤوس وملف البنود معًا."); return; }
      try { setCommitResult(null); validateMemos.mutate({ headerBase64: await toBase64(file), itemBase64: await toBase64(itemFile) }); } catch { toast.error("تعذر قراءة ملفي المذكرات على المتصفح."); }
      return;
    }
    try { setCommitResult(null); validate.mutate({ category, base64: await toBase64(file) }); } catch { toast.error("تعذر قراءة الملف على المتصفح."); }
  };
  const approveBatch = async () => {
    if (category === "memos") {
      if (!file || !itemFile || !validateMemos.data?.isValid) { toast.error("افحص ملفي الرؤوس والبنود أولًا."); return; }
      const source = `${file.name} ${itemFile.name}`.toUpperCase().includes("CST") ? "CST" : "SRC";
      try { commitMemos.mutate({ source, headerBase64: await toBase64(file), itemBase64: await toBase64(itemFile), headerFilename: file.name, itemFilename: itemFile.name }); } catch { toast.error("تعذر قراءة ملفي المذكرات على المتصفح."); }
      return;
    }
    if (!file || !validate.data?.isValid) { toast.error("افحص الملف أولًا وتأكد من مطابقته للأعمدة المطلوبة."); return; }
    try { commit.mutate({ category, base64: await toBase64(file), filename: file.name }); } catch { toast.error("تعذر قراءة الملف على المتصفح."); }
  };
  const result = validate.data;
  const memoResult = validateMemos.data;
  const busy = validate.isPending || validateMemos.isPending || commit.isPending || commitMemos.isPending;
  return <div className="mx-auto max-w-[1200px] space-y-6" dir="rtl">
    <section><p className="text-sm font-semibold text-[#17698a]">ترحيل النظام السابق</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">استيراد البيانات التاريخية</h1><p className="mt-2 text-sm text-muted-foreground">تُفحَص الملفات في الخادم قبل السماح بالاعتماد. لا يتم حذف أو تحديث أي سجل تاريخي.</p></section>
    <section className="grid gap-4 md:grid-cols-2">{categories.map(item => <button key={item.value} onClick={() => handleCategory(item.value)} className={`rounded-2xl border p-5 text-right transition-colors ${category === item.value ? "border-[#8ec3d7] bg-[#eef8fc]" : "border-white/75 bg-white/85"}`}><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f1f7] text-[#17698a]"><FileSpreadsheet className="h-5 w-5" /></div><Badge className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100">{item.value === category ? "محدد" : "اختيار"}</Badge></div><h2 className="mt-5 font-extrabold">{item.name}</h2><p className="mt-2 text-xs text-muted-foreground">{item.files}</p><p className="mt-3 text-xs leading-6 text-muted-foreground">{item.fields}</p></button>)}</section>
    <Card className="soft-shadow border-dashed border-[#b7d4e0] bg-[#f6fbfd]/80"><CardContent className="p-8 text-center"><Upload className="mx-auto h-8 w-8 text-[#17698a]" /><h2 className="mt-4 text-lg font-extrabold">معاينة ملف الاستيراد</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{category === "memos" ? "اختر ملفي MSTBIL للرؤوس وDETBIL للبنود معًا. لن يعتمد النظام رأسًا بلا بنود." : "يدعم النظام XLS وXLSX وCSV. لا يتم إدخال أي صف أثناء هذه المعاينة."}</p><input id="import-file" type="file" multiple={category === "memos"} className="sr-only" accept=".xls,.xlsx,.csv" onChange={handleFile} /><label htmlFor="import-file" className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#17698a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#125875]"><Upload className="ml-2 h-4 w-4" />اختيار ملف{category === "memos" ? "ين" : ""}</label>{file && <div className="mx-auto mt-5 max-w-md rounded-xl bg-white p-3 text-right text-sm font-semibold"><div className="flex items-center gap-3"><FileSpreadsheet className="h-4 w-4 shrink-0 text-[#17698a]" /><span className="truncate">الرؤوس: {file.name}</span></div>{itemFile && <div className="mt-2 flex items-center gap-3"><FileSpreadsheet className="h-4 w-4 shrink-0 text-[#17698a]" /><span className="truncate">البنود: {itemFile.name}</span></div>}<button onClick={() => { setFile(null); setItemFile(null); }} className="mt-2 rounded-lg p-1 text-muted-foreground hover:bg-slate-100"><X className="h-4 w-4" /></button></div>}<Button disabled={!canImport || busy} onClick={inspect} className="mt-5 rounded-xl bg-[#17698a] hover:bg-[#125875]"><CheckCircle2 className="ml-2 h-4 w-4" />{busy ? "جار المعالجة…" : "فحص الأعمدة والصفوف"}</Button>{!canImport && <p className="mt-3 text-xs text-muted-foreground">يتطلب تنفيذ الاستيراد دور المدير.</p>}</CardContent></Card>
    {result && category !== "memos" && <Card className="border-white/75 bg-white/85"><CardContent className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-extrabold">نتيجة الفحص</h2><p className="mt-1 text-sm text-muted-foreground">ورقة: {result.sheetName} — {result.totalRows.toLocaleString("ar")} صف</p></div><Badge className={result.isValid ? "border-0 bg-[#e8f2e8] text-[#39744b] hover:bg-[#e8f2e8]" : "border-0 bg-[#fdebed] text-[#ab5062] hover:bg-[#fdebed]"}>{result.isValid ? "جاهز للاعتماد" : "يحتاج تصحيحًا"}</Badge></div>{result.missingColumns.length > 0 ? <p className="mt-5 rounded-xl bg-[#fdebed] p-3 text-sm text-[#ab5062]">الأعمدة المفقودة: {result.missingColumns.join("، ")}</p> : <><p className="mt-5 rounded-xl bg-[#e8f2e8] p-3 text-sm text-[#39744b]">تطابق الأعمدة المطلوبة. سيُضاف الجديد فقط ويُتجاوز المكرر.</p><Button disabled={!canImport || busy} onClick={approveBatch} className="mt-4 bg-[#17698a] hover:bg-[#125875]"><CheckCircle2 className="ml-2 h-4 w-4" />اعتماد الدفعة التراكمية</Button></>}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[580px] text-right text-xs"><thead className="bg-slate-50 text-muted-foreground"><tr>{result.columns.slice(0, 8).map((column: string) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr></thead><tbody>{result.sample.map((row: Record<string, unknown>, index: number) => <tr key={index} className="border-t border-slate-100">{result.columns.slice(0, 8).map((column: string) => <td key={column} className="max-w-44 truncate px-3 py-2">{String(row[column] ?? "")}</td>)}</tr>)}</tbody></table></div></CardContent></Card>}
    {memoResult && category === "memos" && <Card className="border-white/75 bg-white/85"><CardContent className="p-6"><h2 className="font-extrabold">نتيجة فحص ملفات المذكرات</h2><p className="mt-2 text-sm text-muted-foreground">الرؤوس: {memoResult.headers.totalRows.toLocaleString("ar")} — البنود: {memoResult.items.totalRows.toLocaleString("ar")} — أرقام الرؤوس الفريدة: {memoResult.headerNumbers.toLocaleString("ar")}</p><p className={`mt-4 rounded-xl p-3 text-sm ${memoResult.isValid ? "bg-[#e8f2e8] text-[#39744b]" : "bg-[#fdebed] text-[#ab5062]"}`}>{memoResult.isValid ? "الملفات مترابطة وجاهزة للاعتماد: سيُعتمد رأس واحد لكل رقم وتُضم إليه البنود." : `تحتاج معالجة قبل الاعتماد. بنود غير مرتبطة: ${memoResult.unresolvedItems}`}</p><Button disabled={!canImport || busy || !memoResult.isValid} onClick={approveBatch} className="mt-4 bg-[#17698a] hover:bg-[#125875]"><CheckCircle2 className="ml-2 h-4 w-4" />اعتماد المذكرات المترابطة</Button></CardContent></Card>}
    {commitResult && <Card className="border-[#b8dfc1] bg-[#f1fbf2]"><CardContent className="p-5"><h2 className="font-extrabold text-[#39744b]">تم اعتماد الدفعة التراكمية</h2><p className="mt-2 text-sm text-[#39744b]">{commitResult.summary}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white p-3 text-sm">سجلات جديدة: <strong>{commitResult.inserted.toLocaleString("ar")}</strong></div><div className="rounded-lg bg-white p-3 text-sm">متجاوزة مكررة: <strong>{commitResult.skipped.toLocaleString("ar")}</strong></div><div className="rounded-lg bg-white p-3 text-sm">غير مرتبطة: <strong>{commitResult.unresolved.toLocaleString("ar")}</strong></div></div></CardContent></Card>}
  </div>;
}
