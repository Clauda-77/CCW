export function openPrintWindow(title = "الطباعة") {
  const page = window.open("", "_blank", "width=1280,height=900");
  if (!page) return null;
  try {
    page.document.open();
    page.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${title}</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#f4fbff;color:#07518e;font-family:Tahoma,Arial,sans-serif}.print-loading{border:1px solid #a8dced;background:#fff;padding:22px 30px;text-align:center;box-shadow:0 12px 30px -18px #07518e}.print-loading strong{display:block;font-size:18px}.print-loading span{display:block;margin-top:8px;font-size:13px;color:#4b7792}</style></head><body><section class="print-loading"><strong>جار تجهيز معاينة الطباعة…</strong><span>ستفتح المعاينة الرسمية قبل إرسال أي أمر إلى الطابعة.</span></section></body></html>`);
    page.document.close();
    page.focus();
    return page;
  } catch {
    page.close();
    return null;
  }
}
