// Roadmap tasks stored in IndexedDB with JSON export/import
// Schema uses the same database name as dashboard to avoid duplicates.
// We bump to version 3 to add a 'roadmap_tasks' store and ensure other pages should also accept v3.

const DB_NAME = 'cvdb';
const DB_VERSION = 3;

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;

      // existing stores from other pages (create if missing)
      if (!db.objectStoreNames.contains('stocks')) db.createObjectStore('stocks', { keyPath:'wkn' });
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
      if (!db.objectStoreNames.contains('fx_rates')) {
        const os = db.createObjectStore('fx_rates', { keyPath: ['currency','date'] });
        os.createIndex('by_currency','currency',{unique:false});
        os.createIndex('by_date','date',{unique:false});
      }

      // roadmap store v3
      if (!db.objectStoreNames.contains('roadmap_tasks')) {
        const os = db.createObjectStore('roadmap_tasks', { keyPath: 'id', autoIncrement: true });
        os.createIndex('by_checked', 'checked', { unique: false });
        os.createIndex('by_creationDate', 'creationDate', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode='readonly') {
  const t = db.transaction(store, mode);
  return { t, store: t.objectStore(store) };
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
function getAll(store, index=null, keyRange=null) {
  return new Promise((res, rej) => {
    const src = index ? store.index(index) : store;
    const req = src.getAll(keyRange || null);
    req.onsuccess = ()=>res(req.result || []);
    req.onerror = ()=>rej(req.error);
  });
}

function byId(id){ return document.getElementById(id); }

// --- CRUD ---
async function addTask(name) {
  const { store } = tx('roadmap_tasks','readwrite');
  const now = new Date().toISOString();
  const task = { name, creationDate: now, checked: false, finishedDate: null };
  await put(store, task);
  return task;
}

async function listTasks() {
  const { store } = tx('roadmap_tasks');
  const arr = await getAll(store);
  // newest first by creationDate
  arr.sort((a,b)=> (a.creationDate < b.creationDate) ? 1 : -1);
  return arr;
}

async function setChecked(id, checked) {
  const { store, t } = tx('roadmap_tasks','readwrite');
  const getReq = store.get(id);
  return new Promise((resolve, reject)=>{
    getReq.onsuccess = ()=>{
      const item = getReq.result;
      if (!item) return resolve();
      item.checked = checked;
      item.finishedDate = checked ? new Date().toISOString() : null;
      const p = store.put(item);
      p.onsuccess = ()=>resolve();
      p.onerror = ()=>reject(p.error);
    };
    getReq.onerror = ()=>reject(getReq.error);
  });
}

async function removeTask(id) {
  const { store } = tx('roadmap_tasks','readwrite');
  await del(store, id);
}

// --- Export / Import ---
async function exportRoadmap() {
  const { store } = tx('roadmap_tasks');
  const data = await getAll(store);
  // Export minimal shape without id for portability
  const portable = data.map(({name,creationDate,checked,finishedDate})=>({name,creationDate,checked,finishedDate}));
  const blob = new Blob([JSON.stringify(portable, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'roadmap.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

async function importRoadmap(file) {
  //console.log("Liste vor Import:", await listTasks());
  const text = await file.text();
  let items = [];
  if (file.name.endsWith('.jsonl')) {
    items = text
        .split(/\r?\n/)
        .filter(Boolean)
        .map(line => JSON.parse(line));
  } else {
    const arr = JSON.parse(text);
    items = Array.isArray(arr) ? arr : [];
  }
  const { store } = tx('roadmap_tasks','readwrite');
  for (const it of items) {
    const obj = {
      name: String(it.name || '').trim(),
      creationDate: it.creationDate || new Date().toISOString(),
      checked: !!it.checked,
      finishedDate: it.checked ? (it.finishedDate || new Date().toISOString()) : null
    };
    if (!obj.name) continue;
    await put(store, obj);
    //store.put(obj);
  }
  /*
  await new Promise((resolve,reject)=>{
    t.oncomplete = resolve;
    t.onerror = reject;
    t.onabort = reject;
  });
  console.log("Liste nach Import:", await listTasks());
  */
}

// --- Rendering ---
function renderItem(item) {
  const li = document.createElement('li');
  if (item.checked) li.classList.add('done');
  li.innerHTML = `
    <label>
      <input type="checkbox" data-id="${item.id||''}" ${item.checked ? 'checked' : ''}/>
      ${escapeHtml(item.name)}
    </label>
    <div class="dates">
      <span>erstellt: ${formatDate(item.creationDate)}</span> ·
      <span>fertig: ${item.finishedDate ? formatDate(item.finishedDate) : '-'}</span>
    </div>
    <div class="controls" style="margin-top:0.5rem;">
      <button data-del="${item.id||''}" class="danger">Löschen</button>
    </div>
  `;
  return li;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function formatDate(iso) {
  try { return new Date(iso).toLocaleString('de-DE'); } catch { return iso; }
}

async function refreshList() {
  const ul = byId('roadmap-list');
  ul.innerHTML = '';
  const items = await listTasks();
  for (const it of items) {
    const li = renderItem(it);
    ul.appendChild(li);
  }

  // bind handlers
  ul.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.onchange = async (e)=>{
      // need id: fetch parent item id by matching in memory again (since id might be undefined if newly created before auto id?)
      // We rely on listTasks returning with ids, which IndexedDB does once stored.
      const id = Number(cb.getAttribute('data-id'));
      if (!Number.isFinite(id)) return;
      await setChecked(id, cb.checked);
      await refreshList();
    };
  });
  ul.querySelectorAll('button[data-del]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = Number(btn.getAttribute('data-del'));
      if (!Number.isFinite(id)) return;
      await removeTask(id);
      await refreshList();
    };
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async ()=>{
  db = await openDB();

  // Add task
  const input = byId('new-task-input');
  const addBtn = byId('add-task-btn');
  if (addBtn) {
    addBtn.onclick = async ()=>{
      const name = input.value.trim();
      if (!name) return alert('Bitte Aufgabenname eingeben');
      await addTask(name);
      input.value = '';
      await refreshList();
    };
  }

  // Export / Import
  const btnExport = byId('roadmap-export');
  const btnImport = byId('roadmap-import');
  const fileImport = byId('roadmap-import-file');
  if (btnExport) btnExport.onclick = exportRoadmap;
  if (btnImport && fileImport) {
    btnImport.onclick = ()=> fileImport.click();
    fileImport.onchange = async (e)=>{
      const f = e.target.files[0]; if (!f) return;
      await importRoadmap(f);
      await refreshList();
    };
  }

  await refreshList();
});
