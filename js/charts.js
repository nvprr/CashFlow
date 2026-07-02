/* === CHARTS MODULE (Canvas-based, no dependencies) === */
const Charts = (() => {
  const COLORS = ['#6c63ff','#00d4aa','#ff6584','#ffd166','#06d6a0','#ef476f','#118ab2','#073b4c','#f77f00'];

  // Get canvas context safely
  const ctx = (id) => {
    const el = document.getElementById(id);
    return el ? el.getContext('2d') : null;
  };

  const clear = (c, w, h) => { c.clearRect(0, 0, w, h); };

  const getThemeColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

  /* DONUT CHART */
  const drawDonut = (data) => {
    const c = ctx('chart-donut');
    if (!c) return;
    const W = 220, H = 220, cx = W/2, cy = H/2, r = 80, inner = 52;
    c.canvas.width = W; c.canvas.height = H;
    clear(c, W, H);

    if (!data.length) {
      c.fillStyle = getThemeColor('--text-muted');
      c.font = '14px sans-serif';
      c.textAlign = 'center';
      c.fillText('Brak danych', cx, cy);
      document.getElementById('donut-legend').innerHTML = '';
      return;
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = (d.value / total) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r, startAngle, startAngle + slice);
      c.closePath();
      c.fillStyle = COLORS[i % COLORS.length];
      c.fill();
      startAngle += slice;
    });

    // Inner hole
    c.beginPath();
    c.arc(cx, cy, inner, 0, Math.PI * 2);
    c.fillStyle = getThemeColor('--bg-card');
    c.fill();

    // Center text
    c.fillStyle = getThemeColor('--text-primary');
    c.font = 'bold 14px sans-serif';
    c.textAlign = 'center';
    c.fillText(`${data.length} kat.`, cx, cy + 5);

    // Legend
    const legend = document.getElementById('donut-legend');
    if (legend) {
      legend.innerHTML = data.map((d, i) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></div>
          <span>${d.emoji} ${d.label}</span>
          <span class="legend-value">${((d.value/total)*100).toFixed(0)}%</span>
        </div>
      `).join('');
    }
  };

  /* BAR CHART */
  const drawBar = (incomeData, expenseData, labels) => {
    const c = ctx('chart-bar');
    if (!c) return;
    const W = c.canvas.parentElement?.offsetWidth || 340;
    const H = 200;
    c.canvas.width = W; c.canvas.height = H;
    clear(c, W, H);

    if (!labels.length) { return; }

    const maxVal = Math.max(...incomeData, ...expenseData, 1);
    const barW = Math.floor((W - 40) / labels.length / 2) - 4;
    const chartH = H - 40;

    labels.forEach((label, i) => {
      const x = 40 + i * ((W - 40) / labels.length);
      const iH = (incomeData[i] / maxVal) * chartH;
      const eH = (expenseData[i] / maxVal) * chartH;

      // Income bar
      c.fillStyle = '#00d4aa44';
      c.fillRect(x, H - 30 - iH, barW, iH);
      c.fillStyle = '#00d4aa';
      c.fillRect(x, H - 30 - iH, barW, 3);

      // Expense bar
      c.fillStyle = '#ff658444';
      c.fillRect(x + barW + 4, H - 30 - eH, barW, eH);
      c.fillStyle = '#ff6584';
      c.fillRect(x + barW + 4, H - 30 - eH, barW, 3);

      // Label
      c.fillStyle = getThemeColor('--text-muted');
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText(label, x + barW, H - 12);
    });
  };

  /* LINE CHART */
  const drawLine = (data, labels) => {
    const c = ctx('chart-line');
    if (!c) return;
    const W = c.canvas.parentElement?.offsetWidth || 340;
    const H = 180;
    c.canvas.width = W; c.canvas.height = H;
    clear(c, W, H);

    if (data.length < 2) return;

    const minV = Math.min(...data);
    const maxV = Math.max(...data, 1);
    const range = maxV - minV || 1;
    const pad = 30;
    const chartW = W - pad*2;
    const chartH = H - pad*2;

    const pts = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * chartW,
      y: pad + (1 - (v - minV) / range) * chartH
    }));

    // Gradient fill
    const grad = c.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(108,99,255,0.3)');
    grad.addColorStop(1, 'rgba(108,99,255,0)');
    c.beginPath();
    c.moveTo(pts[0].x, H - pad);
    pts.forEach(p => c.lineTo(p.x, p.y));
    c.lineTo(pts[pts.length-1].x, H - pad);
    c.closePath();
    c.fillStyle = grad;
    c.fill();

    // Line
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => c.lineTo(p.x, p.y));
    c.strokeStyle = '#6c63ff';
    c.lineWidth = 2.5;
    c.lineJoin = 'round';
    c.stroke();

    // Dots
    pts.forEach(p => {
      c.beginPath();
      c.arc(p.x, p.y, 4, 0, Math.PI*2);
      c.fillStyle = '#6c63ff';
      c.fill();
      c.fillStyle = getThemeColor('--bg-card');
      c.beginPath();
      c.arc(p.x, p.y, 2, 0, Math.PI*2);
      c.fill();
    });

    // Labels
    c.fillStyle = getThemeColor('--text-muted');
    c.font = '10px sans-serif';
    c.textAlign = 'center';
    labels.forEach((l, i) => {
      c.fillText(l, pts[i].x, H - 8);
    });
  };

  const renderAll = (period = 'month') => {
    const months = period === 'year' ? 12 : period === '3months' ? 3 : 1;
    const all = Transactions.getByPeriod(months);
    const settings = Storage.getSettings();

    // Donut: expenses by category
    const expenses = all.filter(t => t.type === 'expense');
    const byCat = {};
    expenses.forEach(t => {
      if (!byCat[t.categoryId]) byCat[t.categoryId] = 0;
      byCat[t.categoryId] += t.amount;
    });
    const donutData = Object.entries(byCat).map(([id, value]) => {
      const cat = Categories.getById(id, 'expense');
      return { label: cat.name, emoji: cat.emoji, value };
    }).sort((a,b) => b.value - a.value).slice(0, 7);
    drawDonut(donutData);

    // Bar: monthly income vs expense
    const now = new Date();
    const barLabels = [], barIncome = [], barExpense = [];
    for (let i = Math.min(months, 6) - 1; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = m.toLocaleString('pl-PL', { month: 'short' });
      barLabels.push(label);
      const monthTxs = all.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      });
      const s = Transactions.calcSummary(monthTxs);
      barIncome.push(s.income);
      barExpense.push(s.expense);
    }
    drawBar(barIncome, barExpense, barLabels);

    // Line: cumulative balance
    const sorted = [...all].sort((a,b) => new Date(a.date) - new Date(b.date));
    let bal = 0;
    const lineData = [];
    const lineLabels = [];
    sorted.forEach(t => {
      bal += t.type === 'income' ? t.amount : -t.amount;
      lineData.push(bal);
      lineLabels.push(formatDate(t.date, settings.dateFormat).slice(0,5));
    });
    if (lineData.length >= 2) drawLine(lineData, lineLabels);

    // Monthly summary
    renderMonthlySummary(all, settings);
  };

  const renderMonthlySummary = (all, settings) => {
    const container = document.getElementById('monthly-summary-content');
    if (!container) return;

    const s = Transactions.calcSummary(all);
    const expenses = all.filter(t => t.type === 'expense');

    // Biggest category
    const byCat = {};
    expenses.forEach(t => {
      if (!byCat[t.categoryId]) byCat[t.categoryId] = 0;
      byCat[t.categoryId] += t.amount;
    });
    const topCatId = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
    const topCat = topCatId ? Categories.getById(topCatId[0], 'expense') : null;

    const biggest = expenses.reduce((max, t) => t.amount > (max?.amount||0) ? t : max, null);
    const avgDaily = expenses.length ? s.expense / 30 : 0;

    container.innerHTML = `
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
          <div class="summary-item-label">Saldo</div>
          <div class="summary-item-value ${s.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(s.balance, settings.currency)}</div>
        </div>
      </div>
    `;
  };

  return { renderAll };
})();
