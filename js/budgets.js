/* === BUDGETS MODULE v0.3.0 === */
const Budgets = (() => {
  const getAll = () => Storage.getBudgets() || [];
  const setAll = (list) => Storage.setBudgets(list);

  const add = (data) => {
    const all = getAll();
    all.push({
      id:         `bud_${Date.now()}`,
      name:       data.name       || 'Budżet',
      limit:      parseFloat(data.limit) || 0,
      period:     data.period     || 'month',   // week | month | year | once
      categoryId: data.categoryId || null,       // null = wszystkie
      color:      data.color      || '#6c63ff',
      createdAt:  new Date().toISOString(),
    });
    setAll(all);
  };

  const remove = (id) => setAll(getAll().filter(b => b.id !== id));

  const update = (id, patch) => setAll(getAll().map(b => b.id === id ? { ...b, ...patch } : b));

  // Calculate spent amount for a budget in current period
  const calcSpent = (budget) => {
    const now  = new Date();
    let from;
    switch (budget.period) {
      case 'week':  from = new Date(now); from.setDate(now.getDate() - now.getDay()); break;
      case 'year':  from = new Date(now.getFullYear(), 0, 1); break;
      case 'once':  from = new Date(budget.createdAt); break;
      default:      from = new Date(now.getFullYear(), now.getMonth(), 1); // month
    }
    from.setHours(0, 0, 0, 0);

    return Transactions.getAll()
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (budget.categoryId && t.categoryId !== budget.categoryId) return false;
        return new Date(t.date) >= from;
      })
      .reduce((s, t) => s + t.amount, 0);
  };

  // Forecast: project spending to end of period
  const calcForecast = (budget) => {
    const now  = new Date();
    const spent = calcSpent(budget);
    let periodDays, elapsedDays;
    switch (budget.period) {
      case 'week':
        periodDays  = 7;
        elapsedDays = now.getDay() || 7;
        break;
      case 'year':
        periodDays  = 365;
        elapsedDays = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
        break;
      case 'once':
        return { projected: spent, willExceed: spent > budget.limit, diff: budget.limit - spent };
      default: // month
        periodDays  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        elapsedDays = now.getDate();
    }
    const dailyRate = elapsedDays > 0 ? spent / elapsedDays : 0;
    const projected = dailyRate * periodDays;
    const pct       = budget.limit > 0 ? Math.round((projected / budget.limit) * 100) : 0;
    return {
      projected,
      pct,
      willExceed: projected > budget.limit,
      diff:       budget.limit - projected,
    };
  };

  const getStatus = (spent, limit) => {
    if (limit <= 0) return 'ok';
    const pct = spent / limit;
    if (pct >= 1)   return 'over';
    if (pct >= 0.8) return 'warn';
    return 'ok';
  };

  const render = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all = getAll();
    const s   = Storage.getSettings();

    if (!all.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><p>Brak budżetów</p><span>Dodaj budżet, aby śledzić wydatki</span></div>`;
      return;
    }

    el.innerHTML = all.map(b => {
      const spent  = calcSpent(b);
      const pct    = b.limit > 0 ? Math.min(Math.round((spent / b.limit) * 100), 100) : 0;
      const status = getStatus(spent, b.limit);
      const fc     = calcForecast(b);
      const statusIcon = status === 'over' ? '🔴' : status === 'warn' ? '🟡' : '🟢';
      const periodLabel = { week: 'Tygodniowy', month: 'Miesięczny', year: 'Roczny', once: 'Jednorazowy' }[b.period] || '';
      const cat  = b.categoryId ? Categories.getById(b.categoryId, 'expense') : null;

      let forecastText = '';
      if (fc.willExceed) {
        forecastText = `Przy obecnym tempie przekroczysz budżet o <strong>${formatCurrency(Math.abs(fc.diff), s.currency)}</strong>.`;
      } else if (b.period !== 'once') {
        const fpct = Math.round((fc.projected / b.limit) * 100);
        forecastText = `Przy obecnym tempie wykorzystasz ok. <strong>${fpct}%</strong> budżetu.`;
      }

      return `
        <div class="budget-card status-${status}" data-id="${b.id}">
          <div class="budget-header">
            <div class="budget-title">
              <span class="budget-status-icon">${statusIcon}</span>
              <span class="budget-name">${b.name}</span>
              ${cat ? `<span class="budget-cat">${cat.emoji} ${cat.name}</span>` : ''}
            </div>
            <div class="budget-actions">
              <span class="budget-period-badge">${periodLabel}</span>
              <button class="bud-del-btn" data-id="${b.id}">✕</button>
            </div>
          </div>
          <div class="budget-amounts">
            <span class="budget-spent">${formatCurrency(spent, s.currency)}</span>
            <span class="budget-sep">/</span>
            <span class="budget-limit">${formatCurrency(b.limit, s.currency)}</span>
            <span class="budget-pct">${pct}%</span>
          </div>
          <div class="budget-track">
            <div class="budget-fill status-${status}" style="width:${pct}%"></div>
          </div>
          <div class="budget-remaining">
            Pozostało: <strong class="${status === 'over' ? 'expense' : 'income'}">${formatCurrency(Math.max(b.limit - spent, 0), s.currency)}</strong>
          </div>
          ${forecastText ? `<div class="budget-forecast">${forecastText}</div>` : ''}
        </div>`;
    }).join('');

    el.querySelectorAll('.bud-del-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        if (confirm('Usunąć budżet?')) { remove(btn.dataset.id); render(containerId); Toast.show('Budżet usunięty'); }
      })
    );
  };

  return { getAll, add, remove, update, calcSpent, calcForecast, getStatus, render };
})();
