/* ============================================
   CashFlow v0.1.0 — Format Utility
   ============================================ */

const Format = (() => {
  const currency = (amount, symbol = 'PLN', decimals = 2) => {
    const n = parseFloat(amount) || 0;
    return n.toLocaleString('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' ' + symbol;
  };

  const currencyCompact = (amount, symbol = 'PLN') => {
    const n = parseFloat(amount) || 0;
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M ' + symbol;
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k ' + symbol;
    return currency(n, symbol);
  };

  const number = (n, decimals = 2) => {
    return (parseFloat(n) || 0).toLocaleString('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const percent = (value, total) => {
    if (!total) return '0%';
    return Math.round((value / total) * 100) + '%';
  };

  const sign = (amount) => amount >= 0 ? '+' : '';

  return { currency, currencyCompact, number, percent, sign };
})();
