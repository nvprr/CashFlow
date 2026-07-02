/* === DASHBOARD MODULE === */
const Dashboard = (() => {
  const render = () => {
    const settings = Storage.getSettings();
    const thisMonth = Transactions.getThisMonth();
    const all = Transactions.getAll();
    const summary = Transactions.calcSummary(thisMonth);

    // Total balance (all time)
    const allSummary = Transactions.calcSummary(all);

    // Hero
    const balanceEl = document.getElementById('hero-balance');
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(allSummary.balance, settings.currency);
      balanceEl.style.color = '';
    }

    const now = new Date();
    const monthEl = document.getElementById('hero-month');
    if (monthEl) {
      monthEl.textContent = now.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
    }

    // Stats
    const incomeEl = document.getElementById('stat-income');
    const expenseEl = document.getElementById('stat-expense');
    const savingsEl = document.getElementById('stat-savings');
    if (incomeEl) incomeEl.textContent = formatCurrency(summary.income, settings.currency);
    if (expenseEl) expenseEl.textContent = formatCurrency(summary.expense, settings.currency);
    if (savingsEl) savingsEl.textContent = formatCurrency(Math.max(summary.balance, 0), settings.currency);

    // Recent transactions (last 10)
    const sorted = [...all].sort((a,b) => new Date(b.date) - new Date(a.date));
    Transactions.renderList('recent-transactions', sorted, 10);

    // Insights
    Insights.render();
  };

  return { render };
})();
