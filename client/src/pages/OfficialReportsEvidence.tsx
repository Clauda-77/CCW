import { buildOfficialReportHtml, type OfficialReport } from "@/lib/officialReportPrint";

export const officialReportEvidenceFixtures: OfficialReport[] = [
  { type: "inboundJournal", title: "يومية الإدخالات", dateRange: "", rows: [[1, "1", "2026/1/15", "1342", "سراقة كهربائية مستعمل", "", "عدد", 2, ""]] },
  { type: "outboundJournal", title: "يومية الإخراجات", dateRange: "", rows: [[1, "1/", "2026/1/12", "1122", "حبر طابعة ليزر", "", "عبوة", 1, "مركز الحاسب", ""]] },
  { type: "materialCard", title: "بطاقة مواد", dateRange: "", material: { code: "1122", name: "ظرف أسمر وسط", unit: "عدد", minimumStock: "", maximumStock: "", notes: "" }, rows: [[1, "إدخال", "2/21", "2026/7/27", 50, "", 50, "2026/7/27", "المستودع المركزي", ""]] },
  { type: "inventory", title: "جدول الجرد", dateRange: "2026/8/16", rows: [[1, "1111", "كتاب خاص بالمعلوماتية مستعمل", "", "عدد", "", "عدد", 1337, "", "", "", "", "", "", ""]] },
  { type: "monthlyMovement", title: "جدول حركة المواد", dateRange: "بين التاريخين 2026/1/1 و 2026/8/16", rows: [[1, "1111", "مكتب ورق أبيض", "", 5, 2, 1, 6, ""]] },
];

export default function OfficialReportsEvidence() {
  return <main className="min-h-screen bg-slate-200 p-4" dir="rtl"><div className="mx-auto mb-4 max-w-[1180px] rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-700"><strong>دليل مراجعة النماذج الرسمية غير التابعة للمذكرات</strong><span className="mr-2">— النوافذ أدناه تستخدم مولد الطباعة نفسه المرتبط بأزرار التقارير وبطاقة المادة. جرى تثبيت صف الجرد ليشمل 15 خانة، وتبقى خانات الجرد الفعلي والفروق والاعتمادات فارغة في غياب محضر جرد موثق.</span></div>{officialReportEvidenceFixtures.map(report => <section key={report.type} className="mx-auto mb-8 max-w-[1180px]"><h2 className="mb-2 rounded-t-lg bg-[#163c5b] px-4 py-2 text-sm font-bold text-white">{report.title}</h2><iframe title={`معاينة ${report.title}`} srcDoc={buildOfficialReportHtml(report)} className="h-[950px] w-full border-0 bg-white shadow-xl" /></section>)}</main>;
}
