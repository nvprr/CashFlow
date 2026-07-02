/* === STORAGE MODULE v0.2.0 === */
const Storage = (() => {
  const KEYS = {
    TRANSACTIONS: 'cf_transactions',
    GOALS:        'cf_goals',
    CATEGORIES:   'cf_categories',
    SETTINGS:     'cf_settings',
    WORK_HISTORY: 'cf_work_history',
  };

  // Safe read — never throws
  const get = (key) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : null;
    } catch (e) {
      console.warn('Storage.get error', key, e);
      return null;
    }
  };

  // Safe write — never throws
  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage.set error', key, e);
      return false;
    }
  };

  const remove = (key) => { try { localStorage.removeItem(key); } catch {} };

  /* ---- Public accessors (always return safe defaults) ---- */

  const getTransactions = () => get(KEYS.TRANSACTIONS) || [];
  const setTransactions = (data) => set(KEYS.TRANSACTIONS, data);

  const getGoals = () => get(KEYS.GOALS) || [];
  const setGoals = (data) => set(KEYS.GOALS, data);

  const getCategories = () => get(KEYS.CATEGORIES);   // null = use defaults
  const setCategories = (data) => set(KEYS.CATEGORIES, data);

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    accent: '#6c63ff',
    currency: 'PLN',
    dateFormat: 'DD.MM.YYYY',
  };
  const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(get(KEYS.SETTINGS) || {}) });
  const setSettings = (data) => set(KEYS.SETTINGS, data);
  const patchSettings = (patch) => setSettings({ ...getSettings(), ...patch });

  const getWorkHistory = () => get(KEYS.WORK_HISTORY) || [];
  const setWorkHistory = (data) => set(KEYS.WORK_HISTORY, data);

  /* ---- Export / Import / Backup ---- */

  const exportAll = () => ({
    transactions: getTransactions(),
    goals:        getGoals(),
    categories:   getCategories(),
    settings:     getSettings(),
    workHistory:  getWorkHistory(),
    exportedAt:   new Date().toISOString(),
    version:      '0.2.0',
  });

  const importAll = (raw) => {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.goals))        setGoals(data.goals);
      if (data.categories)                  setCategories(data.categories);
      if (data.settings)                    setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (Array.isArray(data.workHistory))  setWorkHistory(data.workHistory);
      return true;
    } catch (e) {
      console.error('importAll failed', e);
      return false;
    }
  };

  const clearAll = () => Object.values(KEYS).forEach(remove);

  return {
    getTransactions, setTransactions,
    getGoals,        setGoals,
    getCategories,   setCategories,
    getSettings,     setSettings, patchSettings,
    getWorkHistory,  setWorkHistory,
    exportAll, importAll, clearAll,
  };
})();
