const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 });

  // Web Fonts (Google Fonts) の読み込みを待つ
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  // PDF用にUI要素を非表示・1カラム化
  await page.addStyleTag({
    content: `
      .top-bar, .sidebar, .scroll-top, .no-results { display: none !important; }
      .layout { display: block !important; max-width: none !important; margin: 0 !important; grid-template-columns: none !important; }
      main { padding: 8mm 6mm !important; }
      .intro h1 { font-size: 28pt !important; }
      .phase { page-break-before: always; break-before: page; margin-bottom: 24px !important; }
      .phase:first-of-type { page-break-before: auto; break-before: auto; }
      .schema-card { page-break-inside: avoid; break-inside: avoid; }
      /* 問題は分割を許容して隙間を減らす。ヘッダーは本文と離さない */
      .q-header { page-break-after: avoid; break-after: avoid; }
      .q-solution summary { page-break-after: avoid; break-after: avoid; }
      .topic-title { page-break-after: avoid; break-after: avoid; }
      .phase-header { page-break-after: avoid; break-after: avoid; }
      .code-block { white-space: pre-wrap !important; word-break: break-word !important; overflow: visible !important; }
      .code-block code { white-space: pre-wrap !important; word-break: break-word !important; }
      details { display: block; }
      details[open] > summary { cursor: default; }
      .q-checkbox { display: none !important; }
      .q-body, .q-solution { margin-left: 0 !important; }
      html, body { background: #fbf8f1 !important; background-image: none !important; background-attachment: scroll !important; font-size: 10pt !important; height: auto !important; min-height: 0 !important; }
      .q-title { font-size: 13pt !important; }
      .q-body { font-size: 10pt !important; }
      .code-block { font-size: 9pt !important; padding: 10px 12px !important; }
      .schema-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
      .schema-card { padding: 12px 14px !important; }
      .topic { margin-bottom: 22px !important; }
      .questions { gap: 10px !important; }
      .question { padding: 12px 16px !important; }
      .intro { margin-bottom: 28px !important; padding-bottom: 18px !important; }
      .phase-header { margin-bottom: 18px !important; padding-bottom: 10px !important; }
    `,
  });

  // すべての <details> を展開
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach(d => d.open = true);
  });

  // レンダリング安定化のため少し待機
  await page.waitForTimeout(1200);

  const outputPath = path.resolve(__dirname, 'StyleHub-SQL-92.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '10mm', bottom: '16mm', left: '10mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:8pt; color:#8a8278; width:100%; text-align:center; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">' +
      'StyleHub SQL 92 — <span class="pageNumber"></span> / <span class="totalPages"></span>' +
      '</div>',
  });

  await browser.close();
  console.log('PDF saved to: ' + outputPath);
})();
