/* === WIDGETS MODULE v0.3.0 — drag & drop dashboard personalization === */
const Widgets = (() => {

  const ALL_WIDGETS = [
    { id: 'w_balance',    title: 'Saldo',              icon: '💰', defaultOn: true  },
    { id: 'w_cashflow',   title: 'Przepływy',          icon: '↕️',  defaultOn: true  },
    { id: 'w_burnrate',   title: 'Burn Rate',          icon: '🔥', defaultOn: true  },
    { id: 'w_insights',   title: 'Smart Insights',     icon: '💡', defaultOn: true  },
    { id: 'w_accounts',   title: 'Portfel',            icon: '🏦', defaultOn: true  },
    { id: 'w_recent',     title: 'Ostatnie operacje',  icon: '📋', defaultOn: true  },
    { id: 'w_top_exp',    title: 'Najwyższe wydatki',  icon: '📊', defaultOn: true  },
    { id: 'w_budgets',    title: 'Budżety',            icon: '🎯', defaultOn: false },
    { id: 'w_scheduled',  title: 'Zaplanowane',        icon: '📅', defaultOn: false },
    { id: 'w_trend',      title: 'Trend salda',        icon: '📈', defaultOn: false },
  ];

  const getLayout = () => {
    const stored = Storage.getWidgetLayout();
    if (stored && stored.length) return stored;
    // Default: all defaultOn in default order
    return ALL_WIDGETS.filter(w => w.defaultOn).map((w, i) => ({
      id: w.id, visible: true, order: i
    }));
  };

  const setLayout = (layout) => Storage.setWidgetLayout(layout);

  const getVisible = () =>
    getLayout()
      .filter(l => l.visible)
      .sort((a, b) => a.order - b.order)
      .map(l => ALL_WIDGETS.find(w => w.id === l.id))
      .filter(Boolean);

  const toggleWidget = (id) => {
    const layout = getLayout();
    const entry  = layout.find(l => l.id === id);
    if (entry) {
      entry.visible = !entry.visible;
    } else {
      layout.push({ id, visible: true, order: layout.length });
    }
    setLayout(layout);
  };

  const resetLayout = () => {
    setLayout(ALL_WIDGETS.filter(w => w.defaultOn).map((w, i) => ({ id: w.id, visible: true, order: i })));
  };

  // Render widget picker in settings
  const renderPicker = () => {
    const el = document.getElementById('widget-picker');
    if (!el) return;
    const layout = getLayout();
    el.innerHTML = ALL_WIDGETS.map(w => {
      const entry   = layout.find(l => l.id === w.id);
      const visible = entry ? entry.visible : w.defaultOn;
      return `
        <div class="widget-picker-row">
          <span class="wp-icon">${w.icon}</span>
          <span class="wp-title">${w.title}</span>
          <button class="wp-toggle ${visible ? 'active' : ''}" data-wid="${w.id}">
            ${visible ? 'Widoczny' : 'Ukryty'}
          </button>
        </div>`;
    }).join('');

    el.querySelectorAll('.wp-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleWidget(btn.dataset.wid);
        renderPicker();
        Dashboard.render();
      });
    });
  };

  // Build the dashboard HTML from visible widgets
  const buildDashboard = () => {
    const el = document.getElementById('dashboard-widgets');
    if (!el) return;
    const visible = getVisible();

    el.innerHTML = visible.map(w => `
      <div class="widget-card" data-widget="${w.id}" draggable="true">
        <div class="widget-drag-handle" title="Przeciągnij aby zmienić kolejność">⠿</div>
        <div class="widget-content" id="${w.id}-content"></div>
      </div>`).join('');

    _initDragSort(el);
    _renderWidgetContents(visible);
  };

  const _renderWidgetContents = (visible) => {
    const s = Storage.getSettings();
    visible.forEach(w => {
      const el = document.getElementById(`${w.id}-content`);
      if (!el) return;
      switch (w.id) {
        case 'w_balance':   _renderBalance(el, s); break;
        case 'w_cashflow':  _renderCashflow(el, s); break;
        case 'w_burnrate':  _renderBurnRate(el, s); break;
        case 'w_insights':  el.innerHTML = ''; Insights.renderInto(el); break;
        case 'w_accounts':  Accounts.renderWidget(`${w.id}-content`); break;
        case 'w_recent':    _renderRecent(el, s); break;
        case 'w_top_exp':   _renderTopExp(el, s); break;
        case 'w_budgets':   _renderBudgetWidget(el, s); break;
        case 'w_scheduled': Scheduled.renderWidget(`${w.id}-content`); break;
        case 'w_trend':     _renderTrendWidget(el, s); break;
      }
    });
  };

  // Individual widget renderers
  const _renderBalance = (el, s) => {
    const allSum  = Transactions.calcSummary(Transactions.getAll());
    const accSum  = Accounts.getSummary();
    const month   = Transactions.getThisMonth();
    const mSum    = Transactions.calcSummary(month);
    const now     = new Date();
    el.innerHTML = `
      <div class="wbal-header">
        <h3 class="widget-title">💰 Saldo</h3>
        <span class="wbal-month">${now.toLocaleString('pl-PL',{month:'long',year:'numeric'})}</span>
      </div>
      <div class="wbal-main">${formatCurrency(accSum.netWorth || allSum.balance, s.currency)}</div>
      <div class="wbal-stats">
        <div class="wbal-stat"><span class="income">↑ ${formatCurrency(mSum.income,s.currency)}</span><small>Przychody</small></div>
        <div class="wbal-stat"><span class="expense">↓ ${formatCurrency(mSum.expense,s.currency)}</span><small>Wydatki</small></div>
        <div class="wbal-stat"><span>${formatCurrency(Math.max(mSum.balance,0),s.currency)}</span><small>Oszczędności</small></div>
      </div>`;
  };

  const _renderCashflow = (el, s) => {
    const m   = Transactions.calcSummary(Transactions.getThisMonth());
    el.innerHTML = `
      <h3 class="widget-title">↕️ Przepływy pieniężne</h3>
      <div class="cashflow-diagram">
        <div class="cf-box income">
          <div class="cf-label">Przychody</div>
          <div class="cf-val">${formatCurrency(m.income, s.currency)}</div>
        </div>
        <div class="cf-arrow">↓</div>
        <div class="cf-box balance">
          <div class="cf-label">Saldo</div>
          <div class="cf-val ${m.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(m.balance, s.currency)}</div>
        </div>
        <div class="cf-arrow">↓</div>
        <div class="cf-box expense">
          <div class="cf-label">Wydatki</div>
          <div class="cf-val">${formatCurrency(m.expense, s.currency)}</div>
        </div>
      </div>`;
  };

  const _renderBurnRate = (el, s) => {
    const days = Finance.calcBurnRate();
    const disp = isFinite(days) ? Math.round(days) : '∞';
    const cls  = !isFinite(days) || days > 60 ? 'safe' : days > 14 ? 'warn' : 'danger';
    const icon = cls === 'safe' ? '✅' : cls === 'warn' ? '🟡' : '⚠️';
    el.innerHTML = `
      <h3 class="widget-title">🔥 Burn Rate</h3>
      <div class="burn-big">
        <span class="burn-num ${cls}">${disp}</span>
        <span class="burn-unit">dni runway</span>
      </div>
      <p class="burn-sub">${icon} Średnie dzienne wydatki: ${formatCurrency(Finance.avgDailyExpense(), s.currency)}</p>`;
  };

  const _renderRecent = (el, s) => {
    el.innerHTML = '<h3 class="widget-title">📋 Ostatnie operacje</h3><div id="w_recent-list"></div>';
    const all    = Transactions.getAll().sort((a,b) => new Date(b.date)-new Date(a.date));
    Transactions.renderList('w_recent-list', all, 5);
  };

  const _renderTopExp = (el, s) => {
    const month = Transactions.getThisMonth().filter(t => t.type === 'expense');
    const top   = [...month].sort((a,b) => b.amount - a.amount).slice(0, 5);
    el.innerHTML = `
      <h3 class="widget-title">📊 Najwyższe wydatki</h3>
      ${top.length ? top.map((t,i) => {
        const cat = Categories.getById(t.categoryId, 'expense');
        return `<div class="top-exp-row">
          <span class="te-rank">${i+1}</span>
          <span class="te-icon">${cat.emoji}</span>
          <span class="te-desc">${t.desc || cat.name}</span>
          <span class="te-amt expense">${formatCurrency(t.amount, s.currency)}</span>
        </div>`;
      }).join('') : '<div class="empty-state small"><p>Brak wydatków</p></div>'}`;
  };

  const _renderBudgetWidget = (el, s) => {
    const all = Budgets.getAll();
    el.innerHTML = `
      <h3 class="widget-title">🎯 Budżety</h3>
      ${all.slice(0,4).map(b => {
        const spent  = Budgets.calcSpent(b);
        const pct    = b.limit > 0 ? Math.min(Math.round((spent/b.limit)*100),100) : 0;
        const status = Budgets.getStatus(spent, b.limit);
        return `<div class="mini-budget">
          <div class="mb-top"><span>${b.name}</span><span>${pct}%</span></div>
          <div class="budget-track"><div class="budget-fill status-${status}" style="width:${pct}%"></div></div>
        </div>`;
      }).join('') || '<div class="empty-state small"><p>Brak budżetów</p></div>'}`;
  };

  const _renderTrendWidget = (el, s) => {
    el.innerHTML = `<h3 class="widget-title">📈 Trend salda</h3><canvas id="w_trend-canvas" width="100%" height="120" data-h="120"></canvas>`;
    // Small inline dot chart
    const all = Transactions.getAll().sort((a,b) => new Date(a.date)-new Date(b.date));
    if (all.length < 2) { el.querySelector('canvas').insertAdjacentHTML('afterend','<p class="empty-state small" style="padding:8px">Za mało danych</p>'); return; }

    setTimeout(() => {
      const canvas = document.getElementById('w_trend-canvas');
      if (!canvas) return;
      const parent = canvas.parentElement;
      const W = parent ? parent.clientWidth || 300 : 300;
      const H = 120;
      canvas.width = W; canvas.height = H;
      const c = canvas.getContext('2d');

      let bal = 0;
      const pts = all.map(t => {
        bal += t.type === 'income' ? t.amount : (t.type === 'expense' ? -t.amount : 0);
        return bal;
      });
      const minV = Math.min(...pts), maxV = Math.max(...pts, 1);
      const range = maxV - minV || 1;
      const PAD = 12;

      const mapped = pts.map((v, i) => ({
        x: PAD + (i / (pts.length - 1)) * (W - PAD * 2),
        y: PAD + (1 - (v - minV) / range) * (H - PAD * 2),
      }));

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const grad = c.createLinearGradient(0,0,0,H);
      grad.addColorStop(0, accent + '40');
      grad.addColorStop(1, accent + '00');

      c.beginPath();
      c.moveTo(mapped[0].x, H);
      mapped.forEach(p => c.lineTo(p.x, p.y));
      c.lineTo(mapped[mapped.length-1].x, H);
      c.closePath();
      c.fillStyle = grad;
      c.fill();

      c.beginPath();
      mapped.forEach((p,i) => i === 0 ? c.moveTo(p.x,p.y) : c.lineTo(p.x,p.y));
      c.strokeStyle = accent;
      c.lineWidth = 2;
      c.lineJoin = 'round';
      c.stroke();
    }, 50);
  };

  // Drag & drop reordering within dashboard
  const _initDragSort = (container) => {
    let dragged = null;
    container.querySelectorAll('.widget-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        dragged = card;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dragged = null;
        _saveOrder(container);
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragged && dragged !== card) {
          const rect     = card.getBoundingClientRect();
          const midY     = rect.top + rect.height / 2;
          const afterEl  = e.clientY > midY ? card.nextSibling : card;
          container.insertBefore(dragged, afterEl);
        }
      });
    });
  };

  const _saveOrder = (container) => {
    const layout = getLayout();
    const cards  = container.querySelectorAll('.widget-card');
    cards.forEach((card, i) => {
      const wid   = card.dataset.widget;
      const entry = layout.find(l => l.id === wid);
      if (entry) entry.order = i;
      else layout.push({ id: wid, visible: true, order: i });
    });
    setLayout(layout);
  };

  return { buildDashboard, renderPicker, resetLayout, getVisible, ALL_WIDGETS };
})();
