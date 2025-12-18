window.DB = (() => {
  const DB_NAME = 'cvdb';
  const DB_VERSION = 3;
  let db;

  async function initDB() {
    db = await openDB();
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        if (!db.objectStoreNames.contains('stocks')) db.createObjectStore('stocks', { keyPath: 'isin' });
        if (!db.objectStoreNames.contains('transactions')) {
          const os = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
          os.createIndex('by_isin', 'isin', { unique: false });
          os.createIndex('by_ts', 'ts', { unique: false });
          os.createIndex('by_isin_ts', ['isin', 'ts'], { unique: false });
        }
        if (!db.objectStoreNames.contains('quotes')) {
          const os = db.createObjectStore('quotes', { keyPath: ['wkn', 'date'] });
          os.createIndex('by_isin', 'isin', { unique: false });
          os.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('fx_rates')) {
          const os = db.createObjectStore('fx_rates', { keyPath: ['currency', 'date'] });
          os.createIndex('by_currency', 'currency', { unique: false });
          os.createIndex('by_date', 'date', { unique: false });
        }
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

  async function tx(store, mode = 'readonly') {
    const t = db.transaction(store, mode);
    return { t, store: t.objectStore(store) };
  }

  async function put(store, value) {
    return new Promise((res, rej) => {
      const req = store.put(value);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async function del(store, key) {
    return new Promise((res, rej) => {
      const req = store.delete(key);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  }

  async function getAll(store, index = null, keyRange = null) {
    return new Promise((res, rej) => {
      const src = index ? store.index(index) : store;
      const req = src.getAll(keyRange || null);
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  }

  return { initDB, tx, put, del, getAll };
})();