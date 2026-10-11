import { formatPrintNumber } from "@/lib/printNumber";

export type InventoryPrintMode = "card" | "inbound" | "outbound" | "sub" | "movement";

type MovementRow = {
  code: string;
  name: string;
  unit: string;
  openingQuantity: string | number;
  inboundQuantity: string | number;
  outboundQuantity: string | number;
  onHandQuantity: string | number;
  warehouseName: string;
  partyName: string | null;
};

const titleByMode: Record<InventoryPrintMode, string> = { card: "بطاقة المادة", inbound: "يومية الإدخالات", outbound: "يومية الإخراجات", sub: "كشف حركة فرعي", movement: "كشف حركة المواد" };
const safe = (value: unknown) => String(value ?? "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const number = (value: unknown) => formatPrintNumber(value || 0);
const period = (fromDate?: string, toDate?: string) => fromDate || toDate ? `من ${safe(fromDate || "بداية الفترة")} إلى ${safe(toDate || "اليوم")}` : "كامل البيانات المتاحة";

function standardTable(rows: MovementRow[], mode: InventoryPrintMode) {
  const daily = mode === "inbound" || mode === "outbound";
  const direction = mode === "inbound" ? "كمية الإدخال" : "كمية الإخراج";
  return `<table><thead><tr><th>تسلسل</th><th>رمز المادة</th><th>اسم المادة</th><th>الوحدة</th>${daily ? `<th>${direction}</th>` : "<th>أول المدة</th><th>الوارد</th><th>الصادر</th><th>الرصيد الحالي</th>"}<th>المستودع / الجهة</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${safe(row.code)}</td><td class="name">${safe(row.name)}</td><td>${safe(row.unit)}</td>${daily ? `<td class="amount">${number(mode === "inbound" ? row.inboundQuantity : row.outboundQuantity)}</td>` : `<td>${number(row.openingQuantity)}</td><td class="in">${number(row.inboundQuantity)}</td><td class="out">${number(row.outboundQuantity)}</td><td class="amount">${number(row.onHandQuantity)}</td>`}<td>${safe(row.warehouseName)}${row.partyName ? ` / ${safe(row.partyName)}` : ""}</td></tr>`).join("")}</tbody></table>`;
}

function materialCard(row: MovementRow) {
  return `<section class="material-card"><div class="card-title"><span>بطاقة المادة</span><strong>${safe(row.name)}</strong></div><div class="card-grid"><div><small>رمز المادة</small><b>${safe(row.code)}</b></div><div><small>الوحدة</small><b>${safe(row.unit)}</b></div><div><small>المستودع / الجهة</small><b>${safe(row.warehouseName)}${row.partyName ? ` / ${safe(row.partyName)}` : ""}</b></div><div><small>رصيد أول المدة</small><b>${number(row.openingQuantity)}</b></div><div class="green"><small>إجمالي الإدخال</small><b>${number(row.inboundQuantity)}</b></div><div class="red"><small>إجمالي الإخراج</small><b>${number(row.outboundQuantity)}</b></div><div class="balance"><small>الرصيد الحالي</small><b>${number(row.onHandQuantity)}</b></div></div></section>`;
}

function subReport(rows: MovementRow[]) {
  const groups = new Map<string, { opening: number; inbound: number; outbound: number; onHand: number; count: number }>();
  rows.forEach(row => { const value = groups.get(row.warehouseName) || { opening: 0, inbound: 0, outbound: 0, onHand: 0, count: 0 }; value.opening += Number(row.openingQuantity || 0); value.inbound += Number(row.inboundQuantity || 0); value.outbound += Number(row.outboundQuantity || 0); value.onHand += Number(row.onHandQuantity || 0); value.count += 1; groups.set(row.warehouseName, value); });
  return `<table><thead><tr><th>المستودع</th><th>عدد المواد</th><th>أول المدة</th><th>الإدخالات</th><th>الإخراجات</th><th>الرصيد الحالي</th></tr></thead><tbody>${Array.from(groups).map(([warehouse, group]) => `<tr><td class="name">${safe(warehouse)}</td><td>${group.count.toLocaleString("ar")}</td><td>${number(group.opening)}</td><td class="in">${number(group.inbound)}</td><td class="out">${number(group.outbound)}</td><td class="amount">${number(group.onHand)}</td></tr>`).join("")}</tbody></table>`;
}

export function openInventoryPrint({ mode, rows, fromDate, toDate }: { mode: InventoryPrintMode; rows: MovementRow[]; fromDate?: string; toDate?: string }) {
  const title = titleByMode[mode];
  const content = mode === "card" ? materialCard(rows[0]!) : mode === "sub" ? subReport(rows) : standardTable(rows, mode);
  const printWindow = window.open("", "inventory-report", "noopener,noreferrer,width=1120,height=820");
  if (!printWindow) return false;
  printWindow.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>${title}</title><style>body{font-family:Tahoma,Arial,sans-serif;color:#172d45;margin:24px;background:#fff}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #e34b34;padding-bottom:14px}.brand h1{margin:0;color:#07518e;font-size:25px}.brand p{margin:5px 0 0;color:#50728a;font-size:13px}.badge{padding:8px 12px;border:1px solid #9dd8f2;background:#e9f8ff;color:#07518e;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:22px;font-size:12px}th{background:#dff4ff;color:#145d86;padding:10px;border:1px solid #bde4f3}td{padding:9px;border:1px solid #d1e9f4;text-align:right}.name{font-weight:700}.in{color:#12704f;font-weight:700}.out{color:#d44832;font-weight:700}.amount{color:#07518e;font-weight:800}.material-card{margin-top:26px;border:1px solid #a8dced}.card-title{display:flex;justify-content:space-between;background:linear-gradient(90deg,#e5f8ff,#0079c4);padding:18px;color:#074d89}.card-title strong{color:#fff;font-size:20px}.card-grid{display:grid;grid-template-columns:repeat(3,1fr)}.card-grid>div{min-height:70px;padding:16px;border:1px solid #d1e9f4}.card-grid small{display:block;color:#5c788c;margin-bottom:8px}.card-grid b{font-size:17px}.green b{color:#12704f}.red b{color:#d44832}.balance{background:#edfaff}.balance b{color:#07518e}.footer{margin-top:22px;font-size:11px;color:#587589;border-top:1px solid #c8e5f2;padding-top:10px}@media print{body{margin:10mm}.brand{break-after:avoid}}</style></head><body><header class="brand"><div><h1>${title}</h1><p>نظام إدارة المستودعات — مركز الحاسب</p></div><span class="badge">${period(fromDate, toDate)}</span></header>${content}<footer class="footer">طُبع بتاريخ ${new Date().toLocaleString("ar")}</footer><script>window.onload=()=>{window.print();}</script></body></html>`);
  printWindow.document.close();
  return true;
}
