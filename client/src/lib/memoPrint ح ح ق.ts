import { openPrintWindow } from "./printWindow";
import { displayCode } from "./displayCode";
import { classifyMemo } from "@shared/memoClassification";
import { formatPrintNumber } from "@/lib/printNumber";

type MemoPrintItem = {
  code: string;
  name: string;
  description?: string | null;
  cardNumber?: string | number | null;
  unit: string;
  quantity: string | number;
  unitPrice?: string | number | null;
  notes?: string | null;
};

export type PrintableMemo = {
  type: "inbound" | "outbound";
  classification?: "purchase" | "adjustment" | "transfer" | "return" | null;
  memoNumber: string;
  memoDate: Date | string;
  warehouseName: string;
  partyName?: string | null;
  folderNumber?: string | null;
  orderNumber?: string | null;
  orderDate?: Date | string | null;
  invoiceNumber?: string | null;
  invoiceDate?: Date | string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  items: MemoPrintItem[];
};

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char] ?? char,
  );
const dateValue = (value: Date | string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("ar-SY") : "";
const resolvePrintClassification = (memo: PrintableMemo) => {
  const detected = classifyMemo(memo);
  if (memo.classification) return memo.classification;
  if (
    detected === "adjustment" &&
    /تركيب|تنسيق|تسليم وتنسيق/.test(memo.notes || "")
  )
    return "transfer";
  return detected;
};

export function buildMemoPrintHtml(memo: PrintableMemo) {
  const inbound = memo.type === "inbound";
  const classification = resolvePrintClassification(memo);
  const isTransfer = classification === "transfer";
  const title =
    classification === "purchase"
      ? "مذكرة استلام"
      : classification === "return"
        ? "مذكرة إدخال"
        : isTransfer
          ? "محضر تركيب وتنسيق"
          : "مذكرة تسليم";
  const quantityTitle = isTransfer
    ? "الكمية المركبة والمنسقة"
    : inbound
      ? "الكمية المستلمة"
      : "الكمية المسلمة";
  const showPrices = classification === "purchase";
  const showFinancialNumber = classification === "purchase" || isTransfer;
  const partyPhrase = isTransfer
    ? "تم تركيبها وتنسيقها في"
    : inbound
      ? "وردت من"
      : "سلمت إلى";
  const referenceLabel = isTransfer ? "محضر تركيب وتنسيق رقم" : "المذكرة رقم";
  const footerAction = isTransfer
    ? "فقد جرى تركيبها وتنسيقها"
    : inbound
      ? "فقد جرى استلامها"
      : "فقد جرى تسليمها";
  const recipientLabel = isTransfer ? "الجهة المستفيدة" : "الاسم";
  const memoDate = dateValue(memo.memoDate);
  // const orderDate = dateValue(memo.orderDate);

  // const renderRows = (items: MemoPrintItem[], offset: number) => items.map((item, index) => {
  //   const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
  //   const description = item.description || "";
  //   const cardNumber = item.cardNumber || "";
  //   const notes = item.notes || "";
  //   return `<tr><td>${offset + index + 1}</td><td>${escapeHtml(displayCode(item.code))}</td><td class="item-name">${escapeHtml(item.name)}</td><td>${escapeHtml(description)}</td><td>${escapeHtml(item.unit)}</td><td>${escapeHtml(formatPrintNumber(item.quantity))}</td>${showPrices ? `<td>${escapeHtml(formatPrintNumber(item.unitPrice || ""))}</td><td>${escapeHtml(formatPrintNumber(lineTotal || ""))}</td>` : ""}<td>${escapeHtml(cardNumber)}</td><td>${escapeHtml(notes)}</td></tr>`;
  // }).join("");
  const orderDate = dateValue(memo.orderDate);

  const memoNoteParts = (memo.notes || "")
    .split(" — ")
    .map((value) => value.trim())
    .filter(Boolean);

  const generalMemoNotes =
    memoNoteParts.length >= 3 ? memoNoteParts.slice(2).join(" — ") : "";

  const renderRows = (items: MemoPrintItem[], offset: number) =>
    items
      .map((item, index) => {
        const lineTotal =
          Number(item.quantity || 0) * Number(item.unitPrice || 0);

        const description = item.notes?.trim() || item.description || "";

        const cardNumber = item.cardNumber || "";

        const generalNotes =
          offset === 0 && index === 0 ? generalMemoNotes : "";

        return `<tr>
        <td>${offset + index + 1}</td>
        <td>${escapeHtml(displayCode(item.code))}</td>
        <td class="item-name">${escapeHtml(item.name)}</td>
        <td>${escapeHtml(description)}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(formatPrintNumber(item.quantity))}</td>
        ${
          showPrices
            ? `<td>${escapeHtml(formatPrintNumber(item.unitPrice || ""))}</td>
               <td>${escapeHtml(formatPrintNumber(lineTotal || ""))}</td>`
            : ""
        }
        <td>${escapeHtml(cardNumber)}</td>
        <td>${escapeHtml(generalNotes)}</td>
      </tr>`;
      })
      .join("");

  const renderPriceGridCell = (
    value: string | number | null | undefined,
    cellCount: 6 | 8,
  ) => {
    const formattedValue =
      value === "" || value === null || value === undefined
        ? ""
        : formatPrintNumber(value);
    const valueCharacters = Array.from(String(formattedValue))
      .slice(-cellCount)
      .reverse();
    const cells = Array.from(
      { length: cellCount },
      (_, index) => `<span>${escapeHtml(valueCharacters[index] || "")}</span>`,
    ).join("");
    return `<td class="price-grid-cell price-grid-${cellCount}"><div>${cells}</div></td>`;
  };

  const renderTransferTable = (items: MemoPrintItem[], offset: number) => {
    const rows = Array.from({ length: 11 }, (_, index) => {
      const item = items[index];
      const serial = item ? String(offset + index + 1) : "";
      const name = item ? escapeHtml(item.name) : "";
      const code = item ? escapeHtml(displayCode(item.code)) : "";
      // const description = item ? escapeHtml(item.description || "") : "";
      const description = item
        ? escapeHtml(item.notes?.trim() || item.description || "")
        : "";

      const notes =
        item && offset === 0 && index === 0 ? escapeHtml(generalMemoNotes) : "";

      const unit = item ? escapeHtml(item.unit) : "";
      const quantity = item ? escapeHtml(formatPrintNumber(item.quantity)) : "";
      // const notes = item ? escapeHtml(item.notes || "") : "";
      const price = item
        ? escapeHtml(formatPrintNumber(item.unitPrice || ""))
        : "";
      const total = item
        ? escapeHtml(
            formatPrintNumber(
              Number(item.quantity || 0) * Number(item.unitPrice || 0) || "",
            ),
          )
        : "";
      return `<tr><td>${serial}</td><td class="transfer-material-name">${name}</td><td>${code}</td><td>${description}</td><td>${unit}</td><td>${quantity}</td><td>${notes}</td>${renderPriceGridCell(total, 8)}${renderPriceGridCell(price, 6)}<td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }).join("");
    //<colgroup><col style="width:4%"/><col style="width:13%"/><col style="width:7%"/><col style="width:13%"/><col style="width:6%"/><col style="width:6%"/><col style="width:7%"/><col style="width:8%"/><col style="width:8%"/><col style="width:4%"/><col style="width:12%"/><col style="width:12%"/><col style="width:6%"/><col style="width:6%"/><col style="width:7%"/></colgroup>

    return `<table class="official-table transfer-table">
<colgroup>
  <col style="width:5%"/>
  <col style="width:12%"/>
  <col style="width:7%"/>
  <col style="width:13%"/>
  <col style="width:6%"/>
  <col style="width:6%"/>
  <col style="width:7%"/>
  <col style="width:8%"/>
  <col style="width:8%"/>
  <col style="width:5%"/>
  <col style="width:11%"/>
  <col style="width:12%"/>
  <col style="width:6%"/>
  <col style="width:6%"/>
  <col style="width:7%"/>
</colgroup>

    <thead><tr><th colspan="6">المواد المركبة</th><th rowspan="2">ملاحظات</th><th rowspan="2">القيمة<br/>الإجمالية<br/>ل.س</th><th rowspan="2">السعر<br/>الإفرادي<br/>ل.س</th><th colspan="5">المواد المنسقة</th><th rowspan="2">ملاحظات</th></tr><tr><th>الرقم<br/>المتسلسل</th><th>اسم المادة</th><th>رمزها</th><th>مواصفاتها</th><th>الوحدة</th><th>الكمية</th><th>الرقم<br/>المتسلسل</th><th>اسم المادة</th><th>مواصفاتها</th><th>الوحدة</th><th>الكمية</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const renderPurchaseRows = (items: MemoPrintItem[], offset: number) =>
    items.length
      ? items
          .map((item, index) => {
            const lineTotal =
              Number(item.quantity || 0) * Number(item.unitPrice || 0);
            const description = item.notes?.trim() || item.description || "";
            const generalNotes =
              offset === 0 && index === 0 ? generalMemoNotes : "";
            return `<tr><td>${offset + index + 1}</td><td>${escapeHtml(displayCode(item.code))}</td><td class="item-name">${escapeHtml(item.name)}</td><td>${escapeHtml(description)}</td><td>${escapeHtml(item.unit)}</td><td>${escapeHtml(formatPrintNumber(item.quantity))}</td>${renderPriceGridCell(item.unitPrice, 6)}${renderPriceGridCell(lineTotal || "", 8)}<td>${escapeHtml(item.cardNumber || "")}</td><td>${escapeHtml(generalNotes)}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="10">&nbsp;</td></tr>';

  const renderTable = (items: MemoPrintItem[], offset: number) => {
    if (isTransfer) return renderTransferTable(items, offset);
    const columns = showPrices
      ? '<col style="width:5%"/><col style="width:7%"/><col style="width:20%"/><col style="width:14%"/><col style="width:7%"/><col style="width:9%"/>' +
        '<col style="width:9%"/><col style="width:9%"/>' +
        '<col style="width:9%"/><col style="width:11%"/>'
      : '<col style="width:5%"/><col style="width:7%"/><col style="width:24%"/><col style="width:16%"/><col style="width:7%"/><col style="width:10%"/><col style="width:12%"/><col style="width:19%"/>';
    const priceHeaders = showPrices
      ? '<th rowspan="2">السعر الإفرادي</th><th rowspan="2">الإجمالي</th>'
      : "";
    const body = showPrices
      ? renderPurchaseRows(items, offset)
      : renderRows(items, offset) || '<tr><td colspan="8">&nbsp;</td></tr>';
    return `<table class="official-table"><colgroup>${columns}</colgroup><thead><tr><th rowspan="2" class="serial-column-title"><span>رقم التسلسل</span><span>الرقم<br/>المتسلسل</span></th><th colspan="4">المادة</th><th rowspan="2">${quantityTitle}</th>${priceHeaders}<th rowspan="2">رقم بطاقة<br/>المواد</th><th rowspan="2">ملاحظات</th></tr><tr><th>رمزها</th><th>اسمها</th><th>أوصافها</th><th>وحدتها</th></tr></thead><tbody>${body}</tbody></table>`;
  };

  const renderHeader = () =>
    `<header class="memo-header"><section class="government"><div class="government-lines">الجمهورية العربية السورية<span>وزارة المالية</span></div></section><section class="memo-title"><h1>${title}</h1><p>مركز الحاسب</p></section><section class="memo-meta"><p>نموذج مستودع رقم ( ٦ )</p><p>رقم المجلد&nbsp;&nbsp;${escapeHtml(memo.folderNumber)}</p><p>رقم المحضر&nbsp;&nbsp;${escapeHtml(memo.memoNumber)}</p><p>التاريخ&nbsp;&nbsp;${escapeHtml(memoDate)}</p></section></header>`;
  const renderFooter = () =>
    isTransfer
      ? `<footer class="memo-footer transfer-footer"><p>تم استلام القطع المنسقة والمبينة أعلاه وسجلت في بطاقتها.</p><section class="transfer-signatures"><div><strong>القائم بالعمل</strong><p>الاسم :</p><p>التوقيع :</p></div><div><strong>المسؤول عن الآلية التي تم إصلاحها أو صيانتها</strong><p>الاسم :</p><p>التوقيع :</p></div><div><strong>أمين المستودع</strong><p>الاسم :</p><p>التوقيع :</p></div><div><strong>مصدق المدير المختص</strong><p>الاسم :</p><p>التوقيع :</p></div></section></footer>`
      : `<footer class="memo-footer"><div class="total-line"><strong>قيمة مجموعها :</strong><span>${showPrices ? escapeHtml(formatPrintNumber(memo.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0) || "")) : ""}</span></div><p>${footerAction} :</p><p>تم تسجيل المواد المبينة أعلاه في بطاقات المستودع أصولاً</p><p>وتم تسجيلها في بطاقات المستودع أصولاً</p><section class="signature-area"><div class="storekeeper"><p>أمين المستودع</p><p>الاسم :</p><p>التوقيع :</p></div><div class="recipient"><p>${recipientLabel} :</p><p>الاسم :</p><p>الوظيفة :</p><p>التوقيع :</p></div></section></footer>`;

  const pageItems = Array.from(
    { length: Math.max(1, Math.ceil(memo.items.length / 11)) },
    (_, pageIndex) => memo.items.slice(pageIndex * 11, pageIndex * 11 + 11),
  );
  const pages = pageItems
    .map((items, pageIndex) => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pageItems.length - 1;
      const intro = isFirst
        ? isTransfer
          ? `<p class="memo-intro transfer-intro">بتاريخ&nbsp;&nbsp;${escapeHtml(memoDate)}&nbsp;&nbsp;تم تركيب المواد المبينة أدناه بموجب الفاتورة رقم&nbsp;&nbsp;${escapeHtml(memo.invoiceNumber || memo.referenceNumber || memo.memoNumber)}، وسلمت القطع التنفيذية المنسقة إلى أمين مستودع الجهة المستفيدة.</p><p class="memo-reference">نوع العملية&nbsp;&nbsp;تركيب وتنسيق&nbsp;&nbsp;&nbsp;&nbsp;رقم الآلية أو المعدة&nbsp;&nbsp;${escapeHtml(memo.orderNumber || memo.folderNumber)}</p>`
          : `<p class="memo-intro">إن المواد المذكورة أدناه ${partyPhrase}&nbsp;&nbsp;${escapeHtml(memo.partyName)}</p><p class="memo-reference">بموجب ${referenceLabel}&nbsp;&nbsp;${escapeHtml(memo.referenceNumber || memo.memoNumber)}&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${escapeHtml(memoDate)}<br/>وبموجب رقم الطلب&nbsp;&nbsp;${escapeHtml(memo.orderNumber)}&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${escapeHtml(orderDate)}</p>`
        : "";
      return `<main class="memo-sheet ${isFirst ? "memo-first-page" : "memo-continuation-page"}">${renderHeader()}${intro}${renderTable(items, pageIndex * 11)}${isLast ? renderFooter() : ""}</main>`;
    })
    .join("");

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${title}</title><style>
    @page{size:${isTransfer ? "A4 portrait" : "A4 landscape"};margin:7mm}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#e7edf1;color:#000}body{font-family:"Times New Roman",Tahoma,Arial,sans-serif}.preview-toolbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 18px;background:#163c5b;color:#fff;font-family:Tahoma,Arial,sans-serif;box-shadow:0 2px 8px #0003}.preview-toolbar strong{font-size:14px}.preview-toolbar span{margin-right:9px;font-size:12px;color:#d6ecfa}.preview-actions{display:flex;align-items:center;gap:8px}.preview-actions button{cursor:pointer;border:1px solid #9fd9f6;border-radius:5px;padding:8px 15px;background:#fff;color:#07518e;font-weight:700}.preview-page-controls{display:flex;align-items:center;gap:6px}.preview-page-controls span{min-width:82px;text-align:center;font-size:12px}.preview-page-controls button:disabled{cursor:not-allowed;opacity:.45}.preview-actions .print-now{background:#0a7aba;color:#fff;border-color:#0a7aba}.memo-sheet{page-break-after:always;break-after:page;width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:16mm 13mm 14mm 24mm;box-shadow:0 1px 5px #0004;font-size:15px;line-height:1.8}.memo-sheet:last-of-type{page-break-after:auto;break-after:auto}.memo-header{display:grid;grid-template-columns:1fr 1.1fr 1fr;align-items:start;padding-left:10mm}.government{font-size:23px;font-weight:700;line-height:1.45;text-align:right}.government-lines{display:inline-block;text-align:center}.government-lines span{display:block;font-size:18px;text-align:center}.memo-title{text-align:center;padding-top:13px}.memo-title h1{margin:0;font-size:26px;line-height:1.3}.memo-title p{margin:5px 0 0;font-size:15px}.memo-meta{text-align:left;font-size:17px;line-height:1.85}.memo-meta p{margin:0}.memo-intro{margin:23px 0 5px;text-align:center;font-size:18px}.transfer-intro{text-align:right;line-height:1.7}.transfer-signatures{display:grid;grid-template-columns:1fr 1fr;gap:20mm 25mm;margin-top:18mm;font-size:15px}.transfer-signatures>div{min-height:28mm;text-align:center}.transfer-signatures>div:nth-child(2),.transfer-signatures>div:nth-child(4){text-align:right}.transfer-footer{font-size:15px;line-height:1.8}.memo-reference{margin:0 0 21px;text-align:center;font-size:17px;line-height:1.9}.official-table{width:100%;border-collapse:collapse;table-layout:fixed}.official-table th,.official-table td{border:1px solid #000;text-align:center;vertical-align:middle;padding:3px}.official-table thead{display:table-header-group}.official-table tr{break-inside:avoid;page-break-inside:avoid}.official-table th{font-size:15px;font-weight:700;line-height:1.25}.official-table td{height:25px;font-size:14px}.price-grid-cell{padding:0!important}.price-grid-cell>div{display:grid;direction:rtl;width:100%;height:100%}.price-grid-6>div{grid-template-columns:repeat(6,1fr)}.price-grid-8>div{grid-template-columns:repeat(8,1fr)}.price-grid-cell span{display:flex;align-items:center;justify-content:center;min-height:100%;border-left:1px solid #000;padding:3px 1px}.price-grid-cell span:last-child{border-left:0}.official-table .item-name{text-align:right;font-weight:700}.transfer-table{font-size:12px;direction:rtl}.transfer-table th,.transfer-table td{padding:2px 1px}.transfer-table .transfer-name,.transfer-table .transfer-material-name{font-weight:700;text-align:center}.transfer-table th{vertical-align:middle}.transfer-table th{font-size:11px;line-height:1.1}.transfer-table td{height:23px;font-size:11px}.transfer-table .item-name{text-align:center}.transfer-table th.serial-column-title{width:10%;padding:2px 1px;white-space:normal}.official-table th.serial-column-title span{display:inline-block;white-space:nowrap;line-height:1.15;direction:rtl}.memo-footer{font-size:17px;line-height:2}.memo-footer p{margin:6px 0}.total-line{display:flex;justify-content:center;gap:12px;margin:9mm 0 13mm}.signature-area{display:grid;grid-template-columns:1fr 1fr;gap:90px;margin-top:46mm;font-weight:700}.signature-area p{margin:7px 0}.storekeeper{text-align:center}.recipient{text-align:right}@media print{.preview-page-controls{display:none!important}.memo-sheet{display:block!important}html,body{background:#fff}.preview-toolbar{display:none}.memo-sheet{width:auto;min-height:196mm;margin:0;padding:2mm 3mm;box-shadow:none;font-size:12px;line-height:1.25}.memo-header{padding-left:4mm}.government{font-size:17px}.government-lines span{font-size:13px}.memo-title{padding-top:2px}.memo-title h1{font-size:21px}.memo-title p{margin:2px 0 0;font-size:12px}.memo-meta{font-size:12px;line-height:1.45}.memo-intro{margin:5px 0 2px;font-size:12px}.memo-reference{margin:0 0 5px;font-size:11px;line-height:1.35}.official-table th,.official-table td{border-color:#000!important;padding:1px}.official-table th{font-size:10px;line-height:1.05}.official-table td{height:17px;font-size:10px;line-height:1.05}.price-grid-cell span{padding:1px}.transfer-table th,.transfer-table td{font-size:8px;padding:1px}.transfer-table td{height:16px}.transfer-signatures{gap:8mm 12mm;margin-top:10mm;font-size:10px}.transfer-footer{font-size:10px}.memo-footer{font-size:14px;line-height:1.45}.total-line{margin:4mm 0 6mm}.signature-area{margin-top:28mm}}
  </style></head><body>
  <header class="preview-toolbar"><div><strong>معاينة قبل الطباعة — ${title}</strong><span>كل صفحة تحتوي على 11 بندًا. تنقّل بين الصفحات ثم اضغط «إرسال إلى الطابعة».</span></div><div class="preview-actions"><div class="preview-page-controls"><button id="previous-page" type="button">السابق</button><span id="page-indicator">صفحة 1 من ${pageItems.length}</span><button id="next-page" type="button">التالي</button></div><button id="close-preview" type="button">إغلاق</button><button id="print-now" class="print-now" type="button">إرسال إلى الطابعة</button></div></header>
  ${pages}
  <script>const pages=Array.from(document.querySelectorAll(".memo-sheet"));let currentPage=0;const previousPage=document.getElementById("previous-page"),nextPage=document.getElementById("next-page"),pageIndicator=document.getElementById("page-indicator");const showPage=(index)=>{currentPage=Math.max(0,Math.min(index,pages.length-1));pages.forEach((page,pageIndex)=>{page.style.display=pageIndex===currentPage?"block":"none"});pageIndicator.textContent="صفحة "+(currentPage+1)+" من "+pages.length;previousPage.disabled=currentPage===0;nextPage.disabled=currentPage===pages.length-1};previousPage.addEventListener("click",()=>showPage(currentPage-1));nextPage.addEventListener("click",()=>showPage(currentPage+1));document.getElementById("print-now").addEventListener("click",()=>{pages.forEach(page=>{page.style.display="block"});window.focus();window.print();showPage(currentPage)});document.getElementById("close-preview").addEventListener("click",()=>window.close());showPage(0);window.focus()</script></body></html>`;
}

export function printMemo(memo: PrintableMemo, reservedPage?: Window) {
  const classification = resolvePrintClassification(memo);
  const title =
    classification === "purchase"
      ? "مذكرة استلام"
      : classification === "return"
        ? "مذكرة إدخال"
        : classification === "transfer"
          ? "محضر تركيب وتنسيق"
          : "مذكرة تسليم";
  const page = reservedPage ?? openPrintWindow(title);
  if (!page) return false;
  page.document.open?.();
  page.document.write(buildMemoPrintHtml(memo));
  page.document.close();
  page.focus?.();
  return true;
}
