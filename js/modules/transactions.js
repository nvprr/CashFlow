/* ============================================
   CashFlow v0.1.0 — Transactions Module
   ============================================ */

const Transactions = (() => {
  let _filter = 'all';
  let _viewMonth = DateUtil.currentMonthKey();

  /* ---- DATA ---- */
  const getAll = () => Storage.get('transactions', []);

  const getByMonth = (monthKey) => {
    return getAll().filter(tx => DateUtil.getMonthKey(tx.date) === monthKey);
  };

  const getFiltered = (monthKey, filter = 'all') => {
    const monthly = getByMonth(monthKey);
    if (filter === 'all') return monthly;
    return monthly.filter(tx => tx.type === filter);
  };

  const add = (tx) => {
    const all = getAll();
    tx.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    tx.createdAt = new Date().toISOString();
    all.unshift(tx);
    Storage.set('transactions', all);
    return tx;
  };

  const remove = (id) => {
    const filtered = getAll().filter(tx => tx.id !== id);
    Storage.set('transactions', filtered);
  };

  const getMonthStats = (monthKey) => {
    const txs = getByMonth(monthKey);
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, savings: income - expense, count: txs.length };
  };

  const getTotalBalance = () => {
    return getAll().reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);
  };

  /* ---- RENDER ---- */
  const renderItem = (tx, container) => {
    const cat = Categories.getById(tx.category);
    const cur = Settings.get('currency');
    const fmt = Settings.get('dateFormat');
    const isIncome = tx.type === 'income';
    const paymentMap = { cash: '💵', card: '💳', transfer: '🏦' };

    const el = document.createElement('div');
    el.className = 'tx-item';
    el.dataset.id = tx.id;
    el.innerHTML = `
      <div class="tx-icon ${isIncome ? 'income-icon' : 'expense-icon'}">${cat.emoji}</div>
      <div class="tx-body">
        <div class="tx-title">${tx.desc || cat.name}</div>
        <div class="tx-meta">${DateUtil.formatShort(tx.date)} · ${cat.name} · ${paymentMap[tx.payment] || ''}</div>
      </div>
      <div class="tx-amount ${isIncome ? 'income' : 'expense'}">
        ${isIncome ? '+' : '-'}${Format.number(tx.amount)} ${cur}
      </div>
      <div class="tx-actions">
        <button class="tx-delete-btn" title="Usuń">✕</button>
      </div>
    `;
    el.querySelector('.tx-delete-btn').addEventListener('click', () => {
      if (confirm('Usunąć tę transakcję?')) {
        remove(tx.id);
        Toast.show('🗑️ Transakcja usunięta', 'success');
        renderAll();
        if (typeof Dashboard !== 'undefined') Dashboard.render();
        if (typeof Charts !== 'undefined') Charts.render();
      }
    });
    container.appendChild(el);
  };

  const renderRecent = () => {
    const container = document.getElementById('recent-list');
    if (!container) return;
    const recent = getAll().slice(0, 5);
    container.innerHTML = '';
    if (!recent.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-text">Brak transakcji</div><div class="empty-sub">Dodaj pierwszą operację</div></div>`;
      return;
    }
    recent.forEach(tx => renderItem(tx, container));
  };

  const renderAll = () => {
    const container = document.getElementById('all-transactions-list');
    if (!container) return;
    const txs = getFiltered(_viewMonth, _filter);
    container.innerHTML = '';
    if (!txs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Brak transakcji</div><div class="empty-sub">Użyj przycisku + aby dodać</div></div>`;
      return;
    }
    txs.forEach(tx => renderItem(tx, container));
  };

  /* ---- EVENTS ---- */
  const bindEvents = () => {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _filter = btn.dataset.filter;
        renderAll();
      });
    });

    // Month nav
    document.getElementById('btn-prev-month')?.addEventListener('click', () => {
      _viewMonth = DateUtil.prevMonthKey(_viewMonth);
      updateMonthLabel();
      renderAll();
    });
    document.getElementById('btn-next-month')?.addEventListener('click', () => {
      _viewMonth = DateUtil.nextMonthKey(_viewMonth);
      updateMonthLabel();
      renderAll();
    });

    // See all (dashboard)
    document.getElementById('btn-see-all')?.addEventListener('click', () => {
      if (typeof App !== 'undefined') App.navigate('transactions');
    });
  };

  const updateMonthLabel = () => {
    const el = document.getElementById('current-month-label');
    if (el) el.textContent = DateUtil.monthKeyToLabel(_viewMonth);
  };

  const renderAll_ = () => { renderAll(); updateMonthLabel(); };

  return {
    getAll, getByMonth, getFiltered, add, remove,
    getMonthStats, getTotalBalance,
    renderRecent, renderAll: renderAll_,
    bindEvents
  };
})();
