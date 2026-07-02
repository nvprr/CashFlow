/* ============================================
   CashFlow v0.1.0 — Monthly Summary Module
   ============================================ */

const Summary = (() => {
  const render = () => {
    const grid = document.getElementById('summary-grid');
    if (!grid) return;

    const cur      = Settings.get('currency');
    const monthKey = DateUtil.currentMonthKey();
    const stats    = Transactions.getMonthStats(monthKey);
    const allTx    = Transactions.getAll();
    const expense  = allTx.filter(t => t.type === 'expense' && DateUtil.getMonthKey(t.date) === monthKey);

    // Top category
    let topCatLabel = '—';
    if (expense.length) {
      const byCat = {};
      expense.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
      const top = Object.entries(byCat).sort((a,b) => b[1]-a[1])[0];
      if (top) {
        const cat = Categories.getById(top[0]);
        topCatLabel = `${cat.emoji} ${cat.name}`;
      }
    }

    // Biggest single expense
    let biggestLabel = '—';
    if (expense.length) {
      const biggest = expense.reduce((max, t) => t.amount > max.amount ? t : max, expense[0]);
      const cat = Categories.getById(biggest.category);
      biggestLabel = `${Format.number(biggest.amount)} ${cur}`;
    }

    // Avg daily expense
    const uniqueDays = expense.length ? [...new Set(expense.map(t => t.date))].length : 0;
    const avgDaily   = uniqueDays ? stats.expense / uniqueDays : 0;

    const items = [
      { label: 'Przychody',             value: Format.number(stats.income) + ' ' + cur,   cls: 'accent' },
      { label: 'Wydatki',               value: Format.number(stats.expense) + ' ' + cur,  cls: 'expense' },
      { label: 'Oszczędności',          value: Format.number(stats.savings) + ' ' + cur,  cls: stats.savings >= 0 ? 'accent' : 'expense' },
      { label: 'Liczba transakcji',     value: stats.count,                                cls: '' },
      { label: 'Top kategoria',         value: topCatLabel,                                cls: '' },
      { label: 'Największy wydatek',    value: biggestLabel,                               cls: 'expense' },
      { label: 'Śr. dzienny wydatek',   value: avgDaily ? Format.number(avgDaily) + ' ' + cur : '—', cls: '' },
    ];

    grid.innerHTML = items.map(item => `
      <div class="summary-item">
        <div class="summary-item-label">${item.label}</div>
        <div class="summary-item-value ${item.cls}">${item.value}</div>
      </div>
    `).join('');
  };

  return { render };
})();
