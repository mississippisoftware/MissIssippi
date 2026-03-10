type PrintHtmlOptions = {
  onError?: () => void;
  promptTitle?: boolean;
  defaultTitle?: string;
};

const extractDocumentTitle = (html: string): string | null => {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match?.[1]?.trim() || null;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const SHARED_PRINT_BREAK_CSS = `
  @media print {
    h1, h2, h3, h4, h5, h6 { break-after: avoid-page; page-break-after: avoid; }
    .color-card,
    .item-card,
    .batch,
    .inventory-card,
    .inventory-card-group,
    .inventory-card-print,
    .scan-card,
    .print-card,
    .print-section,
    .catalog-card,
    .item-row-expanded,
    .item-color-rect-list {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    table { page-break-inside: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr, td, th { break-inside: avoid-page; page-break-inside: avoid; }
  }
`;

const injectPrintTitleAndCss = (html: string, printTitle: string) => {
  const titleTag = `<title>${escapeHtml(printTitle)}</title>`;
  const titleBanner = `<div class="print-runtime-title" style="font-family:'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:700;margin:0 0 8px 0;">${escapeHtml(printTitle)}</div>`;
  const titleCss = `<style id="print-runtime-style">
    ${SHARED_PRINT_BREAK_CSS}
    @media print { .print-runtime-title { break-after: avoid-page; page-break-after: avoid; } }
  </style>`;

  let nextHtml = html;

  if (/<title>[\s\S]*?<\/title>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  } else if (/<head[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<head[^>]*>/i, (m) => `${m}\n${titleTag}`);
  }

  if (/<\/head>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<\/head>/i, `${titleCss}\n</head>`);
  } else {
    nextHtml = `${titleCss}\n${nextHtml}`;
  }

  // Only prepend a runtime title if the document does not already render an H1.
  if (!/<h1[\s>]/i.test(nextHtml) && /<body[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<body([^>]*)>/i, `<body$1>\n${titleBanner}`);
  }

  return nextHtml;
};

export const printHtml = (html: string, options?: PrintHtmlOptions) => {
  const detectedTitle = extractDocumentTitle(html) ?? options?.defaultTitle ?? "Print";
  const shouldPrompt = options?.promptTitle !== false;
  const promptedTitle = shouldPrompt
    ? window.prompt("Print title", detectedTitle)?.trim() ?? ""
    : detectedTitle;
  const printTitle = promptedTitle || detectedTitle || "Print";
  const htmlWithPrintEnhancements = injectPrintTitleAndCss(html, printTitle);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    options?.onError?.();
    return;
  }

  doc.open();
  doc.write(htmlWithPrintEnhancements);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };
};
