/* === CALCULATOR MODULE === */
const Calculator = (() => {
  let lastCalc = null;

  const init = () => {
    const btn = document.getElementById('calc-btn');
    const saveBtn = document.getElementById('save-work-day-btn');
    const clearBtn = document.getElementById('clear-work-history-btn');

    btn?.addEventListener('click', calculate);
    saveBtn?.addEventListener('click', saveDay);
    clearBtn?.addEventListener('click', clearHistory);
    renderHistory();
  };

  const calculate = () => {
    const rate = parseFloat(document.getElementById('calc-rate')?.value);
    const hours = parseFloat(document.getElementById('calc-hours')?.value);
    if (!rate || !hours || rate <= 0 || hours <= 0) {
      Toast.show('Wprowadź stawkę i liczbę godzin');
      return;
    }
    const daily = rate * hours;
    const weekly = daily * 5;
    const monthly = daily * 22;

    lastCalc = { rate, hours, daily, weekly, monthly };
    const settings = Storage.getSettings();

    document.getElementById('calc-daily').textContent = formatCurrency(daily, settings.currency);
    document.getElementById('calc-weekly').textContent = formatCurrency(weekly, settings.currency);
    document.getElementById('calc-monthly').textContent = formatCurrency(monthly, settings.currency);

    const results = document.getElementById('calc-results');
    if (results) {
      results.style.display = 'flex';
      results.style.animation = 'fadeSlideIn 0.3s ease';
    }
  };

  const saveDay = () => {
    if (!lastCalc) return;
    const history = Storage.getWorkHistory();
    history.unshift({
      id: `wh_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      rate: lastCalc.rate,
      hours: lastCalc.hours,
      earned: lastCalc.daily
    });
    Storage.setWorkHistory(history.slice(0, 50)); // keep last 50
    renderHistory();
    Toast.show('Dzień pracy zapisany');
  };

  const clearHistory = () => {
    if (confirm('Wyczyścić historię pracy?')) {
      Storage.setWorkHistory([]);
      renderHistory();
      Toast.show('Historia wyczyszczona');
    }
  };

  const renderHistory = () => {
    const container = document.getElementById('work-history-list');
    if (!container) return;
    const history = Storage.getWorkHistory();
    const settings = Storage.getSettings();

    if (!history.length) {
      container.innerHTML = `<div class="empty-state small"><p>Brak historii</p></div>`;
      return;
    }
    container.innerHTML = history.map(item => `
      <div class="work-history-item">
        <span class="work-history-date">${formatDate(item.date, settings.dateFormat)}</span>
        <span class="work-history-detail">${item.hours}h × ${item.rate} zł/h</span>
        <span class="work-history-earn">${formatCurrency(item.earned, settings.currency)}</span>
      </div>
    `).join('');
  };

  return { init };
})();
