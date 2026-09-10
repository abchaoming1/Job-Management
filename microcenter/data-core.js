(function (root) {
  "use strict";
  const SOURCE = {
    sheetId: "1EOU7HhL5MXJRx6fFAtRk_kKxCL78oFHpvCEOnhtqsZI",
    gid: "559434467",
    sheetName: "渠道数据总表",
    channel: "MC",
  };
  SOURCE.url = `https://docs.google.com/spreadsheets/d/${SOURCE.sheetId}/edit?gid=${SOURCE.gid}#gid=${SOURCE.gid}`;
  SOURCE.exportUrl = `https://docs.google.com/spreadsheets/d/${SOURCE.sheetId}/export?format=xlsx`;
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  function numeric(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const clean = String(value).trim().replace(/USD|US\$/gi, "").replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
    if (!clean || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean)) return null;
    return Number(clean);
  }

  function normalizeRows(grid) {
    const header = grid.find(({ cells }) => cells[1] === "年份" && cells[3] === "渠道");
    if (!header || header.cells[4] !== "SKU" || header.cells[6] !== "QTY" || header.cells[7] !== "REV") {
      throw new Error("原表 A:H 列结构已变化，未更新当前数据。请检查年份、月份、渠道、SKU、QTY、REV 列。");
    }
    const records = [];
    for (const { sourceRow, cells } of grid) {
      if (sourceRow <= header.sourceRow || String(cells[3] || "").trim() !== SOURCE.channel) continue;
      const year = numeric(cells[1]), month = numeric(cells[2]);
      if (!Number.isInteger(year) || year < 2000 || !Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error(`原表第 ${sourceRow} 行的 MC 年份或月份无效。`);
      }
      const qty = numeric(cells[6]), revenue = numeric(cells[7]);
      for (const [index, value, name] of [[6, qty, "QTY"], [7, revenue, "REV"]]) {
        if (cells[index] !== null && cells[index] !== undefined && String(cells[index]).trim() !== "" && value === null) {
          throw new Error(`原表第 ${sourceRow} 行的 ${name} 无法识别：${cells[index]}`);
        }
      }
      const sku = String(cells[4] || "").trim() || "未归属调整";
      records.push({ sourceRow, year, month, channel: SOURCE.channel, sku, baseSku: sku.split("-")[0], model: String(cells[5] || "").trim(), qty, revenue });
    }
    if (!records.length) throw new Error("未读取到 MC 明细，已保留最近一次数据。");
    return records;
  }

  function total(rows) {
    return {
      rows: rows.length,
      qty: rows.reduce((s, r) => s + (r.qty ?? 0), 0),
      revenue: rows.reduce((s, r) => s + (r.revenue ?? 0), 0),
      qtyKnown: rows.filter(r => r.qty !== null).length,
      revenueKnown: rows.filter(r => r.revenue !== null).length,
      qtyComplete: rows.length > 0 && rows.every(r => r.qty !== null),
      revenueComplete: rows.length > 0 && rows.every(r => r.revenue !== null),
    };
  }
  function group(rows, key) {
    const groups = new Map();
    for (const row of rows) { const k = typeof key === "function" ? key(row) : row[key]; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(row); }
    return groups;
  }
  function monthly(records, year) {
    const groups = group(records.filter(r => r.year === year), "month");
    return MONTHS.map(month => ({ month, ...total(groups.get(month) || []) }));
  }
  function annual(records, year) {
    const rows = records.filter(r => r.year === year), months = monthly(records, year);
    return { year, ...total(rows), months, qtyMonths: months.filter(m => m.qtyComplete).map(m => m.month), revenueMonths: months.filter(m => m.revenueComplete).map(m => m.month), skuCount: new Set(rows.filter(r => r.qty !== 0 || r.revenue !== 0).map(r => r.sku)).size };
  }
  function growth(current, prior) { return Number.isFinite(current) && Number.isFinite(prior) && prior > 0 ? (current - prior) / prior : null; }
  function comparison(records, year, metric) {
    const current = annual(records, year), previous = annual(records, year - 1);
    const valid = current[`${metric}Months`];
    if (!valid.length || valid.some(month => !previous[`${metric}Months`].includes(month))) return { value: null, prior: null, months: valid };
    const sum = list => list.filter(m => valid.includes(m.month)).reduce((s, m) => s + m[metric], 0);
    return { value: growth(sum(current.months), sum(previous.months)), prior: sum(previous.months), months: valid };
  }
  function byProduct(rows, level = "sku") {
    return [...group(rows, level)].map(([key, items]) => ({ key, ...total(items), skus: new Set(items.map(r => r.sku)).size })).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty || a.key.localeCompare(b.key));
  }
  const api = { SOURCE, MONTHS, numeric, normalizeRows, total, group, monthly, annual, growth, comparison, byProduct };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MC = api;
})(typeof window !== "undefined" ? window : globalThis);
