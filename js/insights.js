/* === INSIGHTS MODULE v0.3.0 === */
const Insights = (() => {
  const _build = () => {
    const all      = Transactions.getAll();
    const month    = Transactions.getThisMonth();
    const settings = Storage.getSettings();
    const insights = [];

    if (all.length < 1) return [{ icon:'💡', text:'Dodaj pierwszą transakcję, aby zobaczyć analizy.' }];

    const expenses = month.filter(t => t.type === 'expense');
    const summary  = Transactions.calcSummary(month);

    const top = Finance.topCategory(expenses);
    if (top) insights.push({ icon: top.cat.emoji, text: `Najwięcej wydajesz na <strong>${top.cat.name}</strong> — ${formatCurrency(top.amount, settings.currency)} w tym miesiącu.` });

    if (expenses.length) {
      const days = new Set(expenses.map(t => t.date)).size || 1;
      const avg  = expenses.reduce((s,t) => s+t.amount, 0) / days;
      insights.push({ icon:'📊', text:`Średni dzienny wydatek wynosi <strong>${formatCurrency(avg, settings.currency)}</strong>.` });
    }

    const now = new Date();
    const lastM = Transactions.getAll().filter(t => {
      const d = new Date(t.date), lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
      return d.getFullYear()===lm.getFullYear() && d.getMonth()===lm.getMonth() && t.type==='expense';
    });
    if (lastM.length) {
      const lt = lastM.reduce((s,t) => s+t.amount, 0);
      if (summary.expense < lt && lt > 0) insights.push({ icon:'📉', text:`W tym miesiącu wydałeś o <strong>${formatCurrency(lt-summary.expense, settings.currency)} mniej</strong> niż poprzednio.` });
      else if (summary.expense > lt && lt > 0) insights.push({ icon:'📈', text:`Wydałeś o <strong>${formatCurrency(summary.expense-lt, settings.currency)} więcej</strong> niż w poprzednim miesiącu.` });
    }

    if (summary.income > 0) {
      const rate = Math.round(((summary.income-summary.expense)/summary.income)*100);
      if (rate > 0) insights.push({ icon:'💰', text:`Oszczędzasz <strong>${rate}%</strong> przychodów w tym miesiącu.` });
      else if (summary.expense > summary.income) insights.push({ icon:'⚠️', text:`Wydatki przekraczają przychody o <strong>${formatCurrency(summary.expense-summary.income, settings.currency)}</strong>.` });
    }

    const burn = Finance.calcBurnRate();
    if (isFinite(burn) && burn > 0) {
      const icon = burn < 14 ? '🔴' : burn < 60 ? '🟡' : '🟢';
      insights.push({ icon, text:`Saldo starczy na ok. <strong>${Math.round(burn)} dni</strong> przy obecnym tempie wydatków.` });
    }

    const budgets = Budgets.getAll();
    const overBudget = budgets.filter(b => Budgets.getStatus(Budgets.calcSpent(b), b.limit) === 'over');
    if (overBudget.length) insights.push({ icon:'🔴', text:`Przekroczono <strong>${overBudget.length} budżet${overBudget.length > 1 ? 'y' : ''}</strong>. Sprawdź zakładkę Budżety.` });

    return insights;
  };

  // Render into a specific container element
  const renderInto = (el) => {
    if (!el) return;
    const insights = _build();
    el.innerHTML = `<h3 class="widget-title">💡 Smart Insights</h3>` +
      insights.slice(0,5).map(i =>
        `<div class="insight-card"><span class="insight-icon">${i.icon}</span><span class="insight-text">${i.text}</span></div>`
      ).join('');
  };

  // Legacy: render into #insights-container (for non-widget path)
  const render = () => renderInto(document.getElementById('insights-container'));

  return { render, renderInto };
})();
