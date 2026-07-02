/* === FINANCE MODULE v0.2.0 — burn rate, metrics, analysis === */
const Finance = (() => {

  // Average daily expense over the last 30 days
  const avgDailyExpense = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = Transactions.getAll().filter(t =>
      t.type === 'expense' && new Date(t.date) >= cutoff
    );
    if (!recent.length) return 0;
    const total = recent.reduce((s, t) => s + t.amount, 0);
    const days  = new Set(recent.map(t => t.date)).size || 1;
    return total / days;
  };

  // Total balance (all time: income - expenses)
  const totalBalance = () => {
    const all = Transactions.getAll();
    return all.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  };

  // Burn rate: how many days the current balance can cover at current avg spend
  const calcBurnRate = () => {
    const balance = totalBalance();
    const daily   = avgDailyExpense();
    if (balance <= 0) return 0;
    if (daily === 0)  return Infinity;
    return balance / daily;
  };

  // Monthly breakdown for last N months
  const monthlyBreakdown = (n = 6) => {
    const now = new Date();
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const txs = Transactions.getAll().filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      });
      const s = Transactions.calcSummary(txs);
      result.push({
        label: m.toLocaleString('pl-PL', { month: 'short' }),
        year:  m.getFullYear(),
        month: m.getMonth(),
        ...s,
        count: txs.length,
      });
    }
    return result;
  };

  // Top category for a list of expense transactions
  const topCategory = (expenses) => {
    if (!expenses.length) return null;
    const byCat = {};
    expenses.forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; });
    const [topId, topAmt] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    return { id: topId, amount: topAmt, cat: Categories.getById(topId, 'expense') };
  };

  return { avgDailyExpense, totalBalance, calcBurnRate, monthlyBreakdown, topCategory };
})();
