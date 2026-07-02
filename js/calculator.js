/* === SALARY CALCULATOR MODULE v0.2.0 === */
const Calculator = (() => {
  let lastCalc = null;
  let _bound   = false;

  // Preset configs
  const PRESETS = [
    { label: '1 dzień (8h)',   hours: 8,   days: 1 },
    { label: 'Tydzień (40h)', hours: 40,  days: 5 },
    { label: 'Miesiąc',       hours: 168, days: 22 },
  ];

  const init = () => {
    if (_bound) { renderHistory(); return; }
    _bound = true;

    document.getElementById('calc-btn')?.addEventListener('click', calculate);
    document.getElementById('save-work-day-btn')?.addEventListener('click', saveDay);
    document.getElementById('clear-work-history-btn')?.addEventListener('click', clearHistory);

    // Presets
    const presetRow = document.getElementById('calc-presets');
    if (presetRow) {
      presetRow.innerHTML = PRESETS.map(p =>
        `<button class="preset-chip" data-hours="${p.hours}" data-days="${p.days}">${p.label}</button>`
      ).join('');
      presetRow.querySelectorAll('.preset-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const rateEl = document.getElementById('calc-rate');
          const hoursEl = document.getElementById('calc-hours');
          const daysEl  = document.getElementById('calc-days');
          if (hoursEl) hoursEl.value = btn.dataset.hours;
          if (daysEl)  daysEl.value  = btn.dataset.days;
          calculate();
        });
      });
    }

    // Live calculation on input
    ['calc-rate','calc-hours','calc-days'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        const rate  = parseFloat(document.getElementById('calc-rate')?.value);
        const hours = parseFloat(document.getElementById('calc-hours')?.value);
        if (rate > 0 && hours > 0) calculate(true);
      });
    });

    renderHistory();
  };

  const calculate = (silent = false) => {
    const rate  = parseFloat(document.getElementById('calc-rate')?.value);
    const hours = parseFloat(document.getElementById('calc-hours')?.value);
    const days  = parseFloat(document.getElementById('calc-days')?.value) || 1;

    if (!rate || !hours || rate <= 0 || hours <= 0) {
      if (!silent) Toast.show('Wprowadź stawkę i liczbę godzin');
      return;
    }

    const daily   = rate * hours;
    const weekly  = rate * 40;              // standard 40h week
    const monthly = rate * 168;             // ~168h/month
    const yearly  = monthly * 12;
    const custom  = rate * hours * days;    // custom days

    lastCalc = { rate, hours, days, daily, weekly, monthly, yearly, custom };
    const s = Storage.getSettings();

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatCurrency(val, s.currency);
    };

    set('calc-daily',   daily);
    set('calc-weekly',  weekly);
    set('calc-monthly', monthly);
    set('calc-yearly',  yearly);
    set('calc-custom',  custom);

    const results = document.getElementById('calc-results');
    if (results && results.style.display === 'none') {
      results.style.display = 'flex';
    }
  };

  const saveDay = () => {
    if (!lastCalc) { Toast.show('Najpierw oblicz wynagrodzenie'); return; }
    const history = Storage.getWorkHistory();
    history.unshift({
      id:     `wh_${Date.now()}`,
      date:   new Date().toISOString().split('T')[0],
      rate:   lastCalc.rate,
      hours:  lastCalc.hours,
      days:   lastCalc.days,
      earned: lastCalc.custom,
    });
    Storage.setWorkHistory(history.slice(0, 60));
    renderHistory();
    Toast.show('✅ Dzień pracy zapisany');
  };

  const clearHistory = () => {
    if (confirm('Wyczyścić historię pracy?')) {
      Storage.setWorkHistory([]);
      renderHistory();
      Toast.show('Historia wyczyszczona');
    }
  };

  const renderHistory = () => {
    const el = document.getElementById('work-history-list');
    if (!el) return;
    const history  = Storage.getWorkHistory();
    const settings = Storage.getSettings();

    if (!history.length) {
      el.innerHTML = `<div class="empty-state small"><p>Brak zapisanych dni</p></div>`;
      return;
    }

    // Total earnings
    const total = history.reduce((s, h) => s + h.earned, 0);

    el.innerHTML = `
      <div class="work-summary">
        <span>Łącznie zarobiono:</span>
        <strong class="income-color">${formatCurrency(total, settings.currency)}</strong>
      </div>
      ${history.map(item => `
        <div class="work-history-item">
          <span class="work-history-date">${formatDate(item.date, settings.dateFormat)}</span>
          <span class="work-history-detail">${item.hours}h × ${item.rate} zł/h${item.days > 1 ? ` × ${item.days}dni` : ''}</span>
          <span class="work-history-earn">${formatCurrency(item.earned, settings.currency)}</span>
        </div>`).join('')}`;
  };

  return { init };
})();
