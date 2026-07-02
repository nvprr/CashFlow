/* === DASHBOARD MODULE v0.2.0 — targeted DOM updates, burn rate === */
const Dashboard = (() => {

  // Cache element refs (set once)
  const els = {};
  const el = (id) => els[id] || (els[id] = document.getElementById(id));

  const render = () => {
    const settings = Storage.getSettings();
    const all      = Transactions.getAll();
    const month    = Transactions.getThisMonth();
    const summary  = Transactions.calcSummary(month);
    const allSum   = Transactions.calcSummary(all);

    // ── Hero balance ──────────────────────────────────────────────────────
    const balEl = el('hero-balance');
    if (balEl) balEl.textContent = formatCurrency(allSum.balance, settings.currency);

    const mnEl = el('hero-month');
    if (mnEl) {
      const now = new Date();
      mnEl.textContent = now.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    const set = (id, val) => { const e = el(id); if (e) e.textContent = formatCurrency(val, settings.currency); };
    set('stat-income',  summary.income);
    set('stat-expense', summary.expense);
    set('stat-savings', Math.max(summary.balance, 0));

    // ── Burn rate widget ──────────────────────────────────────────────────
    const burnEl = el('burn-rate-days');
    const burnLabelEl = el('burn-rate-label');
    const burnDays = Finance.calcBurnRate();
    const displayDays = isFinite(burnDays) ? Math.round(burnDays) : '∞';

    if (burnEl) burnEl.textContent = displayDays;
    if (burnLabelEl) {
      if (!isFinite(burnDays) || burnDays > 365) {
        burnLabelEl.textContent = 'Ponad rok runway';
        burnLabelEl.className = 'burn-label safe';
      } else if (burnDays < 14) {
        burnLabelEl.textContent = '⚠️ Niski zapas — uzupełnij budżet';
        burnLabelEl.className = 'burn-label danger';
      } else if (burnDays < 60) {
        burnLabelEl.textContent = '🟡 Umiarkowany zapas';
        burnLabelEl.className = 'burn-label warn';
      } else {
        burnLabelEl.textContent = '✅ Dobry zapas';
        burnLabelEl.className = 'burn-label safe';
      }
    }

    // ── Recent transactions ───────────────────────────────────────────────
    const sorted = [...all].sort((a, b) => new Date(b.date) - new Date(a.date));
    Transactions.renderList('recent-transactions', sorted, 8);

    // ── Insights ──────────────────────────────────────────────────────────
    Insights.render();
  };

  return { render };
})();
