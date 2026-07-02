/* === SMART INSIGHTS MODULE v0.2.0 — pure math, no AI === */
const Insights = (() => {

  const render = () => {
    const el = document.getElementById('insights-container');
    if (!el) return;

    const all      = Transactions.getAll();
    const month    = Transactions.getThisMonth();
    const settings = Storage.getSettings();

    if (all.length < 1) {
      el.innerHTML = `<div class="insight-card"><span class="insight-icon">💡</span><span class="insight-text">Dodaj pierwszą transakcję, aby zobaczyć analizy.</span></div>`;
      return;
    }

    const expenses = month.filter(t => t.type === 'expense');
    const summary  = Transactions.calcSummary(month);
    const insights = [];

    // 1. Top category
    const top = Finance.topCategory(expenses);
    if (top) {
      insights.push({
        icon: top.cat.emoji,
        text: `Najwięcej wydajesz na <strong>${top.cat.name}</strong> — ${formatCurrency(top.amount, settings.currency)} w tym miesiącu.`
      });
    }

    // 2. Average daily spend
    if (expenses.length) {
      const days = new Set(expenses.map(t => t.date)).size || 1;
      const avg  = expenses.reduce((s, t) => s + t.amount, 0) / days;
      insights.push({
        icon: '📊',
        text: `Średni dzienny wydatek wynosi <strong>${formatCurrency(avg, settings.currency)}</strong>.`
      });
    }

    // 3. Compare to last month
    const now = new Date();
    const lastMonth = Transactions.getAll().filter(t => {
      const d  = new Date(t.date);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth() && t.type === 'expense';
    });
    if (lastMonth.length) {
      const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);
      if (summary.expense < lastTotal && lastTotal > 0) {
        const diff = lastTotal - summary.expense;
        insights.push({ icon: '📉', text: `W tym miesiącu wydałeś o <strong>${formatCurrency(diff, settings.currency)} mniej</strong> niż poprzednio. Dobra robota!` });
      } else if (summary.expense > lastTotal && lastTotal > 0) {
        const diff = summary.expense - lastTotal;
        insights.push({ icon: '📈', text: `Wydałeś o <strong>${formatCurrency(diff, settings.currency)} więcej</strong> niż w poprzednim miesiącu.` });
      }
    }

    // 4. Savings rate
    if (summary.income > 0) {
      const rate = Math.round(((summary.income - summary.expense) / summary.income) * 100);
      if (rate > 0) {
        insights.push({ icon: '💰', text: `Oszczędzasz <strong>${rate}%</strong> przychodów w tym miesiącu.` });
      } else if (summary.expense > summary.income) {
        insights.push({ icon: '⚠️', text: `Wydatki przekraczają przychody o <strong>${formatCurrency(summary.expense - summary.income, settings.currency)}</strong>.` });
      }
    }

    // 5. Weekend vs weekday
    const wknd = expenses.filter(t => { const d = new Date(t.date); return d.getDay() === 0 || d.getDay() === 6; });
    const wkdy = expenses.filter(t => { const d = new Date(t.date); return d.getDay() > 0 && d.getDay() < 6; });
    if (wknd.length && wkdy.length) {
      const wkndAvg = wknd.reduce((s, t) => s + t.amount, 0) / wknd.length;
      const wkdyAvg = wkdy.reduce((s, t) => s + t.amount, 0) / wkdy.length;
      if (wkndAvg > wkdyAvg * 1.4) {
        insights.push({ icon: '📅', text: `Wydajesz więcej <strong>w weekendy</strong> (śr. ${formatCurrency(wkndAvg, settings.currency)}) niż w tygodniu (${formatCurrency(wkdyAvg, settings.currency)}).` });
      }
    }

    // 6. Subscriptions
    const subs = expenses.filter(t => t.categoryId === 'subs');
    if (subs.length && summary.expense > 0) {
      const subTotal = subs.reduce((s, t) => s + t.amount, 0);
      const pct = Math.round((subTotal / summary.expense) * 100);
      if (pct > 15) {
        insights.push({ icon: '📱', text: `Abonamenty stanowią <strong>${pct}%</strong> Twoich wydatków (${formatCurrency(subTotal, settings.currency)}).` });
      }
    }

    // 7. Burn rate callout
    const burnDays = Finance.calcBurnRate();
    if (isFinite(burnDays) && burnDays > 0) {
      const icon = burnDays < 14 ? '🔴' : burnDays < 60 ? '🟡' : '🟢';
      insights.push({ icon, text: `Przy obecnych wydatkach saldo starczy na <strong>${Math.round(burnDays)} dni</strong>.` });
    }

    if (!insights.length) {
      insights.push({ icon: '✅', text: 'Finanse wyglądają stabilnie. Dodaj więcej transakcji, aby zobaczyć więcej analiz.' });
    }

    el.innerHTML = insights.slice(0, 5).map(i =>
      `<div class="insight-card"><span class="insight-icon">${i.icon}</span><span class="insight-text">${i.text}</span></div>`
    ).join('');
  };

  return { render };
})();
