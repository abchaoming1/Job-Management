const SHEET_ID = "1EOU7HhL5MXJRx6fFAtRk_kKxCL78oFHpvCEOnhtqsZI";
const SHEET_GID = "559434467";
const SHEET_QUERY = "select A,B,C,D,E,F,G,H where D='MC'";
const AUTO_REFRESH_MS = 5 * 60 * 1000;
let records = [];
let years = [];
let latestYear = 0;
let latestMonth = 0;
let syncing = false;
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const state = { year: null, skuQuery: "", monthSkuMonth: null, monthSkuQuery: "", matrixMetric: "qty" };
const money = (value) => `$${Math.round(Number(value || 0)).toLocaleString("en-US")}`;
const number = (value, digits = 0) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits });
const percent = (value, digits = 1) => Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "—";
const growth = (current, prior) => prior ? (current - prior) / prior : NaN;
const tone = (value) => Number.isFinite(value) && value >= 0 ? "positive" : "negative";
const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

function group(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function normalizeRecords(rows) {
  return rows.map((row) => {
    const sku = String(row.sku || "").trim();
    const inferredModel = sku.startsWith("S821-") ? "S820" : sku.split("-")[0];
    const sourceModel = String(row.model || "").trim();
    const hasRevenue = row.hasRevenue ?? (row.revenue !== null && row.revenue !== undefined && row.revenue !== "");
    return {
      year: Number(row.year),
      month: Number(row.month),
      sku,
      model: !sourceModel || sourceModel === "#N/A" ? inferredModel : sourceModel,
      qty: Number(row.qty || 0),
      revenue: Number(row.revenue || 0),
      hasRevenue,
    };
  }).filter((row) => Number.isFinite(row.year) && Number.isFinite(row.month) && row.sku);
}

function recordsFromGoogleTable(table) {
  return (table?.rows || []).map((row) => {
    const cells = row.c || [];
    return {
      year: cells[1]?.v,
      month: cells[2]?.v,
      channel: cells[3]?.v,
      sku: cells[4]?.v,
      model: cells[5]?.v,
      qty: cells[6]?.v,
      revenue: cells[7]?.v,
      hasRevenue: cells[7]?.v !== null && cells[7]?.v !== undefined,
    };
  }).filter((row) => row.channel === "MC");
}

function setSourceStatus(kind, message) {
  const summary = document.getElementById("sourceSummary");
  summary.classList.remove("syncing", "live", "fallback");
  summary.classList.add(kind);
  summary.textContent = message;
}

function refreshYearOptions(preferredYear = state.year) {
  const select = document.getElementById("yearSelect");
  select.innerHTML = years.slice().reverse().map((year) => `<option value="${year}">${year}</option>`).join("");
  state.year = years.includes(Number(preferredYear)) ? Number(preferredYear) : latestYear;
  select.value = state.year;
}

function updateDataAudit() {
  const minRecord = records.reduce((best, row) => row.year * 100 + row.month < best ? row.year * 100 + row.month : best, Infinity);
  const maxRecord = records.reduce((best, row) => row.year * 100 + row.month > best ? row.year * 100 + row.month : best, 0);
  document.getElementById("rowCount").textContent = number(records.length);
  document.getElementById("periodRange").textContent = `${String(minRecord).slice(0, 4)}.${String(minRecord).slice(4)}–${String(maxRecord).slice(0, 4)}.${String(maxRecord).slice(4)}`;
}

function applyRecords(nextRecords, preferredYear = state.year) {
  records = normalizeRecords(nextRecords);
  if (!records.length) throw new Error("Google Sheet did not return Micro Center rows.");
  years = [...new Set(records.map((row) => row.year))].sort((a, b) => a - b);
  latestYear = Math.max(...years);
  latestMonth = Math.max(...records.filter((row) => row.year === latestYear).map((row) => row.month));
  refreshYearOptions(preferredYear);
  updateDataAudit();
  renderAll();
  document.body.classList.remove("initial-sync");
}

function loadGoogleSheet() {
  return new Promise((resolve, reject) => {
    const callbackName = `__mcSheetCallback_${Date.now()}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("Google Sheet request timed out.")), 15000);
    const finish = (error, data) => {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
      error ? reject(error) : resolve(data);
    };
    window[callbackName] = (response) => {
      if (response?.status !== "ok") { finish(new Error(response?.errors?.[0]?.detailed_message || "Google Sheet query failed.")); return; }
      finish(null, recordsFromGoogleTable(response.table));
    };
    script.onerror = () => finish(new Error("Google Sheet script could not be loaded."));
    const params = new URLSearchParams({ gid: SHEET_GID, tq: SHEET_QUERY, tqx: `responseHandler:${callbackName};out:json`, _: Date.now() });
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
    document.head.append(script);
  });
}

async function syncLiveData({ manual = false } = {}) {
  if (syncing) return;
  syncing = true;
  const button = document.getElementById("refreshData");
  button.disabled = true;
  button.textContent = "同步中…";
  setSourceStatus("syncing", "正在同步 Google Sheet 的 Micro Center 数据…");
  try {
    const liveRecords = await loadGoogleSheet();
    applyRecords(liveRecords);
    const stamp = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    setSourceStatus("live", `已自动同步 Google Sheet ｜ 仅 MC ｜ 最新数据 ${latestYear}-${String(latestMonth).padStart(2, "0")} ｜ ${stamp}`);
  } catch (error) {
    console.warn("Live Google Sheet sync failed; using embedded fallback data.", error);
    if (!records.length) applyRecords(window.MC_DATA.records, null);
    setSourceStatus("fallback", `在线同步暂不可用，当前显示内置数据 ｜ 最新 ${latestYear}-${String(latestMonth).padStart(2, "0")}`);
    if (manual) window.alert("Google Sheet 暂时无法读取，已继续显示最近一次内置数据。");
  } finally {
    syncing = false;
    button.disabled = false;
    button.textContent = "刷新数据";
  }
}

function yearRecords(year = state.year) { return records.filter((row) => row.year === year); }
function aggregate(items, keyFn) {
  return [...group(items, keyFn)].map(([key, values]) => ({ key, qty: sum(values, "qty"), revenue: sum(values, "revenue"), rows: values }));
}
function monthly(year = state.year) {
  const grouped = group(yearRecords(year), (row) => row.month);
  return monthLabels.map((label, index) => {
    const rows = grouped.get(index + 1) || [];
    const skuAgg = aggregate(rows, (row) => row.sku).sort((a, b) => b.qty - a.qty);
    return { month: index + 1, label, qty: sum(rows, "qty"), revenue: sum(rows, "revenue"), revenueRecorded: rows.some((row) => row.hasRevenue), skuCount: skuAgg.length, topSku: skuAgg[0]?.key || "—", hasData: rows.length > 0 };
  });
}

function latestDataMonths(items) {
  const qtyMonth = Math.max(0, ...items.map((row) => row.month));
  const revenueMonth = Math.max(0, ...items.filter((row) => row.hasRevenue).map((row) => row.month));
  return { qtyMonth, revenueMonth };
}

function maskAfterMonth(rows, cutoff, field) {
  return rows.map((row) => row.month <= cutoff ? row : { ...row, [field]: 0 });
}

function svgEl(name, attrs = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== "") node.textContent = text;
  return node;
}

function renderGroupedBars(targetId, current, prior, field, formatter) {
  const target = document.getElementById(targetId);
  const width = Math.max(720, target.clientWidth || 720), height = 320;
  const margin = { top: 24, right: 18, bottom: 44, left: 66 };
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const maxValue = Math.max(1, ...current.map((d) => d[field]), ...prior.map((d) => d[field]));
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${field} monthly chart` });
  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + plotH - (plotH * i / 4);
    const value = maxValue * i / 4;
    svg.append(svgEl("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#e5e9e3", "stroke-width": 1 }));
    svg.append(svgEl("text", { x: margin.left - 9, y: y + 4, "text-anchor": "end", fill: "#788078", "font-size": 10 }, formatter(value)));
  }
  const band = plotW / 12, barW = Math.min(19, band * .28);
  current.forEach((row, index) => {
    const center = margin.left + band * index + band / 2;
    const priorValue = prior[index]?.[field] || 0;
    const py = margin.top + plotH - (priorValue / maxValue) * plotH;
    const cy = margin.top + plotH - (row[field] / maxValue) * plotH;
    svg.append(svgEl("rect", { x: center - barW - 2, y: py, width: barW, height: Math.max(0, margin.top + plotH - py), rx: 2, fill: "#b7c0b5" }));
    svg.append(svgEl("rect", { x: center + 2, y: cy, width: barW, height: Math.max(0, margin.top + plotH - cy), rx: 2, fill: "#117f89" }));
    svg.append(svgEl("text", { x: center, y: height - 16, "text-anchor": "middle", fill: "#6d756f", "font-size": 10 }, row.label));
  });
  target.replaceChildren(svg);
}

function renderHorizontalBars(targetId, rows, field, formatter, limit = 10) {
  const target = document.getElementById(targetId);
  const values = rows.slice(0, limit);
  if (!values.length) { target.innerHTML = '<div class="empty-chart">暂无数据</div>'; return; }
  const width = Math.max(680, target.clientWidth || 680), height = Math.max(320, values.length * 34 + 58);
  const margin = { top: 18, right: 88, bottom: 32, left: 122 };
  const plotW = width - margin.left - margin.right, maxValue = Math.max(...values.map((d) => d[field]), 1);
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });
  values.forEach((row, index) => {
    const y = margin.top + index * 34;
    const barWidth = row[field] / maxValue * plotW;
    svg.append(svgEl("text", { x: margin.left - 10, y: y + 15, "text-anchor": "end", fill: "#4f5852", "font-size": 11, "font-family": "IBM Plex Mono" }, String(row.key).replace(/-(ST|MN|AA|AC|AN)-/g, "-$1")));
    svg.append(svgEl("rect", { x: margin.left, y, width: plotW, height: 20, rx: 4, fill: "#edf0eb" }));
    svg.append(svgEl("rect", { x: margin.left, y, width: Math.max(1, barWidth), height: 20, rx: 4, fill: index === 0 ? "#257653" : "#0e7d86" }));
    svg.append(svgEl("text", { x: margin.left + barWidth + 8, y: y + 15, fill: "#29312c", "font-size": 11, "font-weight": 700 }, formatter(row[field])));
  });
  svg.setAttribute("height", height);
  target.replaceChildren(svg);
}

function renderPareto(targetId, rows) {
  const target = document.getElementById(targetId);
  const values = rows.slice(0, 12);
  if (!values.length) { target.innerHTML = '<div class="empty-chart">暂无数据</div>'; return; }
  const width = Math.max(760, target.clientWidth || 760), height = 425;
  const margin = { top: 28, right: 58, bottom: 96, left: 54 };
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const maxQty = Math.max(...values.map((d) => d.qty), 1), total = sum(rows, "qty");
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });
  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + plotH - plotH * i / 4;
    svg.append(svgEl("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#e5e9e3" }));
    svg.append(svgEl("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", fill: "#768078", "font-size": 10 }, number(maxQty * i / 4)));
  }
  const band = plotW / values.length, barW = Math.min(34, band * .58);
  let running = 0, points = [];
  values.forEach((row, index) => {
    const x = margin.left + band * index + band / 2;
    const y = margin.top + plotH - row.qty / maxQty * plotH;
    running += row.qty;
    const py = margin.top + plotH - running / total * plotH;
    points.push(`${x},${py}`);
    svg.append(svgEl("rect", { x: x - barW / 2, y, width: barW, height: margin.top + plotH - y, rx: 3, fill: index === 0 ? "#257653" : "#0e7d86" }));
    svg.append(svgEl("text", { x, y: y - 7, "text-anchor": "middle", fill: "#4d5750", "font-size": 10, "font-weight": 700 }, number(row.qty)));
    svg.append(svgEl("text", { x, y: height - 81, transform: `rotate(-48 ${x} ${height - 81})`, "text-anchor": "end", fill: "#68716b", "font-size": 9, "font-family": "IBM Plex Mono" }, row.key));
  });
  svg.append(svgEl("polyline", { points: points.join(" "), fill: "none", stroke: "#c77a19", "stroke-width": 2.5, "stroke-linejoin": "round" }));
  points.forEach((point, index) => { const [x, y] = point.split(",").map(Number); svg.append(svgEl("circle", { cx: x, cy: y, r: 3.5, fill: "#c77a19", stroke: "#fff", "stroke-width": 1.5 })); if ([3, 7, 11].includes(index)) svg.append(svgEl("text", { x, y: y - 9, "text-anchor": "middle", fill: "#a36414", "font-size": 9 }, percent(values.slice(0, index + 1).reduce((t, d) => t + d.qty, 0) / total, 0))); });
  target.replaceChildren(svg);
}

function renderKpis() {
  const currentRows = yearRecords(), priorRows = yearRecords(state.year - 1);
  const currentQty = sum(currentRows, "qty"), currentRevenue = sum(currentRows, "revenue");
  const { qtyMonth, revenueMonth } = latestDataMonths(currentRows);
  const priorQty = sum(priorRows.filter((row) => row.month <= qtyMonth), "qty");
  const priorRevenue = sum(priorRows.filter((row) => row.month <= revenueMonth), "revenue");
  const revenueQty = sum(currentRows.filter((row) => row.hasRevenue), "qty");
  const skuRows = aggregate(currentRows, (row) => row.sku).sort((a, b) => b.qty - a.qty);
  const modelRows = aggregate(currentRows, (row) => row.model).sort((a, b) => b.revenue - a.revenue);
  const cards = [
    ["YTD REV", money(currentRevenue), `${state.year} Jan–${monthLabels[revenueMonth - 1]} · REV 已录`],
    ["YTD QTY", number(currentQty), `${state.year} Jan–${monthLabels[qtyMonth - 1]} · sell-out`],
    ["REV 同比", percent(growth(currentRevenue, priorRevenue)), `${state.year - 1} Jan–${monthLabels[revenueMonth - 1]} ${money(priorRevenue)}`, tone(growth(currentRevenue, priorRevenue))],
    ["QTY 同比", percent(growth(currentQty, priorQty)), `${state.year - 1} Jan–${monthLabels[qtyMonth - 1]} ${number(priorQty)} units`, tone(growth(currentQty, priorQty))],
    ["平均 ASP", money(currentRevenue / Math.max(revenueQty, 1)), `截至 ${monthLabels[revenueMonth - 1]} · REV / QTY`],
    ["销量第一 SKU", skuRows[0]?.key || "—", `${number(skuRows[0]?.qty)} units`, "mono"],
  ];
  document.getElementById("kpiGrid").innerHTML = cards.map(([label, value, sub, className = ""]) => `<article class="panel kpi"><div class="kpi-label">${label}</div><div class="kpi-value ${className}">${escapeHtml(value)}</div><div class="kpi-sub">${escapeHtml(sub)}</div></article>`).join("");

  const currentMonthly = monthly(), priorMonthly = monthly(state.year - 1);
  const latestQty = currentMonthly[qtyMonth - 1];
  const latestRevenue = currentMonthly[revenueMonth - 1], priorLatestRevenue = priorMonthly[revenueMonth - 1];
  const latestGrowth = growth(latestRevenue.revenue, priorLatestRevenue.revenue);
  document.getElementById("conclusionPeriod").textContent = `QTY 至 ${state.year}.${String(qtyMonth).padStart(2, "0")} ｜ REV 至 ${state.year}.${String(revenueMonth).padStart(2, "0")}`;
  document.getElementById("conclusionText").innerHTML = qtyMonth > revenueMonth
    ? `${qtyMonth}月已录销量 <strong>${number(latestQty.qty)} units</strong>，本月销量第一 SKU 为 <strong>${escapeHtml(latestQty.topSku)}</strong>；REV 尚未录入至 ${qtyMonth}月。最近完整营收月为 ${revenueMonth}月：<strong>${money(latestRevenue.revenue)}</strong>，同比 <span class="${tone(latestGrowth)}">${percent(latestGrowth)}</span>。`
    : `${qtyMonth}月 Micro Center 录入营收 <strong>${money(latestRevenue.revenue)}</strong>、销量 <strong>${number(latestQty.qty)} units</strong>，营收同比 <span class="${tone(latestGrowth)}">${percent(latestGrowth)}</span>；本月贡献最高 SKU 为 <strong>${escapeHtml(latestQty.topSku)}</strong>。`;
  document.getElementById("coverageBadge").textContent = `QTY ${qtyMonth}/12 · REV ${revenueMonth}/12`;
  document.getElementById("coverageBadge").classList.toggle("good", qtyMonth >= 12 && revenueMonth >= 12);
  document.getElementById("yearProgress").style.width = `${qtyMonth / 12 * 100}%`;
  document.getElementById("insightMetrics").innerHTML = [
    ["QTY / REV 周期", `${state.year}.${String(qtyMonth).padStart(2, "0")} / ${state.year}.${String(revenueMonth).padStart(2, "0")}`],
    ["同期营收", money(priorRevenue)],
    ["营收增量", money(currentRevenue - priorRevenue)],
    ["活跃 SKU", `${skuRows.length}`],
    ["主力 Model", modelRows[0]?.key || "—"],
  ].map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${escapeHtml(dd)}</dd></div>`).join("");
  const topModelShare = modelRows[0] ? modelRows[0].revenue / currentRevenue : 0;
  const topSkuShare = skuRows[0] ? skuRows[0].qty / currentQty : 0;
  const periodNote = qtyMonth > revenueMonth
    ? `QTY 已更新到 ${qtyMonth}月，REV 仅更新到 ${revenueMonth}月；营收同比统一按 1–${revenueMonth}月计算。`
    : `QTY 与 REV 均已更新到 ${qtyMonth}月，同比使用相同月份口径。`;
  document.getElementById("insightNotes").innerHTML = `
    <div class="insight-note">${escapeHtml(modelRows[0]?.key || "—")} 是当前主力 Model，贡献 ${percent(topModelShare)} 的 YTD 营收。</div>
    <div class="insight-note ${revenueMonth < qtyMonth ? "warning" : ""}">${periodNote}</div>
    <div class="insight-note ${latestGrowth < 0 ? "warning" : ""}">${revenueMonth}月营收同比 ${percent(latestGrowth)}，${latestGrowth >= 0 ? "保持正向增长。" : "需要复核活动、供货与门店动销。"}</div>
    <div class="insight-note">销量第一 SKU 占 YTD QTY 的 ${percent(topSkuShare)}，组合集中度${topSkuShare > .25 ? "较高" : "相对健康"}。</div>`;
  return { currentRows, skuRows, modelRows, qtyMonth, revenueMonth };
}

function renderOverview() {
  const { skuRows, modelRows, revenueMonth } = renderKpis();
  const current = maskAfterMonth(monthly(), revenueMonth, "revenue");
  const prior = maskAfterMonth(monthly(state.year - 1), revenueMonth, "revenue");
  document.getElementById("overviewRevenueNote").textContent = `REV 已录至 ${revenueMonth}月，仅比较 1–${revenueMonth}月`;
  renderGroupedBars("overviewMonthlyChart", current, prior, "revenue", (v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
  renderHorizontalBars("modelMixChart", modelRows, "revenue", money, 9);
  const maxQty = Math.max(...skuRows.map((row) => row.qty), 1);
  document.getElementById("topSkuList").innerHTML = skuRows.slice(0, 8).map((row, index) => `<div class="rank-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span><span class="rank-sku" title="${escapeHtml(row.key)}">${escapeHtml(row.key)}</span><span class="rank-track"><span style="width:${row.qty / maxQty * 100}%"></span></span><span class="rank-value">${number(row.qty)}</span></div>`).join("");
}

function renderMonthly() {
  const current = monthly(), prior = monthly(state.year - 1);
  const { revenueMonth } = latestDataMonths(yearRecords());
  document.getElementById("monthlyRevenueNote").textContent = `USD · 已录至 ${revenueMonth}月`;
  renderGroupedBars("monthlyRevenueChart", maskAfterMonth(current, revenueMonth, "revenue"), maskAfterMonth(prior, revenueMonth, "revenue"), "revenue", (v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
  renderGroupedBars("monthlyQtyChart", current, prior, "qty", (v) => number(v));
  document.getElementById("monthlyTableBody").innerHTML = current.filter((row) => row.hasData).map((row) => {
    const priorRow = prior[row.month - 1];
    const qGrowth = growth(row.qty, priorRow.qty), rGrowth = row.revenueRecorded ? growth(row.revenue, priorRow.revenue) : NaN;
    const revenueCell = row.revenueRecorded ? money(row.revenue) : '<span class="pending-value">待录入</span>';
    const aspCell = row.revenueRecorded ? money(row.revenue / Math.max(row.qty, 1)) : "—";
    return `<tr><td>${state.year} ${row.label}</td><td>${number(row.qty)}</td><td class="${tone(qGrowth)}">${percent(qGrowth)}</td><td>${revenueCell}</td><td class="${tone(rGrowth)}">${percent(rGrowth)}</td><td>${aspCell}</td><td>${row.skuCount}</td><td class="mono">${escapeHtml(row.topSku)}</td></tr>`;
  }).join("");
}

function monthlySkuRows(year, month) {
  const current = records.filter((row) => row.year === year && row.month === month);
  const prior = records.filter((row) => row.year === year - 1 && row.month === month);
  const priorMap = new Map(aggregate(prior, (row) => row.sku).map((row) => [row.key, row]));
  return aggregate(current, (row) => row.sku).map((row) => {
    const priorRow = priorMap.get(row.key);
    return {
      ...row,
      model: row.rows[0]?.model || "—",
      revenueRecorded: row.rows.some((item) => item.hasRevenue),
      priorQty: priorRow?.qty || 0,
      priorRevenue: priorRow?.revenue || 0,
    };
  }).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
}

function renderMonthSkuMatrix(filteredSkus) {
  const metric = state.matrixMetric;
  const dataMap = new Map();
  yearRecords().forEach((row) => {
    const key = `${row.sku}::${row.month}`;
    if (!dataMap.has(key)) dataMap.set(key, { qty: 0, revenue: 0, revenueRecorded: false });
    const cell = dataMap.get(key);
    cell.qty += row.qty;
    cell.revenue += row.revenue;
    cell.revenueRecorded ||= row.hasRevenue;
  });
  const values = [];
  filteredSkus.forEach((row) => monthLabels.forEach((_, index) => {
    const cell = dataMap.get(`${row.key}::${index + 1}`);
    if (cell && (metric === "qty" || cell.revenueRecorded)) values.push(cell[metric]);
  }));
  const maxValue = Math.max(1, ...values);
  const totals = monthLabels.map((_, index) => {
    const monthRows = yearRecords().filter((row) => row.month === index + 1);
    return { qty: sum(monthRows, "qty"), revenue: sum(monthRows, "revenue"), revenueRecorded: monthRows.some((row) => row.hasRevenue) };
  });
  document.getElementById("monthSkuMatrixHead").innerHTML = `<tr><th>SKU</th><th>Model</th>${monthLabels.map((label) => `<th>${label}</th>`).join("")}<th>Total</th></tr>`;
  const body = filteredSkus.map((row) => {
    let rowTotal = 0;
    const cells = monthLabels.map((_, index) => {
      const cell = dataMap.get(`${row.key}::${index + 1}`);
      if (!cell) return '<td class="matrix-cell zero">—</td>';
      if (metric === "revenue" && !cell.revenueRecorded) return '<td class="matrix-cell pending">待录</td>';
      const value = cell[metric];
      rowTotal += value;
      const heat = value ? (.08 + value / maxValue * .48).toFixed(3) : 0;
      const display = metric === "revenue" ? (value >= 1000 ? `$${number(value / 1000, 1)}k` : money(value)) : number(value);
      return `<td class="matrix-cell ${value ? "" : "zero"}" style="--heat:${heat}">${display}</td>`;
    }).join("");
    return `<tr><td class="mono">${escapeHtml(row.key)}</td><td>${escapeHtml(row.model)}</td>${cells}<td>${metric === "revenue" ? money(rowTotal) : number(rowTotal)}</td></tr>`;
  }).join("");
  const totalCells = totals.map((cell) => metric === "revenue" && !cell.revenueRecorded ? '<td class="pending-value">待录</td>' : `<td>${metric === "revenue" ? money(cell.revenue) : number(cell.qty)}</td>`).join("");
  document.getElementById("monthSkuMatrixBody").classList.toggle("matrix-revenue", metric === "revenue");
  document.getElementById("monthSkuMatrixBody").innerHTML = `${body}<tr class="matrix-total"><td>月度合计</td><td>—</td>${totalCells}<td>${metric === "revenue" ? money(sum(yearRecords(), "revenue")) : number(sum(yearRecords(), "qty"))}</td></tr>`;
}

function renderMonthSku() {
  const availableMonths = [...new Set(yearRecords().map((row) => row.month))].sort((a, b) => a - b);
  if (!availableMonths.includes(Number(state.monthSkuMonth))) state.monthSkuMonth = Math.max(...availableMonths);
  const select = document.getElementById("monthSkuSelect");
  select.innerHTML = availableMonths.slice().reverse().map((month) => `<option value="${month}">${state.year}年 ${month}月</option>`).join("");
  select.value = state.monthSkuMonth;

  const allRows = monthlySkuRows(state.year, state.monthSkuMonth);
  const query = state.monthSkuQuery.trim().toLowerCase();
  const filtered = allRows.filter((row) => !query || `${row.key} ${row.model}`.toLowerCase().includes(query));
  const yearSkuRows = aggregate(yearRecords(), (row) => row.sku).map((row) => ({ ...row, model: row.rows[0]?.model || "—" })).sort((a, b) => b.qty - a.qty);
  const filteredYearSkus = yearSkuRows.filter((row) => !query || `${row.key} ${row.model}`.toLowerCase().includes(query));
  const totalQty = sum(allRows, "qty"), totalRevenue = sum(allRows, "revenue");
  const revenueRecorded = allRows.some((row) => row.revenueRecorded);
  const modelRows = aggregate(allRows.flatMap((row) => row.rows), (row) => row.model).sort((a, b) => b.qty - a.qty);
  const cards = [
    ["本月 QTY", number(totalQty), `${allRows.length} 个活跃 SKU`],
    ["本月 REV", revenueRecorded ? money(totalRevenue) : "待录入", revenueRecorded ? "源表已录 REV" : "当前仅有 QTY", revenueRecorded ? "" : "pending-value"],
    ["销量第一 SKU", allRows[0]?.key || "—", `${number(allRows[0]?.qty)} units`, "mono"],
    ["主力 Model", modelRows[0]?.key || "—", `${number(modelRows[0]?.qty)} units`],
    ["平均 ASP", revenueRecorded ? money(totalRevenue / Math.max(totalQty, 1)) : "—", revenueRecorded ? "REV / QTY" : "等待 REV"],
  ];
  document.getElementById("monthSkuKpis").innerHTML = cards.map(([label, value, sub, className = ""]) => `<article class="panel kpi"><div class="kpi-label">${label}</div><div class="kpi-value ${className}">${escapeHtml(value)}</div><div class="kpi-sub">${escapeHtml(sub)}</div></article>`).join("");
  document.getElementById("monthSkuTableTitle").textContent = `${state.year}年${state.monthSkuMonth}月 SKU 明细`;
  document.getElementById("monthSkuTableNote").textContent = revenueRecorded ? "QTY、REV 与上年同月逐 SKU 对照" : "本月 REV 尚未录入，先展示 QTY 与 QTY 同比";
  document.getElementById("monthSkuCount").textContent = `${filtered.length} / ${allRows.length} 个 SKU`;
  document.getElementById("monthSkuTableBody").innerHTML = filtered.map((row) => {
    const qtyGrowth = growth(row.qty, row.priorQty);
    const revenueGrowth = row.revenueRecorded ? growth(row.revenue, row.priorRevenue) : NaN;
    return `<tr><td>${allRows.indexOf(row) + 1}</td><td class="mono">${escapeHtml(row.key)}</td><td>${escapeHtml(row.model)}</td><td>${number(row.qty)}</td><td>${percent(row.qty / Math.max(totalQty, 1))}</td><td class="${tone(qtyGrowth)}">${percent(qtyGrowth)}</td><td>${row.revenueRecorded ? money(row.revenue) : '<span class="pending-value">待录入</span>'}</td><td class="${tone(revenueGrowth)}">${percent(revenueGrowth)}</td><td>${row.revenueRecorded ? money(row.revenue / Math.max(row.qty, 1)) : "—"}</td></tr>`;
  }).join("");
  renderMonthSkuMatrix(filteredYearSkus);
}

function renderSku() {
  const current = yearRecords(), prior = yearRecords(state.year - 1);
  const priorMap = new Map(aggregate(prior, (row) => row.sku).map((row) => [row.key, row]));
  const totalRevenue = sum(current, "revenue");
  const skuRows = aggregate(current, (row) => row.sku).map((row) => ({ ...row, model: row.rows[0]?.model || "—", revenueQty: sum(row.rows.filter((item) => item.hasRevenue), "qty"), priorQty: priorMap.get(row.key)?.qty || 0 })).sort((a, b) => b.qty - a.qty);
  const modelRows = aggregate(current, (row) => row.model).sort((a, b) => b.revenue - a.revenue);
  renderPareto("paretoChart", skuRows);
  renderHorizontalBars("modelPerformanceChart", modelRows, "revenue", money, 11);
  const query = state.skuQuery.trim().toLowerCase();
  const filtered = skuRows.filter((row) => !query || `${row.key} ${row.model}`.toLowerCase().includes(query));
  document.getElementById("skuCountLabel").textContent = `${filtered.length} 个 SKU`;
  document.getElementById("skuTableBody").innerHTML = filtered.map((row) => {
    const qGrowth = growth(row.qty, row.priorQty);
    return `<tr><td class="mono">${escapeHtml(row.key)}</td><td>${escapeHtml(row.model)}</td><td>${number(row.qty)}</td><td>${money(row.revenue)}</td><td>${money(row.revenue / Math.max(row.revenueQty, 1))}</td><td>${percent(row.revenue / totalRevenue)}</td><td>${number(row.priorQty)}</td><td class="${tone(qGrowth)}">${percent(qGrowth)}</td></tr>`;
  }).join("");
}

function renderRawData() {
  const rows = yearRecords().sort((a, b) => b.month - a.month || b.revenue - a.revenue);
  document.getElementById("rawTableBody").innerHTML = rows.map((row) => `<tr><td>${row.year}</td><td>${String(row.month).padStart(2, "0")}</td><td>MC</td><td class="mono">${escapeHtml(row.sku)}</td><td>${escapeHtml(row.model)}</td><td>${number(row.qty)}</td><td>${row.hasRevenue ? money(row.revenue) : '<span class="pending-value">待录入</span>'}</td></tr>`).join("");
}

function renderAll() {
  renderOverview(); renderMonthly(); renderMonthSku(); renderSku(); renderRawData();
}

document.getElementById("yearSelect").addEventListener("change", (event) => { state.year = Number(event.target.value); renderAll(); });
document.getElementById("resetFilters").addEventListener("click", () => {
  state.year = latestYear; state.skuQuery = ""; state.monthSkuMonth = null; state.monthSkuQuery = ""; state.matrixMetric = "qty";
  document.getElementById("yearSelect").value = latestYear;
  document.getElementById("skuSearch").value = "";
  document.getElementById("monthSkuSearch").value = "";
  document.querySelectorAll("[data-matrix-metric]").forEach((item) => item.classList.toggle("active", item.dataset.matrixMetric === "qty"));
  renderAll();
});
document.getElementById("refreshData").addEventListener("click", () => syncLiveData({ manual: true }));
document.getElementById("skuSearch").addEventListener("input", (event) => { state.skuQuery = event.target.value; renderSku(); });
document.getElementById("monthSkuSelect").addEventListener("change", (event) => { state.monthSkuMonth = Number(event.target.value); renderMonthSku(); });
document.getElementById("monthSkuSearch").addEventListener("input", (event) => { state.monthSkuQuery = event.target.value; renderMonthSku(); });
document.querySelectorAll("[data-matrix-metric]").forEach((button) => button.addEventListener("click", () => {
  state.matrixMetric = button.dataset.matrixMetric;
  document.querySelectorAll("[data-matrix-metric]").forEach((item) => item.classList.toggle("active", item === button));
  renderMonthSku();
}));
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${tab.dataset.view}`));
}));

setSourceStatus("syncing", "正在同步 Google Sheet 的 Micro Center 数据…");
syncLiveData();
window.setInterval(() => syncLiveData(), AUTO_REFRESH_MS);
