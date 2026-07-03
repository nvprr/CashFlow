/* === SCHEDULED PAYMENTS MODULE v0.3.0 === */
const Scheduled = (() => {
  const getAll  = () => Storage.getScheduled() || [];
  const setAll  = (list) => Storage.setScheduled(list);

  const FREQ_LABELS = {
    once: 'Jednorazowa', weekly: 'Co tydzień', monthly: 'Co miesiąc', yearly: 'Co rok'
  };

  const add = (data) => {
    const all = getAll();
    all.push({
      id:         `sch_${Date.now()}`,
      name:       data.name       || 'Płatność',
      amount:     parseFloat(data.amount) || 0,
      categoryId: data.categoryId || 'other',
      date:       data.date,               // next occurrence YYYY-MM-DD
      frequency:  data.frequency  || 'monthly',
      accountId:  data.accountId  || null,
      active:     true,
      createdAt:  new Date().toISOString(),
    });
    setAll(all);
  };

  const remove  = (id) => setAll(getAll().filter(p => p.id !== id));
  const toggle  = (id) => setAll(getAll().map(p => p.id === id ? { ...p, active: !p.active } : p));

  // Next N occurrences of a payment starting from its date
  const getOccurrences = (payment, count = 3) => {
    const results = [];
    let d = new Date(payment.date + 'T00:00:00');
    for (let i = 0; i < count; i++) {
      results.push(new Date(d));
      if (payment.frequency === 'once') break;
      if (payment.frequency === 'weekly')  d.setDate(d.getDate() + 7);
      if (payment.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      if (payment.frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1);
    }
    return results;
  };

  // Get upcoming payments in a given month (0-indexed)
  const getForMonth = (year, month) => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0);
    const results = [];
    getAll().filter(p => p.active).forEach(p => {
      const occs = getOccurrences(p, 24); // look up to 24 occurrences
      occs.forEach(d => {
        if (d >= start && d <= end) results.push({ ...p, occDate: d.toISOString().split('T')[0] });
      });
    });
    return results;
  };

  // Total for a given month
  const totalForMonth = (year, month) =>
    getForMonth(year, month).reduce((s, p) => s + p.amount, 0);

  // Upcoming payments (next 30 days)
  const getUpcoming = (days = 30) => {
    const now    = new Date(); now.setHours(0,0,0,0);
    const cutoff = new Date(now); cutoff.setDate(now.getDate() + days);
    const results = [];
    getAll().filter(p => p.active).forEach(p => {
      getOccurrences(p, 12).forEach(d => {
        if (d >= now && d <= cutoff) results.push({ ...p, occDate: d.toISOString().split('T')[0] });
      });
    });
    return results.sort((a, b) => new Date(a.occDate) - new Date(b.occDate));
  };

  // 3-month forecast
  const getMonthlyForecast = () => {
    const now = new Date();
    return [0, 1, 2].map(i => {
      const y = now.getMonth() + i > 11 ? now.getFullYear() + 1 : now.getFullYear();
      const m = (now.getMonth() + i) % 12;
      const label = new Date(y, m, 1).toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
      return { label, year: y, month: m, total: totalForMonth(y, m) };
    });
  };

  const render = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all = getAll();
    const s   = Storage.getSettings();

    if (!all.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>Brak płatności</p><span>Dodaj zaplanowaną płatność</span></div>`;
      return;
    }

    const forecast = getMonthlyForecast();

    el.innerHTML = `
      <div class="scheduled-forecast">
        ${forecast.map(f => `
          <div class="forecast-month">
            <div class="fm-label">${f.label}</div>
            <div class="fm-amount expense">${formatCurrency(f.total, s.currency)}</div>
          </div>`).join('')}
      </div>
      ${all.map(p => {
        const cat  = Categories.getById(p.categoryId, 'expense');
        const next = getOccurrences(p, 1)[0];
        const daysUntil = next ? Math.ceil((next - new Date()) / 86400000) : null;
        const urgency = daysUntil !== null && daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'soon' : '';
        return `
          <div class="scheduled-card ${p.active ? '' : 'inactive'} ${urgency}" data-id="${p.id}">
            <div class="sch-icon">${cat.emoji}</div>
            <div class="sch-info">
              <div class="sch-name">${p.name}</div>
              <div class="sch-meta">
                ${FREQ_LABELS[p.frequency] || p.frequency}
                ${next ? ` · za ${Math.max(daysUntil, 0)} dni (${formatDate(next.toISOString().split('T')[0], s.dateFormat)})` : ''}
              </div>
            </div>
            <div class="sch-right">
              <div class="sch-amount expense">${formatCurrency(p.amount, s.currency)}</div>
              <div class="sch-actions">
                <button class="sch-toggle" data-id="${p.id}">${p.active ? '⏸' : '▶'}</button>
                <button class="sch-del"    data-id="${p.id}">✕</button>
              </div>
            </div>
          </div>`;
      }).join('')}`;

    el.querySelectorAll('.sch-del').forEach(btn =>
      btn.addEventListener('click', () => {
        if (confirm('Usunąć tę płatność?')) { remove(btn.dataset.id); render(containerId); Toast.show('Płatność usunięta'); }
      })
    );
    el.querySelectorAll('.sch-toggle').forEach(btn =>
      btn.addEventListener('click', () => { toggle(btn.dataset.id); render(containerId); })
    );
  };

  // Widget: upcoming payments + monthly totals
  const renderWidget = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const s        = Storage.getSettings();
    const upcoming = getUpcoming(14);
    const forecast = getMonthlyForecast();
    const now      = new Date();
    const thisM    = totalForMonth(now.getFullYear(), now.getMonth());
    const nextM    = totalForMonth(
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      (now.getMonth() + 1) % 12
    );

    el.innerHTML = `
      <div class="widget-sch-summary">
        <div class="wss-item"><span>Ten miesiąc</span><strong class="expense">${formatCurrency(thisM, s.currency)}</strong></div>
        <div class="wss-item"><span>Następny</span><strong class="expense">${formatCurrency(nextM, s.currency)}</strong></div>
      </div>
      ${upcoming.slice(0, 5).map(p => {
        const daysUntil = Math.ceil((new Date(p.occDate) - new Date()) / 86400000);
        return `<div class="widget-sch-row">
          <span class="wsr-name">${p.name}</span>
          <span class="wsr-days">${daysUntil <= 0 ? 'Dziś' : `za ${daysUntil}d`}</span>
          <span class="wsr-amt expense">${formatCurrency(p.amount, s.currency)}</span>
        </div>`;
      }).join('') || '<div class="empty-state small"><p>Brak nadchodzących płatności</p></div>'}`;
  };

  return { getAll, add, remove, toggle, getUpcoming, getForMonth, totalForMonth, getMonthlyForecast, render, renderWidget };
})();
