/* === CHARTS MODULE v0.2.0 — dot-based, stable, tooltip-enabled === */
const Charts = (() => {
  const COLORS = [
    '#6c63ff','#00d4aa','#ff6584','#ffd166',
    '#06d6a0','#ef476f','#118ab2','#f77f00','#a8dadc'
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getTheme = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const getAccent = () => getTheme('--accent') || '#6c63ff';

  const setupCanvas = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const parent = el.parentElement;
    const W = parent ? Math.floor(parent.clientWidth) || 340 : 340;
    el.width  = W;
    el.height = parseInt(el.dataset.h || el.height) || 200;
    const c = el.getContext('2d');
    c.clearRect(0, 0, el.width, el.height);
    return { c, W: el.width, H: el.height, el };
  };

  // ── Tooltip state ─────────────────────────────────────────────────────────
  const _tooltips = {}; // canvasId -> [{ x, y, label }]

  const attachTooltip = (el, points, settings) => {
    const existing = el._cfTip;
    if (existing) {
      el.removeEventListener('mousemove', existing);
      el.removeEventListener('touchstart', existing, { passive:true });
    }

    const tip = document.getElementById('chart-tooltip');
    if (!tip) return;

    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const ex = e.touches ? e.touches[0].clientX : e.clientX;
      const ey = e.touches ? e.touches[0].clientY : e.clientY;
      const mx = ex - rect.left;
      const my = ey - rect.top;
      // scale for HiDPI
      const sx = mx * (el.width / rect.width);
      const sy = my * (el.height / rect.height);

      let nearest = null, minD = 30;
      points.forEach(p => {
        const d = Math.hypot(sx - p.x, sy - p.y);
        if (d < minD) { minD = d; nearest = p; }
      });

      if (nearest) {
        tip.innerHTML = nearest.label;
        tip.style.display = 'block';
        tip.style.left = (ex + 12) + 'px';
        tip.style.top  = (ey - 30) + 'px';
      } else {
        tip.style.display = 'none';
      }
    };

    el.addEventListener('mousemove', handler);
    el.addEventListener('touchstart', handler, { passive: true });
    el._cfTip = handler;

    el.addEventListener('mouseleave', () => {
      if (tip) tip.style.display = 'none';
    });
  };

  // ── DONUT CHART ──────────────────────────────────────────────────────────
  const drawDonut = (data) => {
    const cv = setupCanvas('chart-donut');
    if (!cv) return;
    const { c, W, H } = cv;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.36, inner = r * 0.6;

    if (!data.length) {
      c.fillStyle = getTheme('--text-muted');
      c.font = '13px sans-serif';
      c.textAlign = 'center';
      c.fillText('Brak danych', cx, cy + 5);
      const leg = document.getElementById('donut-legend');
      if (leg) leg.innerHTML = '';
      return;
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    let start = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = (d.value / total) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r, start, start + slice);
      c.closePath();
      c.fillStyle = COLORS[i % COLORS.length];
      c.fill();
      start += slice;
    });

    // Hole
    c.beginPath();
    c.arc(cx, cy, inner, 0, Math.PI * 2);
    c.fillStyle = getTheme('--bg-card');
    c.fill();

    // Centre label
    c.fillStyle = getTheme('--text-primary');
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'center';
    c.fillText(data.length + ' kat.', cx, cy + 5);

    // Legend
    const leg = document.getElementById('donut-legend');
    if (leg) {
      leg.innerHTML = data.map((d, i) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${COLORS[i % COLORS.length]}"></div>
          <span>${d.emoji} ${d.label}</span>
          <span class="legend-value">${((d.value / total) * 100).toFixed(0)}%</span>
        </div>`).join('');
    }
  };

  // ── BAR CHART (income vs expense per month) ───────────────────────────────
  const drawBar = (incomeData, expenseData, labels) => {
    const cv = setupCanvas('chart-bar');
    if (!cv) return;
    const { c, W, H } = cv;
    if (!labels.length) return;

    const pad = { t: 12, b: 28, l: 8, r: 8 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const n = labels.length;
    const groupW = chartW / n;
    const barW = Math.max(Math.floor(groupW * 0.28), 4);
    const gap = 3;
    const maxVal = Math.max(...incomeData, ...expenseData, 1);

    labels.forEach((label, i) => {
      const gx = pad.l + i * groupW + (groupW - barW * 2 - gap) / 2;
      const iH = (incomeData[i] / maxVal) * chartH;
      const eH = (expenseData[i] / maxVal) * chartH;
      const base = pad.t + chartH;

      // income
      c.fillStyle = 'rgba(0,212,170,0.22)';
      if (iH > 1) c.fillRect(gx, base - iH, barW, iH);
      c.fillStyle = '#00d4aa';
      c.fillRect(gx, base - iH, barW, Math.min(iH, 3));

      // expense
      c.fillStyle = 'rgba(255,101,132,0.22)';
      if (eH > 1) c.fillRect(gx + barW + gap, base - eH, barW, eH);
      c.fillStyle = '#ff6584';
      c.fillRect(gx + barW + gap, base - eH, barW, Math.min(eH, 3));

      // label
      c.fillStyle = getTheme('--text-muted');
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText(label, gx + barW, H - 8);
    });
  };

  // ── DOT / SCATTER CHART (timeline of transactions) ────────────────────────
  const drawDotTimeline = (transactions, canvasId, settings) => {
    const cv = setupCanvas(canvasId);
    if (!cv) return;
    const { c, W, H, el } = cv;

    if (!transactions.length) {
      c.fillStyle = getTheme('--text-muted');
      c.font = '13px sans-serif';
      c.textAlign = 'center';
      c.fillText('Brak transakcji', W / 2, H / 2);
      return;
    }

    const PAD = { t: 16, b: 28, l: 10, r: 10 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;

    // Date range
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates);
    const rangeD = maxD - minD || 1;

    // Amount range
    const amounts = transactions.map(t => t.amount);
    const maxA = Math.max(...amounts, 1);

    // Baseline
    const baseY = PAD.t + cH;
    c.strokeStyle = getTheme('--border');
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(PAD.l, baseY);
    c.lineTo(W - PAD.r, baseY);
    c.stroke();

    const tooltipPoints = [];

    transactions.forEach(tx => {
      const ts = new Date(tx.date).getTime();
      const x = PAD.l + ((ts - minD) / rangeD) * cW;
      const y = PAD.t + (1 - tx.amount / maxA) * cH;
      const isIncome = tx.type === 'income';
      const color = isIncome ? '#00d4aa' : '#ff6584';
      const R = Math.max(4, Math.min(10, (tx.amount / maxA) * 9 + 3));

      // Glow
      const grd = c.createRadialGradient(x, y, 0, x, y, R * 2.5);
      grd.addColorStop(0, color + '55');
      grd.addColorStop(1, color + '00');
      c.beginPath();
      c.arc(x, y, R * 2.5, 0, Math.PI * 2);
      c.fillStyle = grd;
      c.fill();

      // Dot
      c.beginPath();
      c.arc(x, y, R, 0, Math.PI * 2);
      c.fillStyle = color + 'cc';
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.stroke();

      const cat = tx.type === 'income'
        ? (Categories.INCOME_CATEGORIES.find(ct => ct.id === tx.categoryId) || { emoji: '💰' })
        : Categories.getById(tx.categoryId, 'expense');

      tooltipPoints.push({
        x, y,
        label: `${cat.emoji} ${formatCurrency(tx.amount, settings.currency)}<br><small>${formatDate(tx.date, settings.dateFormat)}</small>`
      });
    });

    // Date labels (first and last)
    c.fillStyle = getTheme('--text-muted');
    c.font = '10px sans-serif';
    c.textAlign = 'left';
    c.fillText(formatDate(new Date(minD).toISOString().split('T')[0], settings.dateFormat).slice(0, 5), PAD.l, H - 6);
    c.textAlign = 'right';
    c.fillText(formatDate(new Date(maxD).toISOString().split('T')[0], settings.dateFormat).slice(0, 5), W - PAD.r, H - 6);

    attachTooltip(el, tooltipPoints, settings);
  };

  // ── BURN RATE GAUGE ───────────────────────────────────────────────────────
  const drawBurnRate = (days) => {
    const cv = setupCanvas('chart-burnrate');
    if (!cv) return;
    const { c, W, H } = cv;

    const cx = W / 2, cy = H * 0.68;
    const r = Math.min(W * 0.38, cy * 0.9);
    const startA = Math.PI;
    const endA = 2 * Math.PI;

    // Background arc
    c.beginPath();
    c.arc(cx, cy, r, startA, endA);
    c.strokeStyle = getTheme('--bg-3');
    c.lineWidth = 14;
    c.lineCap = 'round';
    c.stroke();

    // Value arc
    const cap = 365;
    const clampedDays = Math.min(days, cap);
    const progress = clampedDays / cap;
    const endFill = startA + progress * Math.PI;

    const color = days < 14 ? '#ff6584' : days < 60 ? '#ffd166' : '#00d4aa';
    c.beginPath();
    c.arc(cx, cy, r, startA, endFill);
    c.strokeStyle = color;
    c.lineWidth = 14;
    c.lineCap = 'round';
    c.stroke();

    // Centre text
    c.textAlign = 'center';
    c.fillStyle = getTheme('--text-primary');
    c.font = `bold ${Math.floor(r * 0.45)}px sans-serif`;
    c.fillText(days > 9999 ? '∞' : Math.round(days).toString(), cx, cy - 4);

    c.fillStyle = getTheme('--text-muted');
    c.font = `${Math.floor(r * 0.18)}px sans-serif`;
    c.fillText('dni runway', cx, cy + r * 0.25);

    // Status label
    const statusText = days < 14 ? '⚠️ Niski zapas' : days < 60 ? '🟡 Umiarkowany' : '✅ Dobry zapas';
    c.fillStyle = color;
    c.font = `bold ${Math.floor(r * 0.19)}px sans-serif`;
    c.fillText(statusText, cx, cy + r * 0.52);
  };

  // ── Main render ───────────────────────────────────────────────────────────
  let _currentPeriod = 'month';

  const renderAll = (period = 'month') => {
    _currentPeriod = period;
    const months   = period === 'year' ? 12 : period === 'week' ? 0 : 1;
    const settings = Storage.getSettings();

    let all;
    if (period === 'week') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      all = Transactions.getAll().filter(t => new Date(t.date) >= cutoff);
    } else {
      all = Transactions.getByPeriod(Math.max(months, 1));
    }

    const expenses = all.filter(t => t.type === 'expense');

    // Donut
    const byCat = {};
    expenses.forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; });
    const donutData = Object.entries(byCat).map(([id, value]) => {
      const cat = Categories.getById(id, 'expense');
      return { label: cat.name, emoji: cat.emoji, value };
    }).sort((a, b) => b.value - a.value).slice(0, 7);
    drawDonut(donutData);

    // Bar: last N months
    const now = new Date();
    const barMonths = Math.min(months || 1, 6);
    const barLabels = [], barIncome = [], barExpense = [];
    for (let i = barMonths - 1; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      barLabels.push(m.toLocaleString('pl-PL', { month: 'short' }));
      const mtx = Transactions.getByPeriod(1).filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      });
      // Use all transactions for accurate monthly bar
      const allTx = Transactions.getAll().filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      });
      const s = Transactions.calcSummary(allTx);
      barIncome.push(s.income);
      barExpense.push(s.expense);
    }
    if (period !== 'week') drawBar(barIncome, barExpense, barLabels);

    // Dot timeline — expenses
    drawDotTimeline(expenses, 'chart-dots-expense', settings);

    // Dot timeline — all
    drawDotTimeline(all, 'chart-dots-all', settings);

    // Burn rate
    const burnDays = Finance.calcBurnRate();
    drawBurnRate(isFinite(burnDays) ? burnDays : 9999);

    // Monthly summary
    renderMonthlySummary(all, settings);
  };

  const renderMonthlySummary = (all, settings) => {
    const el = document.getElementById('monthly-summary-content');
    if (!el) return;
    const s = Transactions.calcSummary(all);
    const expenses = all.filter(t => t.type === 'expense');

    const byCat = {};
    expenses.forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; });
    const topEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const topCat   = topEntry ? Categories.getById(topEntry[0], 'expense') : null;
    const biggest  = expenses.reduce((m, t) => t.amount > (m?.amount || 0) ? t : m, null);

    const days     = new Set(expenses.map(t => t.date)).size || 1;
    const avgDaily = expenses.length ? s.expense / days : 0;

    el.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-item-label">Przychody</div>
          <div class="summary-item-value income">${formatCurrency(s.income, settings.currency)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Wydatki</div>
          <div class="summary-item-value expense">${formatCurrency(s.expense, settings.currency)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Oszczędności</div>
          <div class="summary-item-value">${formatCurrency(Math.max(s.balance, 0), settings.currency)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Transakcje</div>
          <div class="summary-item-value">${all.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Top kategoria</div>
          <div class="summary-item-value">${topCat ? topCat.emoji + ' ' + topCat.name : '—'}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Największy wydatek</div>
          <div class="summary-item-value expense">${biggest ? formatCurrency(biggest.amount, settings.currency) : '—'}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Śr. dzienny wydatek</div>
          <div class="summary-item-value">${formatCurrency(avgDaily, settings.currency)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Saldo okresu</div>
          <div class="summary-item-value ${s.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(s.balance, settings.currency)}</div>
        </div>
      </div>`;
  };

  return { renderAll };
})();
