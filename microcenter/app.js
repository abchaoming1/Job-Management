const source = window.MC_DATA;
const records = source.records.map((row) => ({ ...row, qty: Number(row.qty), revenue: Number(row.revenue) }));
const years = [...new Set(records.map((row) => Number(row.year)))].sort((a, b) => a - b);
const latestYear = Math.max(...years);
const latestMonth = Math.max(...records.filter((row) => row.year === latestYear).map((row) => Number(row.month)));
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const state = { year: latestYear, skuQuery: "" };
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

function yearRecords(year = state.year) { return records.filter((row) => row.year === year); }
function aggregate(items, keyFn) {
  return [...group(items, keyFn)].map(([key, values]) => ({ key, qty: sum(values, "qty"), revenue: sum(values, "revenue"), rows: values }));
}
function monthly(year = state.year) {
  const grouped = group(yearRecords(year), (row) => row.month);
  return monthLabels.map((label, index) => {
    const rows = grouped.get(index + 1) || [];
    const skuAgg = aggregate(rows, (row) => row.sku).sort((a, b) => b.qty - a.qty);
    return { month: index + 1, label, qty: sum(rows, "qty"), revenue: sum(rows, "revenue"), skuCount: skuAgg.length, topSku: skuAgg[0]?.key || "—", hasData: rows.length > 0 };
  });
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
  const maxRecordedMonth = Math.max(...currentRows.map((row) => row.month));
  const priorYtdRows = priorRows.filter((row) => row.month <= maxRecordedMonth);
  const priorQty = sum(priorYtdRows, "qty"), priorRevenue = sum(priorYtdRows, "revenue");
  const skuRows = aggregate(currentRows, (row) => row.sku).sort((a, b) => b.qty - a.qty);
  const modelRows = aggregate(currentRows, (row) => row.model).sort((a, b) => b.revenue - a.revenue);
  const cards = [
    ["YTD REV", money(currentRevenue), `${state.year} Jan–${monthLabels[maxRecordedMonth - 1]}`],
    ["YTD QTY", number(currentQty), "sell-out units"],
    ["REV 同比", percent(growth(currentRevenue, priorRevenue)), `${state.year - 1} 同期 ${money(priorRevenue)}`, tone(growth(currentRevenue, priorRevenue))],
    ["QTY 同比", percent(growth(currentQty, priorQty)), `${state.year - 1} 同期 ${number(priorQty)} units`, tone(growth(currentQty, priorQty))],
    ["平均 ASP", money(currentRevenue / Math.max(currentQty, 1)), "REV / QTY"],
    ["销量第一 SKU", skuRows[0]?.key || "—", `${number(skuRows[0]?.qty)} units`, "mono"],
  ];
  document.getElementById("kpiGrid").innerHTML = cards.map(([label, value, sub, className = ""]) => `<article class="panel kpi"><div class="kpi-label">${label}</div><div class="kpi-value ${className}">${escapeHtml(value)}</div><div class="kpi-sub">${escapeHtml(sub)}</div></article>`).join("");

  const latest = monthly()[maxRecordedMonth - 1], priorLatest = monthly(state.year - 1)[maxRecordedMonth - 1];
  const latestGrowth = growth(latest.revenue, priorLatest.revenue);
  document.getElementById("conclusionPeriod").textContent = `${state.year}年${maxRecordedMonth}月 · 源表最新已录`;
  document.getElementById("conclusionText").innerHTML = `${maxRecordedMonth}月 Micro Center 录入营收 <strong>${money(latest.revenue)}</strong>、销量 <strong>${number(latest.qty)} units</strong>，营收同比 <span class="${tone(latestGrowth)}">${percent(latestGrowth)}</span>；本月贡献最高 SKU 为 <strong>${escapeHtml(latest.topSku)}</strong>。`;
  document.getElementById("coverageBadge").textContent = `${maxRecordedMonth}/12 MONTHS`;
  document.getElementById("coverageBadge").classList.toggle("good", maxRecordedMonth >= 12);
  document.getElementById("yearProgress").style.width = `${maxRecordedMonth / 12 * 100}%`;
  document.getElementById("insightMetrics").innerHTML = [
    ["当前数据周期", `${state.year}.${String(maxRecordedMonth).padStart(2, "0")}`],
    ["同期营收", money(priorRevenue)],
    ["营收增量", money(currentRevenue - priorRevenue)],
    ["活跃 SKU", `${skuRows.length}`],
    ["主力 Model", modelRows[0]?.key || "—"],
  ].map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${escapeHtml(dd)}</dd></div>`).join("");
  const topModelShare = modelRows[0] ? modelRows[0].revenue / currentRevenue : 0;
  const topSkuShare = skuRows[0] ? skuRows[0].qty / currentQty : 0;
  document.getElementById("insightNotes").innerHTML = `
    <div class="insight-note">${escapeHtml(modelRows[0]?.key || "—")} 是当前主力 Model，贡献 ${percent(topModelShare)} 的 YTD 营收。</div>
    <div class="insight-note ${latestGrowth < 0 ? "warning" : ""}">${maxRecordedMonth}月营收同比 ${percent(latestGrowth)}，${latestGrowth >= 0 ? "保持正向增长。" : "需要复核活动、供货与门店动销。"}</div>
    <div class="insight-note">销量第一 SKU 占 YTD QTY 的 ${percent(topSkuShare)}，组合集中度${topSkuShare > .25 ? "较高" : "相对健康"}。</div>`;
  return { currentRows, skuRows, modelRows };
}

function renderOverview() {
  const { skuRows, modelRows } = renderKpis();
  renderGroupedBars("overviewMonthlyChart", monthly(), monthly(state.year - 1), "revenue", (v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
  renderHorizontalBars("modelMixChart", modelRows, "revenue", money, 9);
  const maxQty = Math.max(...skuRows.map((row) => row.qty), 1);
  document.getElementById("topSkuList").innerHTML = skuRows.slice(0, 8).map((row, index) => `<div class="rank-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span><span class="rank-sku" title="${escapeHtml(row.key)}">${escapeHtml(row.key)}</span><span class="rank-track"><span style="width:${row.qty / maxQty * 100}%"></span></span><span class="rank-value">${number(row.qty)}</span></div>`).join("");
}

function renderMonthly() {
  const current = monthly(), prior = monthly(state.year - 1);
  renderGroupedBars("monthlyRevenueChart", current, prior, "revenue", (v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
  renderGroupedBars("monthlyQtyChart", current, prior, "qty", (v) => number(v));
  document.getElementById("monthlyTableBody").innerHTML = current.filter((row) => row.hasData).map((row) => {
    const priorRow = prior[row.month - 1];
    const qGrowth = growth(row.qty, priorRow.qty), rGrowth = growth(row.revenue, priorRow.revenue);
    return `<tr><td>${state.year} ${row.label}</td><td>${number(row.qty)}</td><td class="${tone(qGrowth)}">${percent(qGrowth)}</td><td>${money(row.revenue)}</td><td class="${tone(rGrowth)}">${percent(rGrowth)}</td><td>${money(row.revenue / Math.max(row.qty, 1))}</td><td>${row.skuCount}</td><td class="mono">${escapeHtml(row.topSku)}</td></tr>`;
  }).join("");
}

function renderSku() {
  const current = yearRecords(), prior = yearRecords(state.year - 1);
  const priorMap = new Map(aggregate(prior, (row) => row.sku).map((row) => [row.key, row]));
  const totalRevenue = sum(current, "revenue");
  const skuRows = aggregate(current, (row) => row.sku).map((row) => ({ ...row, model: row.rows[0]?.model || "—", priorQty: priorMap.get(row.key)?.qty || 0 })).sort((a, b) => b.qty - a.qty);
  const modelRows = aggregate(current, (row) => row.model).sort((a, b) => b.revenue - a.revenue);
  renderPareto("paretoChart", skuRows);
  renderHorizontalBars("modelPerformanceChart", modelRows, "revenue", money, 11);
  const query = state.skuQuery.trim().toLowerCase();
  const filtered = skuRows.filter((row) => !query || `${row.key} ${row.model}`.toLowerCase().includes(query));
  document.getElementById("skuCountLabel").textContent = `${filtered.length} 个 SKU`;
  document.getElementById("skuTableBody").innerHTML = filtered.map((row) => {
    const qGrowth = growth(row.qty, row.priorQty);
    return `<tr><td class="mono">${escapeHtml(row.key)}</td><td>${escapeHtml(row.model)}</td><td>${number(row.qty)}</td><td>${money(row.revenue)}</td><td>${money(row.revenue / Math.max(row.qty, 1))}</td><td>${percent(row.revenue / totalRevenue)}</td><td>${number(row.priorQty)}</td><td class="${tone(qGrowth)}">${percent(qGrowth)}</td></tr>`;
  }).join("");
}

function renderRawData() {
  const rows = yearRecords().sort((a, b) => b.month - a.month || b.revenue - a.revenue);
  document.getElementById("rawTableBody").innerHTML = rows.map((row) => `<tr><td>${row.year}</td><td>${String(row.month).padStart(2, "0")}</td><td>MC</td><td class="mono">${escapeHtml(row.sku)}</td><td>${escapeHtml(row.model)}</td><td>${number(row.qty)}</td><td>${money(row.revenue)}</td></tr>`).join("");
}

function renderAll() {
  renderOverview(); renderMonthly(); renderSku(); renderRawData();
}

document.getElementById("yearSelect").innerHTML = years.slice().reverse().map((year) => `<option value="${year}">${year}</option>`).join("");
document.getElementById("yearSelect").value = state.year;
document.getElementById("yearSelect").addEventListener("change", (event) => { state.year = Number(event.target.value); renderAll(); });
document.getElementById("resetFilters").addEventListener("click", () => { state.year = latestYear; state.skuQuery = ""; document.getElementById("yearSelect").value = latestYear; document.getElementById("skuSearch").value = ""; renderAll(); });
document.getElementById("skuSearch").addEventListener("input", (event) => { state.skuQuery = event.target.value; renderSku(); });
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${tab.dataset.view}`));
}));

const minRecord = records.reduce((best, row) => row.year * 100 + row.month < best ? row.year * 100 + row.month : best, Infinity);
const maxRecord = records.reduce((best, row) => row.year * 100 + row.month > best ? row.year * 100 + row.month : best, 0);
document.getElementById("sourceSummary").textContent = `源表：Kyle渠道数据看板 ｜ 仅 MC ｜ 最新数据 ${latestYear}-${String(latestMonth).padStart(2, "0")}`;
document.getElementById("rowCount").textContent = number(records.length);
document.getElementById("periodRange").textContent = `${String(minRecord).slice(0, 4)}.${String(minRecord).slice(4)}–${String(maxRecord).slice(0, 4)}.${String(maxRecord).slice(4)}`;
renderAll();

