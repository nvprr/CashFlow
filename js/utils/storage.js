/* ============================================
   CashFlow v0.1.0 — Storage Utility
   ============================================ */

const Storage = (() => {
  const PREFIX = 'cashflow_';

  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  };

  const remove = (key) => {
    localStorage.removeItem(PREFIX + key);
  };

  const clear = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  };

  const exportAll = () => {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => {
        try { data[k.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k.replace(PREFIX, '')] = localStorage.getItem(k); }
      });
    return data;
  };

  const importAll = (data) => {
    if (typeof data !== 'object') return false;
    Object.entries(data).forEach(([key, value]) => {
      set(key, value);
    });
    return true;
  };

  return { get, set, remove, clear, exportAll, importAll };
})();
