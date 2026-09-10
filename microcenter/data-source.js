(function () {
  "use strict";
  const nodes = (node, tag) => [...node.getElementsByTagNameNS("*", tag)];
  const first = (node, tag) => nodes(node, tag)[0];
  const xml = text => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (nodes(doc, "parsererror").length) throw new Error("原表工作簿内容无法解析。");
    return doc;
  };

  // Read cached numeric/formula values from the original workbook. Display formats
  // and Google Visualization's majority-column typing never alter these cells.
  async function readWorkbook(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const read = async path => {
      const entry = zip.file(path);
      if (!entry) throw new Error(`工作簿缺少 ${path}`);
      return xml(await entry.async("string"));
    };
    const [workbook, relationships, shared] = await Promise.all([
      read("xl/workbook.xml"), read("xl/_rels/workbook.xml.rels"),
      zip.file("xl/sharedStrings.xml") ? read("xl/sharedStrings.xml") : null,
    ]);
    const sheet = nodes(workbook, "sheet").find(s => s.getAttribute("name") === MC.SOURCE.sheetName);
    if (!sheet) throw new Error(`找不到原表工作表「${MC.SOURCE.sheetName}」。`);
    const rid = sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const target = nodes(relationships, "Relationship").find(r => r.getAttribute("Id") === rid)?.getAttribute("Target");
    if (!target) throw new Error("原表工作表引用无效。");
    const path = target.startsWith("/") ? target.slice(1) : new URL(target, "https://workbook.local/xl/").pathname.slice(1);
    const strings = shared ? nodes(shared, "si").map(si => nodes(si, "t").map(t => t.textContent).join("")) : [];
    const doc = await read(path);
    const grid = nodes(doc, "row").map(row => {
      const cells = Array(8).fill(null);
      for (const cell of nodes(row, "c")) {
        const col = cell.getAttribute("r")?.match(/^([A-Z]+)/)?.[1];
        if (!col || !/^[A-H]$/.test(col)) continue;
        const value = first(cell, "v")?.textContent ?? null, type = cell.getAttribute("t");
        cells[col.charCodeAt(0) - 65] = type === "s" ? strings[Number(value)] : type === "inlineStr" ? nodes(cell, "t").map(t => t.textContent).join("") : value;
      }
      return { sourceRow: Number(row.getAttribute("r")), cells };
    });
    return MC.normalizeRows(grid);
  }
  async function fetchRecords() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${MC.SOURCE.exportUrl}&_=${Date.now()}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`Google Sheet 返回 HTTP ${response.status}`);
      const records = await readWorkbook(await response.arrayBuffer());
      return { schema: 2, source: MC.SOURCE, fetchedAt: new Date().toISOString(), records };
    } finally { clearTimeout(timer); }
  }
  window.MC_SOURCE = { readWorkbook, fetchRecords };
})();
