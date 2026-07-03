/* === STORAGE MODULE v0.3.0 === */
const Storage = (() => {
  const KEYS = {
    TRANSACTIONS:  'cf_transactions',
    GOALS:         'cf_goals',
    CATEGORIES:    'cf_categories',
    SETTINGS:      'cf_settings',
    WORK_HISTORY:  'cf_work_history',
    ACCOUNTS:      'cf_accounts',
    BUDGETS:       'cf_budgets',
    SCHEDULED:     'cf_scheduled',
    WIDGET_LAYOUT: 'cf_widget_layout',
  };

  const get = (key) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : null;
    } catch (e) { console.warn('Storage.get', key, e); return null; }
  };

  const set = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('Storage.set', key, e); return false; }
  };

  const remove = (key) => { try { localStorage.removeItem(key); } catch {} };

  const DEFAULT_SETTINGS = {
    theme: 'dark', accent: '#6c63ff', currency: 'PLN', dateFormat: 'DD.MM.YYYY',
  };

  const getTransactions  = () => get(KEYS.TRANSACTIONS)  || [];
  const setTransactions  = (d) => set(KEYS.TRANSACTIONS, d);
  const getGoals         = () => get(KEYS.GOALS)         || [];
  const setGoals         = (d) => set(KEYS.GOALS, d);
  const getCategories    = () => get(KEYS.CATEGORIES);
  const setCategories    = (d) => set(KEYS.CATEGORIES, d);
  const getSettings      = () => ({ ...DEFAULT_SETTINGS, ...(get(KEYS.SETTINGS) || {}) });
  const setSettings      = (d) => set(KEYS.SETTINGS, d);
  const patchSettings    = (p) => setSettings({ ...getSettings(), ...p });
  const getWorkHistory   = () => get(KEYS.WORK_HISTORY)  || [];
  const setWorkHistory   = (d) => set(KEYS.WORK_HISTORY, d);
  const getAccounts      = () => get(KEYS.ACCOUNTS);
  const setAccounts      = (d) => set(KEYS.ACCOUNTS, d);
  const getBudgets       = () => get(KEYS.BUDGETS)        || [];
  const setBudgets       = (d) => set(KEYS.BUDGETS, d);
  const getScheduled     = () => get(KEYS.SCHEDULED)      || [];
  const setScheduled     = (d) => set(KEYS.SCHEDULED, d);
  const getWidgetLayout  = () => get(KEYS.WIDGET_LAYOUT);
  const setWidgetLayout  = (d) => set(KEYS.WIDGET_LAYOUT, d);

  const exportAll = () => ({
    transactions: getTransactions(), goals: getGoals(), categories: getCategories(),
    settings: getSettings(), workHistory: getWorkHistory(), accounts: getAccounts(),
    budgets: getBudgets(), scheduled: getScheduled(), widgetLayout: getWidgetLayout(),
    exportedAt: new Date().toISOString(), version: '0.3.0',
  });

  const importAll = (raw) => {
    try {
      const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(d.transactions)) setTransactions(d.transactions);
      if (Array.isArray(d.goals))        setGoals(d.goals);
      if (d.categories)                  setCategories(d.categories);
      if (d.settings)                    setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
      if (Array.isArray(d.workHistory))  setWorkHistory(d.workHistory);
      if (d.accounts)                    setAccounts(d.accounts);
      if (d.budgets)                     setBudgets(d.budgets);
      if (d.scheduled)                   setScheduled(d.scheduled);
      if (d.widgetLayout)                setWidgetLayout(d.widgetLayout);
      return true;
    } catch (e) { console.error('importAll', e); return false; }
  };

  const clearAll = () => Object.values(KEYS).forEach(remove);

  return {
    getTransactions, setTransactions, getGoals, setGoals,
    getCategories, setCategories, getSettings, setSettings, patchSettings,
    getWorkHistory, setWorkHistory, getAccounts, setAccounts,
    getBudgets, setBudgets, getScheduled, setScheduled,
    getWidgetLayout, setWidgetLayout,
    exportAll, importAll, clearAll,
  };
})();
