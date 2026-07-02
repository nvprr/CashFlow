/* ============================================
   CashFlow v0.1.0 — Calculator Module
   ============================================ */

const Calculator = (() => {
  const getWorkdays = () => Storage.get('workdays', []);

  const saveWorkday = (entry) => {
    const all = getWorkdays();
    entry.id = 'wd_' + Date.now();
    all.unshift(entry);
    Storage.set('workdays', all.slice(0, 100)); // keep last 100
  };

  const removeWorkday = (id) => {
    Storage.set('workdays', getWorkdays().filter(w => w.id !== id));
  };

  const calculate = () => {
    const rate  = parseFloat(document.getElementById('calc-rate')?.value) || 0;
    const hours = parseFloat(document.getElementById('calc-hours')?.value) || 0;
    const cur   = Settings.get('currency');

    const daily   = rate * hours;
    const weekly  = daily * 5;
    const monthly = daily * 22;

    const fmt = (v) => Format.number(v) + ' ' + cur;

    const el = (id) => document.getElementById(id);
    if (el('calc-daily'))   el('calc-daily').textContent   = fmt(daily);
    if (el('calc-weekly'))  el('calc-weekly').textContent  = fmt(weekly);
    if (el('calc-monthly')) el('calc-monthly').textContent = fmt(monthly);

    return { rate, hours, daily, weekly, monthly };
  };

  const renderWorkdays = () => {
    const container = document.getElementById('workday-list');
    if (!container) return;
    const days = getWorkdays();
    container.innerHTML = '';
    if (!days.length) {
      container.innerHTML = `<div class="empty-state small"><div class="empty-text">Brak zapisanych dni</div></div>`;
      return;
    }
    const cur = Settings.get('currency');
    const fmt = Settings.get('dateFormat');
    days.forEach(w => {
      const el = document.createElement('div');
      el.className = 'workday-item';
      el.innerHTML = `
        <div class="workday-date">${DateUtil.format(w.date, fmt)}</div>
        <div class="workday-info">${w.hours}h × ${Format.number(w.rate)} ${cur}</div>
        <div class="workday-earn">${Format.number(w.daily)} ${cur}</div>
        <button class="tx-delete-btn" data-id="${w.id}">✕</button>
      `;
      el.querySelector('.tx-delete-btn').addEventListener('click', () => {
        removeWorkday(w.id);
        renderWorkdays();
      });
      container.appendChild(el);
    });
  };

  const bindEvents = () => {
    ['calc-rate','calc-hours'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calculate);
    });

    document.getElementById('btn-save-workday')?.addEventListener('click', () => {
      const { rate, hours, daily } = calculate();
      if (!rate || !hours) {
        Toast.show('Podaj stawkę i liczbę godzin', 'error');
        return;
      }
      saveWorkday({ date: DateUtil.today(), rate, hours, daily });
      renderWorkdays();
      Toast.show(`✅ Zapisano: ${Format.number(daily)} ${Settings.get('currency')}`, 'success');
    });

    document.getElementById('btn-clear-workdays')?.addEventListener('click', () => {
      if (confirm('Wyczyścić historię dni pracy?')) {
        Storage.set('workdays', []);
        renderWorkdays();
        Toast.show('🗑️ Historia wyczyszczona', 'success');
      }
    });
  };

  return { calculate, renderWorkdays, bindEvents };
})();
