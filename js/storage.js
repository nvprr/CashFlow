/* === STORAGE MODULE === */
const Storage = (() => {
  const KEYS = {
    TRANSACTIONS: 'cf_transactions',
    GOALS: 'cf_goals',
    CATEGORIES: 'cf_categories',
    SETTINGS: 'cf_settings',
    WORK_HISTORY: 'cf_work_history',
  };

  const get = (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  };

  const remove = (key) => localStorage.removeItem(key);

  const getTransactions = () => get(KEYS.TRANSACTIONS) || [];
  const setTransactions = (data) => set(KEYS.TRANSACTIONS, data);

  const getGoals = () => get(KEYS.GOALS) || [];
  const setGoals = (data) => set(KEYS.GOALS, data);

  const getCategories = () => get(KEYS.CATEGORIES) || null;
  const setCategories = (data) => set(KEYS.CATEGORIES, data);

  const getSettings = () => ({
    theme: 'dark',
    accent: '#6c63ff',
    currency: 'PLN',
    dateFormat: 'DD.MM.YYYY',
    ...(get(KEYS.SETTINGS) || {})
  });
  const setSettings = (data) => set(KEYS.SETTINGS, data);

  const getWorkHistory = () => get(KEYS.WORK_HISTORY) || [];
  const setWorkHistory = (data) => set(KEYS.WORK_HISTORY, data);

  const exportAll = () => ({
    transactions: getTransactions(),
    goals: getGoals(),
    categories: getCategories(),
    settings: getSettings(),
    workHistory: getWorkHistory(),
    exportedAt: new Date().toISOString(),
    version: '0.1.0'
  });

  const importAll = (data) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.goals) setGoals(data.goals);
    if (data.categories) setCategories(data.categories);
    if (data.settings) setSettings(data.settings);
    if (data.workHistory) setWorkHistory(data.workHistory);
  };

  const clearAll = () => {
    Object.values(KEYS).forEach(k => remove(k));
  };

  return {
    getTransactions, setTransactions,
    getGoals, setGoals,
    getCategories, setCategories,
    getSettings, setSettings,
    getWorkHistory, setWorkHistory,
    exportAll, importAll, clearAll
  };
})();
