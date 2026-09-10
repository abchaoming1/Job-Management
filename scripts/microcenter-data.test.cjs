const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const MC = require('../microcenter/data-core.js');
const header = { sourceRow: 1, cells: ['Y&M', '年份', '月份', '渠道', 'SKU', 'Model', 'QTY', 'REV'] };
const row = (n, month, revenue, qty = 3, sku = 'S821-MN-BK-US', channel = 'MC') => ({ sourceRow: n, cells: ['', 2025, month, channel, sku, 'S820', qty, revenue] });
test('currency strings, numeric precision, negative returns and true zero', () => {
  for (const [input, expected] of [['$1,234.56',1234.56],['-$12.30',-12.3],['($12.30)',-12.3],[' USD 42.50 ',42.5],[2504.880902,2504.880902],[0,0],['$0',0],['',null],[null,null],['#N/A',null],['—',null]]) assert.equal(MC.numeric(input),expected);
});
test('same month/SKU/quantity occurrences each retain their own revenue', () => {
  const records = MC.normalizeRows([header,row(2,5,10),row(3,5,'$20'),row(4500,5,'$30')]);
  assert.equal(records.length,3); assert.equal(MC.total(records).revenue,60);
  assert.equal(MC.total(records).qty,9); assert.deepEqual(records.map(r=>r.sourceRow),[2,3,4500]);
});
test('channel filter excludes other channels, blank SKU adjustments remain', () => {
  const records = MC.normalizeRows([header,row(2,1,10),row(3,1,100,30,'S820','GMA'),row(4,1,-2,0,'')]);
  assert.equal(records.length,2); assert.equal(MC.total(records).revenue,8);
  assert.equal(records[1].sku,'未归属调整'); assert.equal(records[0].baseSku,'S821');
});
test('a blank amount is not zero or a complete month', () => {
  const records = MC.normalizeRows([header,row(2,1,0),row(3,2,null),row(4,3,10),row(5,3,'')]);
  const months = MC.monthly(records,2025);
  assert.equal(months[0].revenueComplete,true); assert.equal(months[0].revenue,0);
  assert.equal(months[1].revenueComplete,false); assert.equal(months[2].revenueComplete,false);
  assert.equal(months[3].rows,0); assert.deepEqual(MC.annual(records,2025).revenueMonths,[1]);
});
test('schema changes and invalid data fail instead of silently dropping MC rows', () => {
  assert.throws(()=>MC.normalizeRows([row(2,1,10)]),/列结构/);
  assert.throws(()=>MC.normalizeRows([header,row(2,13,10)]),/年份或月份/);
  assert.throws(()=>MC.normalizeRows([header,row(2,1,'#REF!')]),/REV/);
});
test('annual and partial comparisons match the exact months and reject absent prior data', () => {
  const current = MC.normalizeRows([header,row(2,1,20),row(3,3,40)]);
  const prior = [ {...current[0],year:2024,revenue:10}, {...current[1],year:2024,revenue:20} ];
  assert.equal(MC.comparison([...current,...prior],2025,'revenue').value,1);
  assert.deepEqual(MC.comparison([...current,...prior],2025,'revenue').months,[1,3]);
  assert.equal(MC.comparison([...current,prior[0]],2025,'revenue').value,null);
  assert.equal(MC.growth(0,10),-1); assert.equal(MC.growth(10,0),null); assert.equal(MC.growth(null,10),null);
});
test('source snapshot reconciles to independently audited XLSX totals', () => {
  const context={window:{}}; vm.runInNewContext(fs.readFileSync(require.resolve('../microcenter/data.js'),'utf8'),context);
  const records=context.window.MC_DATA.records;
  assert.equal(records.length,739); assert.ok(records.every(r=>r.channel==='MC'));
  const expected = {2024:[3411,309762.67],2025:[8605,876421.1339939003],2026:[5100,537064.1456496989]};
  for(const [year,[qty,rev]] of Object.entries(expected)) {
    const annual=MC.annual(records,Number(year)); assert.equal(annual.qty,qty); assert.ok(Math.abs(annual.revenue-rev)<1e-7);
    const skuSum=MC.byProduct(records.filter(r=>r.year===Number(year))).reduce((s,r)=>s+r.revenue,0);
    const monthSum=annual.months.reduce((s,r)=>s+r.revenue,0);
    assert.ok(Math.abs(skuSum-rev)<1e-7); assert.ok(Math.abs(monthSum-rev)<1e-7);
  }
  assert.equal(MC.annual(records,2025).revenueMonths.length,12);
  assert.equal(MC.annual(records,2025).skuCount,25);
  assert.ok(Math.abs(MC.comparison(records,2025,'revenue').value-1.8293310294423148)<1e-10);
});
test('previous-year reference retains all 12 months and monthly SKU totals', () => {
  const context={window:{}}; vm.runInNewContext(fs.readFileSync(require.resolve('../microcenter/data.js'),'utf8'),context);
  const records=context.window.MC_DATA.records;
  const expected=[[1189,126644.73],[248,25298.16],[690,68880.90],[758,74248.06],[359,34933.63],[293,28846.42],[1070,111002.33],[670,67750.72],[1259,126991.85],[582,58447.34],[612,64858.04],[875,88518.96]];
  const prior=MC.annual(records,2025);
  assert.equal(MC.annual(records,2026).revenueMonths.length,8);
  assert.equal(prior.months.length,12);
  for (const [i,[qty,revenue]] of expected.entries()) {
    const month=prior.months[i], products=MC.byProduct(records.filter(r=>r.year===2025&&r.month===i+1));
    assert.equal(month.qty,qty);
    assert.equal(Number(month.revenue.toFixed(2)),revenue);
    assert.equal(products.reduce((s,p)=>s+p.qty,0),qty);
    assert.ok(Math.abs(products.reduce((s,p)=>s+p.revenue,0)-month.revenue)<1e-7);
  }
});
