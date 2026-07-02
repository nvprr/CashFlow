/* ============================================
   CashFlow v0.1.0 — Date Utility
   ============================================ */

const DateUtil = (() => {
  const MONTHS_PL = [
    'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
  ];
  const MONTHS_PL_GEN = [
    'stycznia','lutego','marca','kwietnia','maja','czerwca',
    'lipca','sierpnia','września','października','listopada','grudnia'
  ];
  const DAYS_PL = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];

  const today = () => {
    const d = new Date();
    return toInputFormat(d);
  };

  const toInputFormat = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const format = (dateStr, fmt = 'dd.mm.yyyy') => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    switch (fmt) {
      case 'dd.mm.yyyy': return `${dd}.${mm}.${yyyy}`;
      case 'yyyy-mm-dd': return `${yyyy}-${mm}-${dd}`;
      case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
      default: return `${dd}.${mm}.${yyyy}`;
    }
  };

  const formatShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return DAYS_PL[d.getDay()];
    return `${d.getDate()} ${MONTHS_PL_GEN[d.getMonth()]}`;
  };

  const monthYear = (date) => {
    const d = new Date(date);
    return `${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonthKey = () => getMonthKey(new Date());

  const prevMonthKey = (key) => {
    const [y, m] = key.split('-').map(Number);
    if (m === 1) return `${y - 1}-12`;
    return `${y}-${String(m - 1).padStart(2, '0')}`;
  };

  const nextMonthKey = (key) => {
    const [y, m] = key.split('-').map(Number);
    if (m === 12) return `${y + 1}-01`;
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  };

  const monthKeyToLabel = (key) => {
    const [y, m] = key.split('-').map(Number);
    return `${MONTHS_PL[m - 1]} ${y}`;
  };

  const isWeekend = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

  return {
    today, toInputFormat, format, formatShort,
    monthYear, getMonthKey, currentMonthKey,
    prevMonthKey, nextMonthKey, monthKeyToLabel,
    isWeekend, daysInMonth, MONTHS_PL
  };
})();
