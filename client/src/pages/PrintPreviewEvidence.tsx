import { buildMemoPrintHtml } from "@/lib/memoPrint";

const referenceMemo = {
  type: "inbound" as const,
  memoNumber: "22",
  memoDate: "2026-07-27",
  warehouseName: "المستودع المركزي",
  partyName: "المستودع المركزي",
  folderNumber: "2",
  orderNumber: "10/37",
  orderDate: "2026-07-20",
  referenceNumber: "",
  items: [
    { code: "1411", name: "معطر أرضيات", description: "", unit: "عبوة", quantity: 1 },
    { code: "1412", name: "سلة مهملات بلاستيك بغطاء", description: "", unit: "عدد", quantity: 4 },
    { code: "1413", name: "صابون", description: "", unit: "عدد", quantity: 5 },
  ],
};

export default function PrintPreviewEvidence() {
  return <main className="min-h-screen bg-slate-200 p-4" dir="rtl"><div className="mx-auto mb-4 max-w-[1180px] rounded-lg border border-slate-300 bg-white px-5 py-4 text-sm text-slate-700"><strong>دليل مراجعة معاينة الطباعة</strong><span className="mr-2">— الصفحة التالية تعرض المولد نفسه المستخدم في زر المعاينة، وتحتوي على الصفحة الأولى والثانية.</span></div><iframe title="معاينة مذكرة الإدخال ذات الصفحتين" srcDoc={buildMemoPrintHtml(referenceMemo)} className="mx-auto block h-[2050px] w-full max-w-[1180px] border-0 bg-white shadow-xl" /></main>;
}
