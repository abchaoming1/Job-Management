(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = text => String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, digits = 0) => v === null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const money = (v, digits = 0) => v === null || !Number.isFinite(v) ? "—" : `${v < 0 ? "−" : ""}$${num(Math.abs(v), digits)}`;
  const pct = v => v === null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${num(v * 100, 1)}%`;
  const share = v => v === null || !Number.isFinite(v) ? "—" : `${num(v * 100, 1)}%`;
  const delta = v => `<span class="${v === null ? "neutral" : v >= 0 ? "positive" : "negative"}">${pct(v)}</span>`;
  const CACHE_KEY = "mc-workbook-snapshot-v2";
  const state = { year: 2025, month: null, level: "sku", metric: "qty", sku: null, monthSearch: "", matrixSearch: "", snapshot: null, sourceKind: "cached", syncing: false };
  let records = [], years = [], summaryExport = [];
  let yearRows = new Map(), periodRows = new Map(), periodTotals = new Map(), productMonths = new Map(), yearTotals = new Map();
  const rows = (year = state.year, month = null) => (month === null ? yearRows.get(year) : periodRows.get(`${year}-${month}`)) || [];
  const selected = () => yearTotals.get(state.year);
  const stamp = iso => iso ? new Date(iso).toLocaleString("zh-CN", { hour12: false }) : "未知";
  const monthList = months => !months.length ? "暂无" : months.length === 12 ? "1–12 月" : months.every((m, i) => !i || m === months[i - 1] + 1) ? `${months[0]}–${months.at(-1)} 月` : months.map(m => `${m}月`).join("、");
  const yearPeriod = a => a.qtyMonths.length === 12 && a.revenueMonths.length === 12 ? "全年 1–12 月" : `已录 ${monthList(a.months.filter(m => m.rows).map(m => m.month))}`;
  const asp = items => { const paired = items.filter(r => r.qty !== null && r.revenue !== null), t = MC.total(paired); return t.qty > 0 ? t.revenue / t.qty : null; };
  function amount(t, metric, digits = 0) {
    const result = t[`${metric}Known`] ? (metric === "revenue" ? money(t[metric], digits) : num(t[metric])) : "—";
    return result + (t.rows && !t[`${metric}Complete`] ? "<small>未录齐</small>" : "");
  }
  function monthValue(year, month, metric, sku = null, level = state.level) {
    const t = periodTotals.get(`${year}-${month}`);
    if (!t?.[`${metric}Complete`]) return null;
    if (sku === null) return t[metric];
    const key = `${year}-${month}|${level}|${sku}`;
    if (!productMonths.has(key)) productMonths.set(key, MC.total(rows(year, month).filter(r => r[level] === sku)));
    return productMonths.get(key)[metric];
  }
  function productValue(year, sku, months, metric, level = state.level) {
    if (!months.length || months.some(m => monthValue(year, m, metric) === null)) return null;
    return months.reduce((sum, month) => sum + monthValue(year, month, metric, sku, level), 0);
  }
  function monthGrowth(year, month, metric, kind, sku = null, level = state.level) {
    const py = kind === "yoy" ? year - 1 : month === 1 ? year - 1 : year;
    const pm = kind === "yoy" ? month : month === 1 ? 12 : month - 1;
    return MC.growth(monthValue(year, month, metric, sku, level), monthValue(py, pm, metric, sku, level));
  }
  function mini(label, value, product = false) { return `<div class="mini-metric"><small>${label}</small><strong${product ? ' class="product"' : ""}>${value}</strong></div>`; }
  function empty(cols, text = "没有符合筛选条件的数据") { return `<tr><td class="empty" colspan="${cols}">${text}</td></tr>`; }

  function chart(id, metric, sku = null) {
    const current = MC.MONTHS.map(m => monthValue(state.year, m, metric, sku));
    const prior = MC.MONTHS.map(m => monthValue(state.year - 1, m, metric, sku));
    const values = [...current, ...prior].filter(v => v !== null);
    const w = 590, h = 275, left = 54, right = 10, top = 25, bottom = 34;
    const max = Math.max(1, ...values), min = Math.min(0, ...values), upper = max * 1.13, lower = min * 1.13;
    const y = value => top + (upper - value) / (upper - lower) * (h - top - bottom), baseline = y(0);
    const step = (w - left - right) / 12;
    const format = value => metric === "revenue" ? money(value, 2) : num(value);
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(sku || "Micro Center")} ${state.year} 年月度${metric === "revenue" ? "营收" : "销量"}，明细见下方表格"><title>${state.year} 与 ${state.year - 1} 同月对照</title>`;
    for (let i = 0; i <= 4; i++) {
      const value = lower + (upper - lower) * i / 4, ypos = y(value);
      const label = metric === "revenue" ? `${value < 0 ? "−" : ""}$${num(Math.abs(value) / 1000, 0)}k` : num(value);
      svg += `<line x1="${left}" y1="${ypos}" x2="${w - right}" y2="${ypos}" stroke="#e5e8df"/><text x="${left - 9}" y="${ypos + 4}" text-anchor="end">${label}</text>`;
    }
    for (let i = 0; i < 12; i++) {
      const center = left + (i + .5) * step;
      svg += `<g class="chart-hit"${sku === null ? ` tabindex="0" role="button" data-month="${i + 1}" aria-label="查看 ${state.year} 年 ${i + 1} 月 SKU 明细"` : ""}><title>${i + 1}月：${state.year} ${format(current[i])}；${state.year - 1} ${format(prior[i])}</title>`;
      for (const [value, x, color] of [[prior[i], center - 13, "#c7baa4"], [current[i], center + 1, "#0f766e"]]) {
        if (value !== null) svg += `<rect x="${x}" y="${Math.min(y(value), baseline)}" width="11" height="${Math.max(value === 0 ? 1 : 0, Math.abs(baseline - y(value)))}" rx="2" fill="${color}"/>`;
      }
      if (current[i] === null) svg += `<text x="${center + 6}" y="${baseline - 4}" text-anchor="middle">—</text>`;
      svg += `<text x="${center}" y="${h - 10}" text-anchor="middle">${i + 1}月</text></g>`;
    }
    $(id).innerHTML = svg + "</svg>";
  }

  function renderAnnual() {
    const a = selected(), revYoY = MC.comparison(records, state.year, "revenue"), qtyYoY = MC.comparison(records, state.year, "qty");
    const complete = a.revenueMonths.length === 12 && a.qtyMonths.length === 12;
    $("annualYear").textContent = $("navYear").textContent = state.year;
    document.title = `Micro Center | ${state.year} 年度销售看板`;
    $("annualPeriod").textContent = `${state.year} 年 ${yearPeriod(a)}`;
    $("coverageBadge").textContent = complete ? "12 / 12 个月已录齐" : `销量 ${a.qtyMonths.length}/12 · 营收 ${a.revenueMonths.length}/12`;
    $("coverageBadge").classList.toggle("incomplete", !complete);
    const scope = complete ? "全年" : "已录";
    const cards = [
      [`${scope}营收 REV`, a.revenueKnown ? money(a.revenue, 2) : "—", `USD · ${a.rows} 条原表记录`],
      [`${scope}销量 QTY`, a.qtyKnown ? num(a.qty) : "—", `${state.year} 年 · ${monthList(a.qtyMonths)}`],
      [a.revenueMonths.length === 12 ? "营收年度同比" : "营收已录月份同比", delta(revYoY.value), `对照 ${state.year - 1} 年 ${monthList(revYoY.months)}`],
      [a.qtyMonths.length === 12 ? "销量年度同比" : "销量已录月份同比", delta(qtyYoY.value), `上年同期 ${num(qtyYoY.prior)} units`],
      ["平均单价 ASP", money(asp(rows()), 2), "营收 ÷ 对应销量"],
      ["有记录的完整 SKU", num(a.skuCount), `${new Set(rows().map(r => r.baseSku)).size} 个基础 SKU`],
    ];
    $("kpiGrid").innerHTML = cards.map(([label, value, note]) => `<article class="kpi"><span class="kpi-label">${label}</span><div class="kpi-value">${value}</div><small>${note}</small></article>`).join("");
    const peak = a.months.filter(m => m.revenueKnown).sort((x, y) => y.revenue - x.revenue)[0];
    const top = MC.byProduct(rows())[0];
    $("conclusionTitle").textContent = revYoY.value === null ? `${state.year} 年${scope}营收 ${money(a.revenue)}` : `${scope}营收同比${revYoY.value >= 0 ? "增长" : "下降"} ${share(Math.abs(revYoY.value))}`;
    $("conclusionText").textContent = top && peak ? `${peak.month} 月营收最高，达 ${money(peak.revenue, 2)}，占${scope}营收 ${share(a.revenue ? peak.revenue / a.revenue : null)}。${top.key} 贡献 ${money(top.revenue, 2)}，占比 ${share(a.revenue ? top.revenue / a.revenue : null)}。${!complete ? "部分月份尚未录齐，以上为已录数据。" : ""}` : "暂无可汇总的原表记录。";
    $("quarterGrid").innerHTML = [1, 2, 3, 4].map(q => {
      const items = rows().filter(r => Math.ceil(r.month / 3) === q), t = MC.total(items), covered = a.revenueMonths.filter(m => Math.ceil(m / 3) === q).length;
      return `<div class="quarter"><span>Q${q} · ${(q - 1) * 3 + 1}–${q * 3}月</span><strong>${t.revenueKnown ? money(t.revenue) : "—"}</strong><small>${t.qtyKnown ? num(t.qty) + " units" : "未录"}${covered < 3 ? ` · 营收 ${covered}/3 月` : ""}</small></div>`;
    }).join("");
    const comparisonYears = [...new Set([state.year - 1, state.year, Math.max(...years)])].filter(y => years.includes(y));
    $("yearComparison").innerHTML = comparisonYears.map(y => { const t = MC.annual(records, y); return `<article class="year-card ${y === state.year ? "selected" : ""}"><span class="year-name">${y}</span><span class="year-period">${yearPeriod(t)}</span><strong>${money(t.revenue)}</strong><span class="year-qty">${num(t.qty)}</span><small>营收 USD</small><small class="right">销量 units</small></article>`; }).join("");
  }

  function renderMonthly() {
    document.querySelectorAll(".selected-year").forEach(el => el.textContent = state.year);
    document.querySelectorAll(".prior-year").forEach(el => el.textContent = state.year - 1);
    chart("revenueChart", "revenue"); chart("qtyChart", "qty");
    $("monthlyBody").innerHTML = selected().months.map(t => {
      const items = rows(state.year, t.month), top = MC.byProduct(items)[0];
      return `<tr><td><button class="text-button" data-month="${t.month}">${state.year}-${String(t.month).padStart(2, "0")}</button></td><td>${amount(t, "qty")}</td><td>${amount(t, "revenue", 2)}</td><td>${delta(monthGrowth(state.year, t.month, "qty", "mom"))}</td><td>${delta(monthGrowth(state.year, t.month, "revenue", "mom"))}</td><td>${delta(monthGrowth(state.year, t.month, "qty", "yoy"))}</td><td>${delta(monthGrowth(state.year, t.month, "revenue", "yoy"))}</td><td>${money(asp(items), 2)}</td><td class="product">${top ? esc(top.key) : "—"}</td></tr>`;
    }).join("");
    const a = selected();
    $("monthlyFoot").innerHTML = `<tr><td>${a.year} 年合计</td><td>${amount(a, "qty")}</td><td>${amount(a, "revenue", 2)}</td><td>—</td><td>—</td><td>${delta(MC.comparison(records, state.year, "qty").value)}</td><td>${delta(MC.comparison(records, state.year, "revenue").value)}</td><td>${money(asp(rows()), 2)}</td><td>${a.skuCount} 个 SKU</td></tr>`;
  }

  function renderMonthSku() {
    const items = rows(state.year, state.month), t = MC.total(items);
    const products = MC.byProduct(items), filtered = products.filter(p => p.key.toLowerCase().includes(state.monthSearch.toLowerCase()));
    $("monthDetailTitle").textContent = `${state.year} 年 ${state.month} 月 SKU 明细`;
    $("monthMetrics").innerHTML = mini("本月营收", t.revenueKnown ? money(t.revenue, 2) : "—") + mini("本月销量", t.qtyKnown ? num(t.qty) : "—") + mini("本月完整 SKU", num(products.length)) + mini("本月平均单价", money(asp(items), 2));
    $("monthSkuBody").innerHTML = filtered.map(p => `<tr><td><button class="text-button" data-sku="${esc(p.key)}" data-level="sku">${esc(p.key)}</button></td><td>${esc(p.key.split("-")[0])}</td><td>${amount(p, "qty")}</td><td>${amount(p, "revenue", 2)}</td><td>${t.revenueComplete && p.revenueComplete ? share(t.revenue ? p.revenue / t.revenue : null) : "—"}</td><td>${money(asp(items.filter(r => r.sku === p.key)), 2)}</td><td>${delta(monthGrowth(state.year, state.month, "qty", "yoy", p.key, "sku"))}</td><td>${delta(monthGrowth(state.year, state.month, "revenue", "yoy", p.key, "sku"))}</td></tr>`).join("") || empty(8, items.length ? undefined : "该月原表暂无 MC 数据");
    const ft = MC.total(items.filter(r => filtered.some(p => p.key === r.sku)));
    $("monthSkuFoot").innerHTML = `<tr><td>${state.monthSearch ? "筛选合计" : "当月合计"} · ${filtered.length} 个 SKU</td><td>—</td><td>${amount(ft, "qty")}</td><td>${amount(ft, "revenue", 2)}</td><td colspan="4">${state.monthSearch ? `全月营收 ${money(t.revenue, 2)}` : "同月同 SKU 的多行记录已合并"}</td></tr>`;
  }

  function renderMatrix() {
    const products = MC.byProduct(rows(), state.level).filter(p => p.key.toLowerCase().includes(state.matrixSearch.toLowerCase())).sort((a, b) => b[state.metric] - a[state.metric]);
    const format = state.metric === "revenue" ? v => money(v) : v => num(v);
    const a = selected(), covered = a.months.filter(m => m.rows).map(m => m.month);
    const values = products.flatMap(p => MC.MONTHS.map(m => monthValue(state.year, m, state.metric, p.key))).filter(v => v !== null);
    const max = Math.max(1, ...values);
    $("matrixNote").textContent = `${state.year} · ${state.level === "sku" ? "完整 SKU" : "基础 SKU"} · ${products.length} 行 · ${state.metric === "revenue" ? "营收 USD，显示取整" : "销量 units"}`;
    $("matrixHead").innerHTML = `<tr><th>SKU</th>${MC.MONTHS.map(m => `<th>${m}月</th>`).join("")}<th>年度合计</th><th>上年同期</th><th>同比</th></tr>`;
    $("matrixBody").innerHTML = products.map(p => {
      const current = productValue(state.year, p.key, covered, state.metric), prior = productValue(state.year - 1, p.key, covered, state.metric);
      return `<tr><td><button class="text-button" data-sku="${esc(p.key)}" data-level="${state.level}">${esc(p.key)}</button></td>${MC.MONTHS.map(m => { const v = monthValue(state.year, m, state.metric, p.key); return `<td title="${m}月 ${v === null ? "未录齐" : state.metric === "revenue" ? money(v, 2) : num(v)}" style="background:${v !== null && v > 0 ? `rgba(15,118,110,${.035 + .2 * v / max})` : "transparent"}">${format(v)}</td>`; }).join("")}<td class="matrix-total">${format(current)}</td><td>${format(prior)}</td><td>${delta(MC.growth(current, prior))}</td></tr>`;
    }).join("") || empty(16);
    const productKeys = new Set(products.map(p => p.key));
    const filtered = rows().filter(r => productKeys.has(r[state.level]));
    $("matrixFoot").innerHTML = `<tr><td>${state.matrixSearch ? "筛选合计" : "月度合计"}</td>${MC.MONTHS.map(m => `<td>${monthValue(state.year, m, state.metric) === null ? "—" : format(MC.total(filtered.filter(r => r.month === m))[state.metric])}</td>`).join("")}<td>${format(MC.total(filtered)[state.metric])}</td><td colspan="2">${products.length} 个 ${state.level === "sku" ? "SKU" : "基础 SKU"}</td></tr>`;
  }

  function renderSkuTrend() {
    const items = rows().filter(r => r[state.level] === state.sku);
    const months = selected().months.filter(m => m.rows).map(m => m.month);
    const revenue = productValue(state.year, state.sku, months, "revenue"), qty = productValue(state.year, state.sku, months, "qty");
    $("skuMetrics").innerHTML = mini("所选 SKU", esc(state.sku || "—"), true) + mini("本年营收", money(revenue, 2)) + mini("本年销量", num(qty)) + mini("平均单价", money(asp(items), 2));
    chart("skuRevenueChart", "revenue", state.sku); chart("skuQtyChart", "qty", state.sku);
    $("skuTrendBody").innerHTML = MC.MONTHS.map(m => { const q = monthValue(state.year, m, "qty", state.sku), v = monthValue(state.year, m, "revenue", state.sku); return `<tr><td>${state.year}-${String(m).padStart(2, "0")}</td><td>${num(q)}</td><td>${money(v, 2)}</td><td>${q > 0 && v !== null ? money(v / q, 2) : "—"}</td><td>${delta(monthGrowth(state.year, m, "qty", "mom", state.sku))}</td><td>${delta(monthGrowth(state.year, m, "revenue", "mom", state.sku))}</td><td>${delta(monthGrowth(state.year, m, "qty", "yoy", state.sku))}</td><td>${delta(monthGrowth(state.year, m, "revenue", "yoy", state.sku))}</td></tr>`; }).join("");
  }

  function renderSkuSummary() {
    const a = selected(), months = a.months.filter(m => m.rows).map(m => m.month);
    const keys = [...new Set([...rows(), ...rows(state.year - 1).filter(r => months.includes(r.month))].map(r => r[state.level]))];
    summaryExport = keys.map(key => {
      const qty = productValue(state.year, key, months, "qty"), revenue = productValue(state.year, key, months, "revenue");
      const pq = productValue(state.year - 1, key, months, "qty"), pr = productValue(state.year - 1, key, months, "revenue");
      return { key, pq, qty, qyoy: MC.growth(qty, pq), pr, revenue, ryoy: MC.growth(revenue, pr), asp: qty > 0 && revenue !== null ? revenue / qty : null, share: a.revenue && revenue !== null ? revenue / a.revenue : null };
    }).sort((x, y) => (y.revenue || 0) - (x.revenue || 0));
    $("skuSummaryBody").innerHTML = summaryExport.map(p => `<tr><td><button class="text-button" data-sku="${esc(p.key)}" data-level="${state.level}">${esc(p.key)}</button></td><td>${num(p.pq)}</td><td>${num(p.qty)}</td><td>${delta(p.qyoy)}</td><td>${money(p.pr, 2)}</td><td>${money(p.revenue, 2)}</td><td>${delta(p.ryoy)}</td><td>${money(p.asp, 2)}</td><td>${share(p.share)}</td></tr>`).join("");
    $("skuSummaryFoot").innerHTML = `<tr><td>${state.year} 年合计</td><td>${num(MC.comparison(records, state.year, "qty").prior)}</td><td>${amount(a, "qty")}</td><td>${delta(MC.comparison(records, state.year, "qty").value)}</td><td>${money(MC.comparison(records, state.year, "revenue").prior, 2)}</td><td>${amount(a, "revenue", 2)}</td><td>${delta(MC.comparison(records, state.year, "revenue").value)}</td><td>${money(asp(rows()), 2)}</td><td>${a.revenueComplete && a.revenue ? "100.0%" : "—"}</td></tr>`;
  }

  function renderSource() {
    const a = selected();
    const cells = [["数据来源", `<a href="${MC.SOURCE.url}" target="_blank" rel="noopener noreferrer">${MC.SOURCE.sheetName} ↗</a><br />渠道 MC · A:H 原始明细`], ["当前年份记录", `<strong>${num(a.rows)}</strong> 行<br />${state.year} 年 · 全表 MC ${records.length} 行`], ["营收录入覆盖", `<strong>${a.revenueMonths.length} / 12</strong> 月<br />${a.rows - a.revenueKnown} 行营收空缺`], ["数据读取时间", `${stamp(state.snapshot?.fetchedAt)}<br />${state.sourceKind === "live" ? "本次在线读取" : "保存的快照，非本次在线数据"}`]];
    $("auditGrid").innerHTML = cells.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("coverageGrid").innerHTML = a.months.map(m => `<div class="month-cover ${m.qtyComplete && m.revenueComplete ? "" : "incomplete"}">${m.month}月<small>${m.rows ? `${m.rows} 行` : "无记录"}</small><small>${m.revenueComplete ? "营收已录" : "营收未齐"}</small></div>`).join("");
    $("rawCount").textContent = `（${a.rows} 行）`;
    if ($("rawDetails").open) renderRaw();
  }
  function renderRaw() {
    $("rawBody").innerHTML = rows().map(r => `<tr data-source-row="${r.sourceRow}" data-qty="${r.qty ?? ""}" data-revenue="${r.revenue ?? ""}"><td><a class="source-row-link" href="${MC.SOURCE.url}&range=A${r.sourceRow}:H${r.sourceRow}" target="_blank" rel="noopener noreferrer">${r.sourceRow} ↗</a></td><td>${r.year}</td><td>${r.month}</td><td>MC</td><td>${esc(r.sku)}</td><td>${esc(r.model || "—")}</td><td>${num(r.qty)}</td><td title="底层数值 ${r.revenue ?? "空缺"}">${money(r.revenue, 6)}</td></tr>`).join("");
  }

  function selectProducts() {
    const current = MC.byProduct(rows(), state.level).map(p => p.key);
    const all = [...new Set([...current, ...rows(state.year - 1).map(r => r[state.level])])];
    if (!all.includes(state.sku)) state.sku = all[0] || null;
    $("skuSelect").innerHTML = all.map(key => `<option value="${esc(key)}">${esc(key)}</option>`).join("");
    $("skuSelect").value = state.sku;
  }
  function renderAll() {
    $("yearSelect").innerHTML = years.slice().reverse().map(y => `<option value="${y}">${y}</option>`).join("");
    $("yearSelect").value = state.year;
    const present = selected().months.filter(m => m.rows).map(m => m.month);
    if (state.month === null) state.month = present.at(-1) || 1;
    $("monthSelect").innerHTML = MC.MONTHS.map(m => `<option value="${m}">${state.year} 年 ${m} 月${present.includes(m) ? "" : "（未录）"}</option>`).join("");
    $("monthSelect").value = state.month;
    selectProducts(); renderAnnual(); renderMonthly(); renderMonthSku(); renderMatrix(); renderSkuTrend(); renderSkuSummary(); renderSource();
  }
  function validSnapshot(snapshot) {
    return snapshot?.schema === 2 && snapshot.source?.sheetId === MC.SOURCE.sheetId && snapshot.source?.gid === MC.SOURCE.gid && Number.isFinite(Date.parse(snapshot.fetchedAt)) && Array.isArray(snapshot.records) && snapshot.records.length > 0 && snapshot.records.every(r => r.channel === "MC" && Number.isInteger(r.sourceRow) && Number.isInteger(r.year) && r.month >= 1 && r.month <= 12 && typeof r.sku === "string" && typeof r.baseSku === "string" && (r.qty === null || Number.isFinite(r.qty)) && (r.revenue === null || Number.isFinite(r.revenue)));
  }
  function applySnapshot(snapshot, kind) {
    if (!validSnapshot(snapshot)) throw new Error("数据快照无效。");
    records = snapshot.records;
    state.snapshot = snapshot; state.sourceKind = kind;
    years = [...new Set(records.map(r => r.year))].sort((a, b) => a - b);
    yearRows = MC.group(records, "year");
    periodRows = MC.group(records, r => `${r.year}-${r.month}`);
    periodTotals = new Map([...periodRows].map(([key, items]) => [key, MC.total(items)]));
    yearTotals = new Map(years.map(year => [year, MC.annual(records, year)]));
    productMonths = new Map();
    // An online refresh must never jump from the requested 2025 review to the latest year.
    if (!years.includes(state.year)) state.year = years.includes(2025) ? 2025 : years.at(-1);
    renderAll();
  }
  function setStatus(kind, text) { $("sourceStatus").className = `status ${kind}`; $("sourceStatus").textContent = text; }
  async function sync() {
    if (state.syncing) return;
    state.syncing = true; $("refreshData").disabled = true; $("refreshData").textContent = "同步中…";
    setStatus("loading", "正在同步原表");
    try {
      const next = await MC_SOURCE.fetchRecords();
      applySnapshot(next, "live");
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* Storage availability does not change the live result. */ }
      setStatus("live", "原表同步成功");
      $("sourceSummary").textContent = `读取于 ${stamp(next.fetchedAt)} · MC ${next.records.length} 行`;
      $("syncError").hidden = true;
    } catch (error) {
      state.sourceKind = "cached";
      setStatus("cached", records.length ? "在线同步失败 · 显示快照" : "在线同步失败");
      $("sourceSummary").textContent = records.length ? `快照读取于 ${stamp(state.snapshot.fetchedAt)} · MC ${records.length} 行` : "暂无可用数据";
      $("syncError").hidden = false;
      $("syncError").textContent = `本次未取得在线数据。${error.name === "AbortError" ? "连接原表超时。" : error.message} ${records.length ? "下方保留标注时间的最近快照，可点击“刷新在线数据”重试。" : "请稍后重试。"}`;
      if (records.length) renderSource();
    } finally { state.syncing = false; $("refreshData").disabled = false; $("refreshData").textContent = "刷新在线数据"; }
  }

  $("sourceLink").href = MC.SOURCE.url;
  $("refreshData").addEventListener("click", sync);
  $("yearSelect").addEventListener("change", event => { state.year = Number(event.target.value); state.month = null; state.monthSearch = state.matrixSearch = ""; $("monthSearch").value = $("matrixSearch").value = ""; renderAll(); });
  $("monthSelect").addEventListener("change", event => { state.month = Number(event.target.value); renderMonthSku(); });
  $("monthSearch").addEventListener("input", event => { state.monthSearch = event.target.value.trim(); renderMonthSku(); });
  $("matrixSearch").addEventListener("input", event => { state.matrixSearch = event.target.value.trim(); renderMatrix(); });
  $("levelSelect").addEventListener("change", event => { state.level = event.target.value; selectProducts(); renderMatrix(); renderSkuTrend(); renderSkuSummary(); });
  $("skuSelect").addEventListener("change", event => { state.sku = event.target.value; renderSkuTrend(); });
  $("rawDetails").addEventListener("toggle", () => { if ($("rawDetails").open) renderRaw(); });
  document.querySelectorAll("[data-metric]").forEach(button => button.addEventListener("click", () => { state.metric = button.dataset.metric; document.querySelectorAll("[data-metric]").forEach(b => b.setAttribute("aria-pressed", String(b === button))); renderMatrix(); }));
  function drillMonth(month) { state.month = month; state.monthSearch = ""; $("monthSearch").value = ""; $("monthSelect").value = month; renderMonthSku(); location.hash = "monthSkuSection"; }
  document.addEventListener("click", event => {
    const month = event.target.closest("[data-month]");
    if (month) { drillMonth(Number(month.dataset.month)); return; }
    const product = event.target.closest("[data-sku]");
    if (product) { state.level = product.dataset.level; state.sku = product.dataset.sku; $("levelSelect").value = state.level; selectProducts(); renderMatrix(); renderSkuTrend(); renderSkuSummary(); location.hash = "skuTrendSection"; }
  });
  document.addEventListener("keydown", event => { const target = event.target.closest("g[data-month]"); if (target && ["Enter", " "].includes(event.key)) { event.preventDefault(); drillMonth(Number(target.dataset.month)); } });
  $("exportSummary").addEventListener("click", () => {
    const columns = ["SKU", `${state.year - 1} 同期销量`, `${state.year} 销量`, "销量同比", `${state.year - 1} 同期营收 USD`, `${state.year} 营收 USD`, "营收同比", "ASP USD", "营收占比"];
    const csvCell = value => { let text = value === null ? "" : String(value); if (typeof value === "string" && /^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; };
    const lines = [columns, ...summaryExport.map(r => [r.key, r.pq, r.qty, r.qyoy, r.pr, r.revenue, r.ryoy, r.asp, r.share])];
    const url = URL.createObjectURL(new Blob(["\ufeff" + lines.map(line => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `Micro-Center-${state.year}-${state.level}-annual.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll(".nav-link").forEach(a => { const active = a.hash === `#${entry.target.id}`; a.classList.toggle("active", active); if (active) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); }); }, { rootMargin: "-5% 0px -80% 0px" });
  document.querySelectorAll("main>.section").forEach(section => observer.observe(section));
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { /* A previous invalid cache is ignored. */ }
  const snapshots = [cached, window.MC_DATA].filter(validSnapshot).sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt));
  if (snapshots.length) { applySnapshot(snapshots[0], "cached"); $("sourceSummary").textContent = `当前快照 ${stamp(snapshots[0].fetchedAt)} · 正在核对在线原表`; }
  sync();
  setInterval(() => { if (!document.hidden) sync(); }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - Date.parse(state.snapshot?.fetchedAt || 0) >= 5 * 60 * 1000) sync(); });
})();
