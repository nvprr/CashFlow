/* ============================================
   CashFlow v0.1.0 — Charts Module (Canvas, no deps)
   ============================================ */

const Charts = (() => {
  let _activeChart = 'categories';
  let _canvas, _ctx;

  const COLORS = [
    '#00C896','#6C63FF','#FF6B6B','#FFB347','#00B4D8',
    '#A8EDEA','#FF9FF3','#54A0FF','#FF6348','#2ED573'
  ];

  const init = () => {
    _canvas = document.getElementById('main-chart');
    if (!_canvas) return;
    _ctx = _canvas.getContext('2d');
    // HiDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = _canvas.parentElement.getBoundingClientRect();
    _canvas.width  = (rect.width - 32) * dpr;
    _canvas.height = 220 * dpr;
    _canvas.style.width  = (rect.width - 32) + 'px';
    _canvas.style.height = '220px';
    _ctx.scale(dpr, dpr);
  };

  const getAccentColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00C896';
  };

  const getTextColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#8B8B9A';
  };

  const clear = () => {
    if (!_ctx || !_canvas) return;
    _ctx.clearRect(0, 0, _canvas.width / (window.devicePixelRatio || 1), _canvas.height / (window.devicePixelRatio || 1));
  };

  /* ---- DONUT CHART ---- */
  const drawDonut = (slices, labels) => {
    if (!_ctx) return;
    clear();
    const W = parseInt(_canvas.style.width);
    const H = parseInt(_canvas.style.height);
    const cx = W / 2, cy = H / 2;
    const r = Math.min(cx, cy) - 20;
    const inner = r * 0.58;

    if (!slices.length || slices.every(s => s === 0)) {
      _ctx.fillStyle = getTextColor();
      _ctx.font = '14px Inter';
      _ctx.textAlign = 'center';
      _ctx.fillText('Brak danych', cx, cy);
      return;
    }

    const total = slices.reduce((a, b) => a + b, 0);
    let angle = -Math.PI / 2;

    slices.forEach((val, i) => {
      const sweep = (val / total) * 2 * Math.PI;
      _ctx.beginPath();
      _ctx.moveTo(cx, cy);
      _ctx.arc(cx, cy, r, angle, angle + sweep);
      _ctx.closePath();
      _ctx.fillStyle = COLORS[i % COLORS.length];
      _ctx.fill();
      angle += sweep;
    });

    // Inner hole
    _ctx.beginPath();
    _ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    _ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#1A1A1F';
    _ctx.fill();

    // Center text
    _ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    _ctx.font = 'bold 18px JetBrains Mono, monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText(slices.length, cx, cy - 6);
    _ctx.font = '11px Inter';
    _ctx.fillStyle = getTextColor();
    _ctx.fillText('kategorii', cx, cy + 12);

    renderLegend(labels, slices, total);
  };

  /* ---- BAR CHART ---- */
  const drawBars = (labels, incomeData, expenseData) => {
    if (!_ctx) return;
    clear();
    const W = parseInt(_canvas.style.width);
    const H = parseInt(_canvas.style.height);
    const pad = { top: 20, bottom: 30, left: 10, right: 10 };
    const chartH = H - pad.top - pad.bottom;
    const allVals = [...incomeData, ...expenseData].filter(v => v > 0);
    const maxVal = allVals.length ? Math.max(...allVals) : 1;
    const n = labels.length;
    const groupW = (W - pad.left - pad.right) / n;
    const barW = Math.max(4, (groupW - 8) / 2);

    labels.forEach((lbl, i) => {
      const x = pad.left + i * groupW;

      // Income bar
      const ih = (incomeData[i] / maxVal) * chartH;
      _ctx.fillStyle = '#00C896';
      _ctx.beginPath();
      const ix = x + groupW / 2 - barW - 2;
      roundRect(_ctx, ix, pad.top + chartH - ih, barW, ih, 3);
      _ctx.fill();

      // Expense bar
      const eh = (expenseData[i] / maxVal) * chartH;
      _ctx.fillStyle = '#FF6B6B';
      _ctx.beginPath();
      const ex = x + groupW / 2 + 2;
      roundRect(_ctx, ex, pad.top + chartH - eh, barW, eh, 3);
      _ctx.fill();

      // Label
      _ctx.fillStyle = getTextColor();
      _ctx.font = '10px Inter';
      _ctx.textAlign = 'center';
      _ctx.fillText(lbl.slice(0, 3), x + groupW / 2, H - 8);
    });

    // Legend
    const legend = document.getElementById('chart-legend');
    if (legend) {
      legend.innerHTML = `
        <div class="legend-item"><div class="legend-dot" style="background:#00C896"></div>Przychody</div>
        <div class="legend-item"><div class="legend-dot" style="background:#FF6B6B"></div>Wydatki</div>
      `;
    }
  };

  /* ---- LINE CHART (balance) ---- */
  const drawLine = (labels, values) => {
    if (!_ctx) return;
    clear();
    const W = parseInt(_canvas.style.width);
    const H = parseInt(_canvas.style.height);
    const pad = { top: 24, bottom: 30, left: 8, right: 8 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const n = values.length;

    if (!n) {
      _ctx.fillStyle = getTextColor();
      _ctx.font = '14px Inter';
      _ctx.textAlign = 'center';
      _ctx.fillText('Brak danych', W / 2, H / 2);
      return;
    }

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const toX = (i) => pad.left + (i / (n - 1 || 1)) * chartW;
    const toY = (v) => pad.top + chartH - ((v - minV) / range) * chartH;

    const accent = getAccentColor();

    // Gradient fill
    const grad = _ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, accent + '55');
    grad.addColorStop(1, accent + '00');
    _ctx.beginPath();
    values.forEach((v, i) => {
      const x = toX(i), y = toY(v);
      i === 0 ? _ctx.moveTo(x, y) : _ctx.lineTo(x, y);
    });
    _ctx.lineTo(toX(n - 1), pad.top + chartH);
    _ctx.lineTo(pad.left, pad.top + chartH);
    _ctx.closePath();
    _ctx.fillStyle = grad;
    _ctx.fill();

    // Line
    _ctx.beginPath();
    values.forEach((v, i) => {
      const x = toX(i), y = toY(v);
      i === 0 ? _ctx.moveTo(x, y) : _ctx.lineTo(x, y);
    });
    _ctx.strokeStyle = accent;
    _ctx.lineWidth = 2.5;
    _ctx.lineJoin = 'round';
    _ctx.stroke();

    // Dots
    values.forEach((v, i) => {
      _ctx.beginPath();
      _ctx.arc(toX(i), toY(v), 4, 0, 2 * Math.PI);
      _ctx.fillStyle = accent;
      _ctx.fill();
    });

    // Labels
    _ctx.fillStyle = getTextColor();
    _ctx.font = '10px Inter';
    _ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      _ctx.fillText(l.slice(0, 3), toX(i), H - 8);
    });

    const legend = document.getElementById('chart-legend');
    if (legend) legend.innerHTML = `<div class="legend-item"><div class="legend-dot" style="background:${accent}"></div>Saldo miesięczne</div>`;
  };

  /* ---- HELPERS ---- */
  const roundRect = (ctx, x, y, w, h, r) => {
    if (h <= 0) return;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const renderLegend = (labels, values, total) => {
    const legend = document.getElementById('chart-legend');
    if (!legend) return;
    legend.innerHTML = labels.map((l, i) => {
      const pct = total ? Math.round((values[i] / total) * 100) : 0;
      return `<div class="legend-item"><div class="legend-dot" style="background:${COLORS[i % COLORS.length]}"></div>${l} (${pct}%)</div>`;
    }).join('');
  };

  /* ---- MAIN RENDER ---- */
  const render = () => {
    if (!_canvas) init();
    if (!_canvas) return;

    const cur = Settings.get('currency');
    const allTx = Transactions.getAll();

    if (_activeChart === 'categories') {
      // Expense by category
      const expense = allTx.filter(t => t.type === 'expense');
      const byCat = {};
      expense.forEach(t => {
        byCat[t.category] = (byCat[t.category] || 0) + t.amount;
      });
      const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const labels = sorted.map(([id]) => {
        const cat = Categories.getById(id);
        return `${cat.emoji} ${cat.name}`;
      });
      drawDonut(sorted.map(([, v]) => v), labels);
    }

    else if (_activeChart === 'monthly') {
      // Last 6 months income vs expense
      const months = [];
      let key = DateUtil.currentMonthKey();
      for (let i = 0; i < 6; i++) {
        months.unshift(key);
        key = DateUtil.prevMonthKey(key);
      }
      const incomes  = months.map(m => Transactions.getMonthStats(m).income);
      const expenses = months.map(m => Transactions.getMonthStats(m).expense);
      const labels   = months.map(m => DateUtil.monthKeyToLabel(m).slice(0, 3));
      drawBars(labels, incomes, expenses);
    }

    else if (_activeChart === 'balance') {
      const months = [];
      let key = DateUtil.currentMonthKey();
      for (let i = 0; i < 6; i++) {
        months.unshift(key);
        key = DateUtil.prevMonthKey(key);
      }
      const balances = months.map(m => Transactions.getMonthStats(m).savings);
      const labels   = months.map(m => DateUtil.monthKeyToLabel(m).slice(0, 3));
      drawLine(labels, balances);
    }

    Summary.render();
  };

  const bindEvents = () => {
    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _activeChart = tab.dataset.chart;
        render();
      });
    });

    // Re-render on resize
    window.addEventListener('resize', () => {
      _canvas = null;
      if (document.getElementById('view-charts')?.classList.contains('active')) {
        setTimeout(() => { init(); render(); }, 100);
      }
    });
  };

  return { init, render, bindEvents };
})();
