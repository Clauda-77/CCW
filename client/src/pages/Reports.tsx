import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { printOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { formatPrintNumber } from "@/lib/printNumber";
import { CalendarRange, Download, FileDown, FileSpreadsheet, FileText, Printer, TableProperties } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ReportKind = "inbound" | "outbound" | "inventory" | "movement" | "movementActive";
type ReportBalanceRow = { code: string; name: string; description: string | null; unit: string; warehouseName: string; partyName: string | null; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string };
const labels: Record<ReportKind, string> = { inbound: "يومية الإدخالات", outbound: "يومية الإخراجات", inventory: "جدول الجرد", movement: "طباعة شهرية — المتحركة والثابتة", movementActive: "طباعة شهرية — المتحركة فقط" };
const icons: Record<ReportKind, typeof FileText> = { inbound: FileDown, outbound: FileDown, inventory: TableProperties, movement: FileSpreadsheet, movementActive: FileSpreadsheet };
const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export const formatWholeQuantity = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : "";
};

export function buildExcelCompatibleCsv(header: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [header, ...rows].map(row => row.map(escapeCsv).join(",")).join("\n");
}

export function buildExcelWorkbook(header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet["!rtl"] = true;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

function downloadExcel(filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  if (!rows.length) { toast.error("لا توجد بيانات ضمن التقرير المحدد."); return; }
  const workbook = buildExcelWorkbook(header, rows);
  const blob = new Blob([workbook], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("تم تنزيل التقرير بصيغة Excel.");
}

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const dev = import.meta.env.DEV;
  const [kind, setKind] = useState<ReportKind>("inbound");
  const [from, setFrom] = useState("2012-01-01");
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const showJournal = kind === "inbound" || kind === "outbound";
  const showBalances = kind === "inventory" || kind === "movement" || kind === "movementActive";
  const dateInput = useMemo(() => ({ fromDate: new Date(`${from}T00:00:00`), toDate: new Date(`${to}T23:59:59.999`) }), [from, to]);
  const journalInput = useMemo(() => ({ ...dateInput, type: kind === "outbound" ? "outbound" as const : "inbound" as const }), [dateInput, kind]);
  const balancesLive = trpc.inventory.listBalances.useQuery(dateInput, { enabled: isAuthenticated && !dev && showBalances });
  const balancesPreview = trpc.inventory.previewBalances.useQuery(dateInput, { enabled: dev && showBalances });
  const journalLive = trpc.reports.journalLines.useQuery(journalInput, { enabled: isAuthenticated && !dev && showJournal });
  const journalPreview = trpc.reports.previewJournalLines.useQuery(journalInput, { enabled: dev && showJournal });
  const balances = ((dev ? balancesPreview : balancesLive).data?.rows ?? []) as ReportBalanceRow[];
  const journal = (dev ? journalPreview : journalLive).data ?? [];
  const date = (value: Date | string) => new Date(value).toLocaleDateString("ar");
  const term = search.trim().toLowerCase();
  const journalRows = useMemo(() => journal.filter(line => `${line.memoNumber} ${displayCode(line.materialCode)} ${line.materialName} ${line.materialDescription ?? ""} ${line.partyName ?? ""} ${line.warehouseName}`.toLowerCase().includes(term)), [journal, term]);
  const balanceRows = useMemo(() => balances.filter(row => `${displayCode(row.code)} ${row.name} ${row.warehouseName} ${row.partyName ?? ""}`.toLowerCase().includes(term)), [balances, term]);
  const movementRows = balanceRows;
  const movementActiveRows = useMemo(() => balanceRows.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0), [balanceRows]);

  const columns = kind === "inbound"
    ? ["التسلسل", "رقم مذكرة الاستلام", "تاريخ مذكرة الاستلام", "رقم المادة", "اسم المواد", "المواصفات العينية", "الوحدة", "العدد", "ملاحظات"]
    : kind === "outbound"
      ? ["التسلسل", "رقم مذكرة التسليم أو الإخراج", "تاريخ مذكرة التسليم أو الإخراج", "رمز المادة", "نوع المادة", "المواصفات", "الوحدة", "العدد", "الجهة المستلمة", "ملاحظات"]
      : kind === "inventory"
        ? ["رقم الجرد", "رمز المادة", "اسم المادة", "أوصافها", "الوحدة", "السعر", "وحدة الرصيد الدفتري", "عدد الرصيد الدفتري", "وحدة الجرد الفعلي", "عدد الجرد الفعلي", "بالزيادة", "بالنقص", "رأي أمين المستودع", "رأي رئيس المستودع", "ملاحظات"]
        : ["متسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول الشهر", "الاستلام", "الإدخال", "الإخراجات", "الرصيد", "ملاحظات"];

  const rows: Array<Array<string | number | null | undefined>> = kind === "inbound"
    ? journalRows.map((line, index) => [index + 1, line.memoNumber, date(line.memoDate), displayCode(line.materialCode), line.materialName, line.materialDescription || "", line.unit, formatPrintNumber(line.quantity), line.notes || ""])
    : kind === "outbound"
      ? journalRows.map((line, index) => [index + 1, line.memoNumber, date(line.memoDate), displayCode(line.materialCode), line.materialName, line.materialDescription || "", line.unit, line.quantity, line.partyName || "", line.notes || ""])
      : kind === "inventory"
        ? balanceRows.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""])
        : (kind === "movementActive" ? movementActiveRows : movementRows).map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);

  const printRows = kind === "inbound"
    ? journalRows.map((line, index) => [index + 1, line.memoNumber, date(line.memoDate), displayCode(line.materialCode), line.materialName, line.materialDescription || "", line.unit, formatPrintNumber(line.quantity), line.notes || ""])
    : kind === "outbound"
      ? journalRows.map((line, index) => [index + 1, line.memoNumber, date(line.memoDate), displayCode(line.materialCode), line.materialName, line.materialDescription || "", line.unit, line.quantity, line.partyName || "", line.notes || ""])
      : kind === "inventory"
        ? rows
        : rows;
  const range = kind === "movement" || kind === "movementActive" ? `كشف حركة المواد من ${from} إلى ${to}` : `من ${from} إلى ${to}`;
  const printType: OfficialReportType = kind === "inbound" ? "inboundJournal" : kind === "outbound" ? "outboundJournal" : kind === "inventory" ? "inventory" : "monthlyMovement";
  const loading = showBalances ? (dev ? balancesPreview : balancesLive).isLoading : (dev ? journalPreview : journalLive).isLoading;

  const print = () => {
    if (!printOfficialReport({ title: labels[kind], dateRange: range, rows: printRows, type: printType })) {
      toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
    }
  };

  const reportTableHead = () => {
    if (kind === "inbound") return <thead><tr><th rowSpan={2}>الرقم<br />المتسلسل</th><th colSpan={2}>مذكرة الاستلام</th><th rowSpan={2}>رقم<br />المادة</th><th colSpan={2}>المواد</th><th colSpan={2}>الكميات</th><th rowSpan={2}>ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>اسم المواد</th><th>المواصفات العينية</th><th>الوحدة</th><th>العدد</th></tr></thead>;
    if (kind === "outbound") return <thead><tr><th rowSpan={2}>الرقم<br />المتسلسل</th><th colSpan={2}>مذكرة التسليم أو الإخراج</th><th rowSpan={2}>رمز<br />المادة</th><th colSpan={2}>المواد</th><th colSpan={2}>الكميات</th><th rowSpan={2}>الجهة<br />المستلمة</th><th rowSpan={2}>ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>نوع المادة</th><th>المواصفات</th><th>الوحدة</th><th>العدد</th></tr></thead>;
    if (kind === "inventory") return <thead><tr><th rowSpan={3}>الرقم<br />الجرد</th><th colSpan={3}>المادة</th><th rowSpan={3}>الوحدة</th><th rowSpan={3}>سعر</th><th colSpan={4}>المخزون</th><th colSpan={2}>الفروق الجردية</th><th colSpan={2}>الأسباب والمبررات</th><th rowSpan={3}>ملاحظات</th></tr><tr><th rowSpan={2}>رمزها</th><th rowSpan={2}>اسمها</th><th rowSpan={2}>أوصافها</th><th colSpan={2}>الرصيد الدفتري</th><th colSpan={2}>الجرد الفعلي</th><th rowSpan={2}>بالزيادة</th><th rowSpan={2}>بالنقص</th><th rowSpan={2}>رأي أمين المستودع</th><th rowSpan={2}>رأي رئيس المستودع</th></tr><tr><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th></tr></thead>;
    return <thead><tr><th rowSpan={2}>متسلسل</th><th colSpan={3}>المادة</th><th colSpan={5}>الكميات</th><th rowSpan={2}>ملاحظات</th></tr><tr><th>الرمز</th><th>الاسم</th><th>الوصف</th><th>رصيد أول الشهر</th><th>الاستلام</th><th>الإدخال</th><th>الإخراجات</th><th>الرصيد</th></tr></thead>;
  };

  return (
    <div className="mx-auto max-w-[1540px] space-y-5" dir="rtl">
      <section className="legacy-hero-sky rounded-xl p-6 text-white"><p className="text-sm font-semibold text-white/75">المستودعات — التقارير والطباعة</p><h1 className="mt-1 text-3xl font-extrabold">مركز اليوميات والجرد وحركة المواد</h1><p className="mt-2 text-sm text-white/80">نماذج رسمية قابلة للطباعة والتصدير وفق جداول النظام المرجعي.</p></section>
      <Card className="legacy-panel overflow-hidden rounded-xl"><CardContent className="p-0"><div className="flex flex-wrap border-b border-[#a8d4ea] bg-[#dff3ff]">{(Object.keys(labels) as ReportKind[]).map(key => { const Icon = icons[key]; return <button key={key} onClick={() => setKind(key)} className={`flex items-center gap-2 border-l border-[#a8d4ea] px-5 py-3 text-sm font-extrabold transition-colors ${kind === key ? "bg-[#0874bc] text-white" : "text-[#07518e] hover:bg-white/70"}`}><Icon className="h-4 w-4" />{labels[key]}</button>; })}</div><div className="grid gap-3 p-5 lg:grid-cols-[1.1fr_0.55fr_0.55fr_auto_auto]"><div className="relative"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="بحث عن المادة أو المذكرة أو الجهة" className="h-10 rounded-lg border-[#9bcfe8]" /></div><div className="relative"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-[#377a9e]" /><Input value={from} onChange={event => setFrom(event.target.value)} type="date" className="h-10 rounded-lg border-[#9bcfe8] pr-9" aria-label="من تاريخ" /></div><div className="relative"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-[#377a9e]" /><Input value={to} onChange={event => setTo(event.target.value)} type="date" className="h-10 rounded-lg border-[#9bcfe8] pr-9" aria-label="إلى تاريخ" /></div><Button variant="outline" onClick={() => { setFrom("2012-01-01"); setTo(new Date().toISOString().slice(0, 10)); }} className="border-[#78bce0] text-[#07518e]">تحديد التاريخ</Button><Button onClick={print} disabled={loading} className="bg-[#0874bc] hover:bg-[#055c97]"><Printer className="ml-2 h-4 w-4" />طباعة التقرير</Button></div></CardContent></Card>
      <Card className="legacy-panel overflow-hidden rounded-xl"><CardContent className="p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b4dbed] bg-[#edf9ff] px-5 py-4"><div><h2 className="font-extrabold text-[#07518e]">{labels[kind]}</h2><p className="mt-1 text-xs text-[#4b7792]">{range} — {kind === "movementActive" ? "تظهر المواد التي لها إدخال أو إخراج فقط." : kind === "movement" ? "تظهر المواد المتحركة والثابتة، وتبقى قيم الحركة صفرًا للمواد الثابتة." : "رأس الجدول مبني بالترتيب الرسمي متعدد المستويات."}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => downloadExcel(kind, columns, rows)} disabled={loading} className="border-[#78bce0] text-[#07518e]"><Download className="ml-2 h-4 w-4" />تصدير Excel</Button><Button variant="outline" onClick={print} disabled={loading} className="border-[#78bce0] text-[#07518e]"><FileText className="ml-2 h-4 w-4" />معاينة رسمية</Button></div></div><div className="overflow-x-auto"><table className="report-grid w-full min-w-[1120px] text-right">{reportTableHead()}<tbody>{loading ? <tr><td colSpan={columns.length} className="p-10 text-center">جار تحميل بيانات التقرير…</td></tr> : rows.length ? rows.map((row, index) => <tr key={`${kind}-${index}-${row[0]}`} className={index % 2 === 0 ? "bg-[#e7f0df]" : "bg-[#f5e7dd]"}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="p-10 text-center text-muted-foreground">لا توجد بيانات مطابقة للفترة والبحث المحددين.</td></tr>}</tbody></table></div></CardContent></Card>
    </div>
  );
}
