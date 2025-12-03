// CV Dashboard – Offline-first IndexedDB with FIFO/LIFO, FX and public view
// Money as minor units (integers), quantities as micro-units. No floats in storage for money.
//
// Schema (DB 'cvdb', v2):
// - stocks   (key: wkn) => { wkn, name, exchange, currency, minor_units, created_at, updated_at }
// - transactions (key: auto) indexes: by_wkn, by_ts, by_wkn_ts => { id, wkn, ts, type, qty_micro, price_minor, currency }
// - quotes   (key: [wkn, date]) => { wkn, date (YYYY-MM-DD), price_minor, currency, source?, quality? }
// - fx_rates (key: [currency, date]) => { currency, date (YYYY-MM-DD), rate_ppm }   // 1 CUR = rate_ppm/1e6 EUR
//
// Export formats: stocks.json | transactions.jsonl | quotes.jsonl | fx.jsonl
//
// Notes:
// - Base currency is EUR for totals/allocations. Convert price_minor via FX at relevant date.
// - FIFO/LIFO toggled by UI. Dividends: ignored in cost basis; fees: added to cost basis (EUR). Splits: qty lot with zero cost.
//
// ----------------- Setup -----------------
const DB_NAME = 'cvdb';
const DB_VERSION = 2;
let db;

const CURRENCY_MINOR = { EUR: 2, USD: 2, CHF: 2, GBP: 2, JPY: 0 };
const QTY_SCALE = 1_000_000;
const ONE_M = 1_000_000n; // for ppm

let valuationMethod = 'fifo'; // or 'lifo'
let baseCurrency = 'EUR';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      // v1 stores
      if (!db.objectStoreNames.contains('stocks')) {
        db.createObjectStore('stocks', { keyPath: 'wkn' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const os = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        os.createIndex('by_wkn', 'wkn', { unique: false });
        os.createIndex('by_ts', 'ts', { unique: false });
        os.createIndex('by_wkn_ts', ['wkn','ts'], { unique: false });
      }
      if (!db.objectStoreNames.contains('quotes')) {
        const os = db.createObjectStore('quotes', { keyPath: ['wkn','date'] });
        os.createIndex('by_wkn', 'wkn', { unique: false });
        os.createIndex('by_date', 'date', { unique: false });
      }
      // v2 changes
      if (e.oldVersion < 2) {
        if (db.objectStoreNames.contains('tasks')) {
          db.deleteObjectStore('tasks'); // remove tasks store
        }
        if (!db.objectStoreNames.contains('fx_rates')) {
          const os = db.createObjectStore('fx_rates', { keyPath: ['currency','date'] });
          os.createIndex('by_currency', 'currency', { unique: false });
          os.createIndex('by_date', 'date', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(storeNames, mode='readonly') {
  const t = db.transaction(storeNames, mode);
  const stores = Array.isArray(storeNames) ? storeNames.map(n=>t.objectStore(n)) : [t.objectStore(storeNames)];
  return { t, stores };
}

function put(store, value) {
  return new Promise((res, rej) => {
    const req = store.put(value);
    req.onsuccess = ()=>res(req.result);
    req.onerror = ()=>rej(req.error);
  });
}
function del(store, key) {
  return new Promise((res, rej) => {
    const req = store.delete(key);
    req.onsuccess = ()=>res();
    req.onerror = ()=>rej(req.error);
  });
}
function get(store, key) {
  return new Promise((res, rej) => {
    const req = store.get(key);
    req.onsuccess = ()=>res(req.result);
    req.onerror = ()=>rej(req.error);
  });
}
function getAll(store, indexName=null, keyRange=null) {
  return new Promise((res, rej) => {
    const src = indexName ? store.index(indexName) : store;
    const req = src.getAll(keyRange || null);
    req.onsuccess = ()=>res(req.result || []);
    req.onerror = ()=>rej(req.error);
  });
}

// ----------------- Money & Qty helpers -----------------
function parseMoneyToMinor(input, currency='EUR') {
  const decimals = CURRENCY_MINOR[currency] ?? 2;
  const norm = String(input).trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(norm)) throw new Error('Ungültiger Geldbetrag');
  const [intPart, fracPart=''] = norm.split('.');
  const padded = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const asMinorStr = (intPart + padded).replace(/^(-?)0+(\d)/, '$1$2'); // trim leading zeros, keep sign
  const sign = norm.startsWith('-') ? -1 : 1;
  const minor = sign * Math.abs(Number(asMinorStr));
  if (!Number.isSafeInteger(minor)) throw new Error('Betrag außerhalb sicherer Integer');
  return minor;
}

function formatMoneyFromMinor(minor, currency='EUR') {
  const decimals = CURRENCY_MINOR[currency] ?? 2;
  const val = (minor / Math.pow(10, decimals));
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: decimals }).format(val);
}

function parseQtyToMicro(input) {
  const norm = String(input).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(norm)) throw new Error('Ungültige Menge (nur positiv)');
  const [intPart, fracPart=''] = norm.split('.');
  const padded = (fracPart + '0'.repeat(6)).slice(0, 6);
  const micro = Number(intPart) * QTY_SCALE + Number(padded);
  if (!Number.isSafeInteger(micro)) throw new Error('Menge außerhalb sicherer Integer');
  return micro;
}

function formatQtyFromMicro(micro) {
  const intPart = Math.floor(micro / QTY_SCALE);
  const frac = String(micro % QTY_SCALE).padStart(6, '0').replace(/0+$/,'');
  return intPart + (frac ? '.' + frac : '');
}

// --------------- FX helpers ---------------
// Store rate as ppm: 1 CUR = rate_ppm / 1e6 EUR
function rateToPPM(rate) {
  const norm = String(rate).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(norm)) throw new Error('Ungültige FX-Rate');
  // up to 6 decimals -> ppm integer
  const [i,f=''] = norm.split('.');
  const ppm = BigInt(i) * ONE_M + BigInt((f + '0'.repeat(6)).slice(0,6));
  return ppm;
}

function ppmToFloat(ppm) {
  // for display only
  return Number(ppm) / 1_000_000;
}

async function addFx({ currency, date, rate_ppm }) {
  const { stores:[fx] } = tx('fx_rates','readwrite');
  await put(fx, { currency, date, rate_ppm });
}

async function getFxSeries(currency) {
  const { stores:[fx] } = tx('fx_rates');
  const arr = await getAll(fx, 'by_currency', IDBKeyRange.only(currency));
  arr.sort((a,b)=> a.date < b.date ? -1 : 1);
  return arr;
}

async function getFxAt(currency, dateISO) {
  if (currency === 'EUR') return ONE_M; // 1 EUR = 1 EUR
  const series = await getFxSeries(currency);
  // find last rate <= date
  let best = null;
  for (const r of series) {
    if (r.date <= dateISO) best = r;
    else break;
  }
  return best ? BigInt(best.rate_ppm) : null;
}

// Convert price_minor in given currency to EUR minor using rate_ppm at a date
function convertMinorToEURMinor(price_minor, currencyDecimals, rate_ppm, eurDecimals=2) {
  // EUR_minor = round(price_minor * rate * 10^(eurDecimals - currencyDecimals))
  const adjPow = eurDecimals - currencyDecimals;
  let scale = 1n;
  if (adjPow > 0) scale = BigInt(10 ** adjPow);
  else if (adjPow < 0) scale = 1n; // we'll divide later

  let num = BigInt(price_minor) * rate_ppm * scale;
  let den = ONE_M;
  if (adjPow < 0) {
    den = den * BigInt(10 ** (-adjPow));
  }
  // rounding
  const rounded = (num + den/2n) / den;
  return Number(rounded);
}

// --------------- Domain logic ---------------
async function upsertStock({ wkn, name, exchange, currency }) {
  const { stores:[stocks] } = tx('stocks','readwrite');
  const now = new Date().toISOString();
  const minor_units = CURRENCY_MINOR[currency] ?? 2;
  const existing = await get(stocks, wkn);
  const obj = { wkn, name, exchange, currency, minor_units, created_at: existing?.created_at || now, updated_at: now };
  await put(stocks, obj);
  return obj;
}

async function removeStock(wkn) {
  const { stores:[stocks] } = tx('stocks','readwrite');
  await del(stocks, wkn);
}

async function addTransaction({ wkn, type, qty_micro, price_minor, currency, ts }) {
  const { stores:[txs] } = tx('transactions','readwrite');
  const obj = { wkn, type, qty_micro, price_minor, currency, ts };
  await put(txs, obj);
  return obj;
}

async function addQuote({ wkn, date, price_minor, currency }) {
  const { stores:[quotes] } = tx('quotes','readwrite');
  await put(quotes, { wkn, date, price_minor, currency });
}

async function latestQuote(wkn) {
  const { stores:[quotes] } = tx('quotes');
  const all = await getAll(quotes, 'by_wkn', IDBKeyRange.only(wkn));
  if (!all.length) return null;
  all.sort((a,b)=> a.date < b.date ? 1 : -1);
  return all[0];
}

async function listStocks() {
  const { stores:[stocks] } = tx('stocks');
  return await getAll(stocks);
}
async function listTransactions(limit=100) {
  const { stores:[txs] } = tx('transactions');
  const all = await getAll(txs, 'by_ts');
  all.sort((a,b)=> a.ts < b.ts ? 1 : -1);
  return all.slice(0, limit);
}
async function getTransactionsFor(wkn) {
  const { stores:[txs] } = tx('transactions');
  const all = await getAll(txs, 'by_wkn', IDBKeyRange.only(wkn));
  // order by ts ascending for proper lot building
  all.sort((a,b)=> a.ts < b.ts ? -1 : 1);
  return all;
}

// Build lots and compute remaining cost by FIFO/LIFO, returns {qty_micro, cost_eur_minor, avg_cost_per_share_eur_minor}
async function positionWithLots(stock, method='fifo') {
  const txs = await getTransactionsFor(stock.wkn);
  const dec = CURRENCY_MINOR[stock.currency] ?? 2;

  /** @type {{qty_micro:number, price_minor:number, currency:string, ts:string}[]} */
  const lots = [];
  let fees_eur_minor_total = 0;

  for (const tx of txs) {
    if (tx.type === 'buy') {
      lots.push({ qty_micro: tx.qty_micro, price_minor: tx.price_minor, currency: tx.currency || stock.currency, ts: tx.ts });
    } else if (tx.type === 'sell') {
      // consume lots
      let remain = tx.qty_micro;
      while (remain > 0 && lots.length > 0) {
        const lotIdx = (method === 'fifo') ? 0 : (lots.length - 1);
        const lot = lots[lotIdx];
        const take = Math.min(remain, lot.qty_micro);
        lot.qty_micro -= take;
        remain -= take;
        if (lot.qty_micro === 0) lots.splice(lotIdx,1);
      }
      // if remain > 0, selling more than held -> clamp to zero holdings
    } else if (tx.type === 'split') {
      // new lot with zero cost
      lots.push({ qty_micro: tx.qty_micro, price_minor: 0, currency: tx.currency || stock.currency, ts: tx.ts });
    } else if (tx.type === 'fee') {
      // fee amount adds to cost basis (EUR)
      const rate = await getFxAt(tx.currency || stock.currency, tx.ts.slice(0,10));
      const fee_eur = rate ? convertMinorToEURMinor(tx.price_minor, CURRENCY_MINOR[tx.currency||stock.currency]??2, rate) : 0;
      fees_eur_minor_total += fee_eur;
    } else if (tx.type === 'dividend') {
      // ignore for cost basis
    }
  }

  // compute totals
  let qty_micro = 0;
  let cost_eur_minor = fees_eur_minor_total;
  for (const lot of lots) {
    qty_micro += lot.qty_micro;
    if (lot.qty_micro > 0) {
      const rate = await getFxAt(lot.currency, lot.ts.slice(0,10));
      const eur_minor = rate ? convertMinorToEURMinor(lot.price_minor, CURRENCY_MINOR[lot.currency]??2, rate) : 0;
      // cost for this lot = per-share EUR * shares
      cost_eur_minor += Math.round(eur_minor * (lot.qty_micro / QTY_SCALE));
    }
  }
  const avg_cost_per_share_eur_minor = qty_micro > 0 ? Math.round(cost_eur_minor / (qty_micro / QTY_SCALE)) : 0;
  return { qty_micro, cost_eur_minor, avg_cost_per_share_eur_minor };
}

async function computePositions() {
  const stocks = await listStocks();
  const res = [];
  for (const s of stocks) {
    const pos = await positionWithLots(s, valuationMethod);
    const q = await latestQuote(s.wkn);
    const latestDate = q ? q.date : new Date().toISOString().slice(0,10);
    const rate = await getFxAt(q ? q.currency : s.currency, latestDate);
    const eur_minor_price = q && rate ? convertMinorToEURMinor(q.price_minor, CURRENCY_MINOR[q.currency]??2, rate) : pos.avg_cost_per_share_eur_minor;
    const market_value_eur_minor = Math.round(eur_minor_price * (pos.qty_micro / QTY_SCALE));
    const pnl_minor = market_value_eur_minor - pos.cost_eur_minor;
    const pnl_pct = pos.cost_eur_minor !== 0 ? (pnl_minor / pos.cost_eur_minor * 100) : 0;

    res.push({
      stock: s,
      qty_micro: pos.qty_micro,
      avg_cost_eur_minor_per_share: pos.avg_cost_per_share_eur_minor,
      current_eur_minor_per_share: eur_minor_price,
      market_value_eur_minor,
      cost_value_eur_minor: pos.cost_eur_minor,
      pnl_minor,
      pnl_pct
    });
  }
  return res;
}

// ----------------- Export / Import -----------------
async function exportAll() {
  const { stores:[stocks, txs, quotes, fx] } = tx(['stocks','transactions','quotes','fx_rates']);
  const allStocks = await getAll(stocks);
  const allTx = await getAll(txs);
  const allQuotes = await getAll(quotes);
  const allFx = await getAll(fx);

  const stocksBlob = new Blob([JSON.stringify(allStocks, null, 2)], { type: 'application/json' });
  const txBlob = new Blob(allTx.map(o=>JSON.stringify(o)+'\n'), { type: 'text/plain' });
  const quotesBlob = new Blob(allQuotes.map(o=>JSON.stringify(o)+'\n'), { type: 'text/plain' });
  const fxBlob = new Blob(allFx.map(o=>JSON.stringify({currency:o.currency,date:o.date,rate_to_eur: ppmToFloat(o.rate_ppm)})+'\n'), { type: 'text/plain' });

  const dl = (blob, filename) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 3000); };
  dl(stocksBlob, 'stocks.json');
  dl(txBlob, 'transactions.jsonl');
  dl(quotesBlob, 'quotes.jsonl');
  dl(fxBlob, 'fx.jsonl');
}

async function importFiles(files) {
  for (const f of files) {
    const text = await f.text();
    if (f.name.endsWith('.json')) {
      try {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) {
          const { stores:[stocks] } = tx('stocks','readwrite');
          for (const s of arr) await put(stocks, s);
        }
      } catch (e) { console.error('JSON import failed', f.name, e); }
    } else if (f.name.includes('transactions') || f.name.endsWith('.jsonl')) {
      const lines = text.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if ('price_minor' in obj && 'date' in obj && 'wkn' in obj) {
            await addQuote(obj);
          } else if ('wkn' in obj && 'type' in obj && 'qty_micro' in obj) {
            await addTransaction(obj);
          } else if (('currency' in obj) && ('date' in obj) && ('rate_to_eur' in obj)) {
            const ppm = rateToPPM(obj.rate_to_eur);
            await addFx({ currency: obj.currency.toUpperCase(), date: obj.date, rate_ppm: ppm });
          }
        } catch (e) { console.warn('Skipping invalid line', e); }
      }
    }
  }
}

// ----------------- UI & Rendering -----------------
let pieChart, pubPieChart, lineChart;

function byId(id){ return document.getElementById(id); }

async function refreshStocksTable() {
  const tbody = byId('stocks-tbody');
  tbody.innerHTML = '';
  const positions = await computePositions();

  // Populate WKN select for charts
  const wknSelect = byId('chart-wkn');
  wknSelect.innerHTML = '';
  for (const p of positions) {
    const opt = document.createElement('option');
    opt.value = p.stock.wkn;
    opt.textContent = `${p.stock.wkn} – ${p.stock.name}`;
    wknSelect.appendChild(opt);
  }

  let totalMarketEurMinor = 0;
  for (const p of positions) {
    totalMarketEurMinor += p.market_value_eur_minor;

    const tr = document.createElement('tr');
    const qtyStr = formatQtyFromMicro(p.qty_micro);
    const avg = formatMoneyFromMinor(p.avg_cost_eur_minor_per_share, 'EUR');
    const cur = formatMoneyFromMinor(p.current_eur_minor_per_share, 'EUR');
    const pnlStr = `${p.pnl_pct>=0?'+':''}${p.pnl_pct.toFixed(2)}%`;
    const pnlClass = p.pnl_pct >= 0 ? 'positive' : 'negative';

    tr.innerHTML = `
      <td>${p.stock.wkn}</td>
      <td>${p.stock.name}</td>
      <td>${qtyStr}</td>
      <td>${avg}</td>
      <td>${cur}</td>
      <td class="${pnlClass}">${pnlStr}</td>
      <td><button class="danger" data-rm="${p.stock.wkn}">Löschen</button></td>
    `;
    tbody.appendChild(tr);
  }

  // Allocation pie (EUR base)
  const labels = positions.map((_,i) => `Asset ${i+1}`); // anonymize by default
  const values = positions.map(p => p.market_value_eur_minor / 100); // convert cents->EUR (2 decimals)
  const ctxPie = byId('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie, { type: 'pie', data: { labels, datasets:[{ data: values }] } });

  byId('total-value').textContent = `Gesamt: ` + new Intl.NumberFormat('de-DE', { style:'currency', currency: 'EUR' }).format(values.reduce((a,b)=>a+b,0));
  byId('total-change').textContent = `Bewertung: ${valuationMethod.toUpperCase()} | Basis: EUR | Kurse aus Quotes & FX.`;

  // Remove handlers
  tbody.querySelectorAll('button[data-rm]').forEach(btn=>{
    btn.onclick = async ()=>{
      await removeStock(btn.getAttribute('data-rm'));
      await refreshStocksTable();
      await refreshTransactionsTable();
    };
  });

  // Public view update
  await refreshPublicView(positions);
}

async function refreshTransactionsTable(limit=100) {
  const tbody = byId('tx-tbody');
  tbody.innerHTML = '';
  const txs = await listTransactions(limit);
  for (const tx of txs) {
    const tr = document.createElement('tr');
    const qtyStr = formatQtyFromMicro(tx.qty_micro);
    const price = (tx.price_minor !== null && tx.price_minor !== undefined) ? formatMoneyFromMinor(tx.price_minor, tx.currency || 'EUR') : '-';
    tr.innerHTML = `
      <td>${tx.wkn}</td>
      <td>${tx.type}</td>
      <td>${qtyStr}</td>
      <td>${price}</td>
      <td>${(tx.currency||'')}</td>
      <td>${new Date(tx.ts).toLocaleString('de-DE')}</td>
    `;
    tbody.appendChild(tr);
  }
}

// Chart for a selected WKN from quotes
async function showChartForSelected() {
  const wkn = byId('chart-wkn').value;
  if (!wkn) return;
  const { stores:[quotes] } = tx('quotes');
  const items = await getAll(quotes, 'by_wkn', IDBKeyRange.only(wkn));
  items.sort((a,b)=> a.date < b.date ? -1 : 1);
  const labels = items.map(q=>q.date);
  const values = [];
  for (const q of items) {
    const rate = await getFxAt(q.currency, q.date);
    const eur_minor = rate ? convertMinorToEURMinor(q.price_minor, CURRENCY_MINOR[q.currency]??2, rate) : 0;
    values.push(eur_minor/100);
  }

  const ctx = byId('stockChart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: `${wkn} (EUR Schlusskurs)`, data: values, fill: false }] }
  });
}

// Public anonymized view
async function refreshPublicView(positions) {
  const totalEur = positions.reduce((sum,p)=> sum + p.market_value_eur_minor, 0);
  byId('pub-total').textContent = 'Gesamt (EUR): ' + new Intl.NumberFormat('de-DE', { style:'currency', currency: 'EUR' }).format(totalEur/100);
  const nonZero = positions.filter(p=>p.market_value_eur_minor>0);
  const top5 = nonZero.sort((a,b)=>b.market_value_eur_minor - a.market_value_eur_minor).slice(0,5);
  const topConcentration = top5.reduce((s,p)=> s + p.market_value_eur_minor, 0) / (totalEur || 1);
  byId('pub-meta').textContent = `Positionen: ${nonZero.length} | Top‑5 Konzentration: ${(topConcentration*100).toFixed(1)}%`;

  const labels = positions.map((_,i)=>`Asset ${i+1}`);
  const values = positions.map(p=>p.market_value_eur_minor/100);
  const ctx = byId('pubPie').getContext('2d');
  if (pubPieChart) pubPieChart.destroy();
  pubPieChart = new Chart(ctx, { type: 'pie', data: { labels, datasets:[{ data: values }] } });
}

// ----------------- Validations / Tests -----------------
function log(msg) {
  const out = byId('test-output');
  out.textContent += msg + '\n';
}

async function runTests() {
  byId('test-output').textContent = '';

  // Money parsing
  try {
    const m = parseMoneyToMinor('12,34','EUR'); 
    log(`Money parse 12,34 EUR -> ${m} (ok)`);
  } catch(e){ log('Money parse failed: '+e.message); }

  // Qty parsing
  try {
    const q = parseQtyToMicro('3.5');
    log(`Qty parse 3.5 -> ${q} micro (ok)`);
  } catch(e){ log('Qty parse failed: '+e.message); }

  // FX ppm conversion
  try {
    const ppm = rateToPPM('0.92');
    log(`FX 0.92 -> ppm ${ppm}`);
    const eurMinor = convertMinorToEURMinor(12345, 2, ppm); // 123.45 CUR -> EUR
    log(`Convert 123.45 CUR @0.92 -> EUR minor ${eurMinor} (${eurMinor/100} EUR)`);
  } catch(e){ log('FX convert failed: '+e.message); }

  // FIFO vs LIFO simple consistency (no sells)
  try {
    const wkn = 'TEST123';
    await upsertStock({ wkn, name:'Test', exchange:'X', currency:'USD' });
    await addTransaction({ wkn, type:'buy', qty_micro: parseQtyToMicro('2'), price_minor: parseMoneyToMinor('10','USD'), currency:'USD', ts: new Date('2025-01-01').toISOString() });
    await addTransaction({ wkn, type:'buy', qty_micro: parseQtyToMicro('3'), price_minor: parseMoneyToMinor('12','USD'), currency:'USD', ts: new Date('2025-02-01').toISOString() });
    await addFx({ currency:'USD', date:'2025-01-01', rate_ppm: rateToPPM('0.90') });
    await addFx({ currency:'USD', date:'2025-02-01', rate_ppm: rateToPPM('0.95') });
    const s = (await listStocks()).find(s=>s.wkn===wkn);
    valuationMethod='fifo'; const pf = await positionWithLots(s,'fifo');
    valuationMethod='lifo'; const pl = await positionWithLots(s,'lifo');
    log(`FIFO qty=${pf.qty_micro} cost(EUR)=${pf.cost_eur_minor/100} vs LIFO qty=${pl.qty_micro} cost(EUR)=${pl.cost_eur_minor/100}`);
  } catch(e){ log('FIFO/LIFO test failed: '+e.message); }
}

// ----------------- Event bindings -----------------
document.addEventListener('DOMContentLoaded', async () => {
  db = await openDB();

  // Controls
  document.getElementById('valuation-method').onchange = async (e)=>{
    valuationMethod = e.target.value; 
    await refreshStocksTable();
  };
  document.getElementById('base-currency').onchange = async (e)=>{
    baseCurrency = e.target.value.toUpperCase();
    if (baseCurrency !== 'EUR') alert('Derzeit nur EUR voll unterstützt');
    await refreshStocksTable();
  };

  // Stocks
  byId('add-stock').onclick = async ()=>{
    const wkn = byId('stock-wkn').value.trim();
    const name = byId('stock-name').value.trim();
    const exchange = byId('stock-exchange').value.trim();
    const currency = byId('stock-currency').value;
    if (!wkn || !/^[A-Z0-9]{3,}$/.test(wkn)) return alert('WKN erforderlich (≥3 Zeichen, A‑Z/0‑9)');
    if (!name) return alert('Name erforderlich');
    if (!(currency in CURRENCY_MINOR)) return alert('Unbekannte Währung');
    await upsertStock({ wkn, name, exchange, currency });
    byId('stock-wkn').value = ''; byId('stock-name').value=''; byId('stock-exchange').value='';
    await refreshStocksTable();
  };

  // Transactions
  byId('add-tx').onclick = async ()=>{
    try {
      const wkn = byId('tx-wkn').value.trim();
      const type = byId('tx-type').value;
      const qtyVal = byId('tx-qty').value.trim();
      if (!wkn) return alert('WKN erforderlich');
      if (!qtyVal || Number(qtyVal) <= 0) return alert('Menge > 0 erforderlich');
      const qty_micro = parseQtyToMicro(qtyVal);
      const priceStr = byId('tx-price').value.trim();
      const curr = (byId('tx-curr').value.trim() || 'EUR').toUpperCase();
      if (!(curr in CURRENCY_MINOR)) return alert('Unbekannte Währung');
      const price_minor = priceStr ? parseMoneyToMinor(priceStr, curr) : 0;
      const ts = byId('tx-ts').value ? new Date(byId('tx-ts').value).toISOString() : new Date().toISOString();
      if ((type==='buy' || type==='sell') && price_minor<=0) return alert('Preis pro Stück > 0 erforderlich');
      await addTransaction({ wkn, type, qty_micro, price_minor, currency: curr, ts });
      await refreshTransactionsTable();
      await refreshStocksTable();
    } catch (e) { alert('Fehler bei Transaktion: ' + e.message); }
  };

  // Quotes
  byId('add-quote').onclick = async ()=>{
    try {
      const wkn = byId('q-wkn').value.trim();
      const date = byId('q-date').value;
      const priceStr = byId('q-price').value.trim();
      const curr = (byId('q-currency').value.trim() || 'EUR').toUpperCase();
      if (!wkn || !date || !priceStr) return alert('WKN, Datum & Preis erforderlich');
      if (!(curr in CURRENCY_MINOR)) return alert('Unbekannte Währung');
      const price_minor = parseMoneyToMinor(priceStr, curr);
      await addQuote({ wkn, date, price_minor, currency: curr });
      await refreshStocksTable();
      await showChartForSelected();
    } catch (e) { alert('Fehler bei Quote: ' + e.message); }
  };

  byId('btn-chart').onclick = showChartForSelected;

  // FX
  byId('add-fx').onclick = async ()=>{
    try {
      const c = byId('fx-currency').value.trim().toUpperCase();
      const d = byId('fx-date').value;
      const r = byId('fx-rate').value.trim();
      if (!c || !d || !r) return alert('Währung, Datum, Rate erforderlich');
      const ppm = rateToPPM(r);
      await addFx({ currency: c, date: d, rate_ppm: ppm });
      alert(`FX gespeichert: 1 ${c} = ${r} EUR`);
    } catch(e){ alert('FX Fehler: '+e.message); }
  };

  byId('quotes-import').onchange = async (e)=>{
    const file = e.target.files[0]; if (!file) return;
    await importFiles([file]); await showChartForSelected(); await refreshStocksTable();
  };
  byId('fx-import').onchange = async (e)=>{
    const file = e.target.files[0]; if (!file) return;
    await importFiles([file]); await refreshStocksTable();
  };

  // Export / Import
  byId('btn-export').onclick = async (e)=>{ e.preventDefault(); await exportAll(); };
  byId('btn-import').onclick = (e)=>{ e.preventDefault(); byId('file-import').click(); };
  byId('file-import').onchange = async (e)=>{
    await importFiles(Array.from(e.target.files));
    await refreshStocksTable();
    await refreshTransactionsTable();
  };

  // Public / Tests toggles
  byId('btn-public').onclick = ()=>{
    byId('module-public').classList.toggle('hidden');
    byId('app-sections').classList.toggle('hidden');
  };
  byId('btn-tests').onclick = ()=>{
    byId('module-tests').classList.toggle('hidden');
  };
  byId('run-tests').onclick = runTests;

  await refreshStocksTable();
  await refreshTransactionsTable();
});
