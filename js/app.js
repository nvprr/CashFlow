/* === APP v0.2.0 — router, tab manager, modal wiring === */
const App = (() => {
  let currentTab    = 'dashboard';
  let currentFilter = 'all';
  let currentPeriod = 'month';
  let txType        = 'expense';    // for add modal
  let _inited       = false;

  /* ── Init ─────────────────────────────────────────────────────────────── */
  const init = () => {
    if (_inited) return;
    _inited = true;

    Modal.init();
    SettingsManager.init();
    Calculator.init();

    _initNav();
    _initFAB();
    _initTxModal();
    _initGoals();
    _initFilters();
    _initChartPeriod();
    _initSearch();

    document.getElementById('see-all-btn')?.addEventListener('click', () => switchTab('transactions'));

    refresh();
  };

  /* ── Tab switching ────────────────────────────────────────────────────── */
  const switchTab = (name) => {
    currentTab = name;
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${name}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${name}"]`)?.classList.add('active');

    // Lazy render per tab
    if (name === 'charts')      Charts.renderAll(currentPeriod);
    if (name === 'goals')       Goals.render();
    if (name === 'calculator')  Calculator.init();
    if (name === 'settings') {
      Categories.renderManager();
      SettingsManager.syncSelects();
    }
    if (name === 'transactions') _renderFiltered();
  };

  /* ── Nav ──────────────────────────────────────────────────────────────── */
  const _initNav = () => {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  };

  /* ── FAB ──────────────────────────────────────────────────────────────── */
  const _initFAB = () => {
    document.getElementById('fab-btn')?.addEventListener('click', _openAddModal);
  };

  const _openAddModal = () => {
    txType = 'expense';
    const amtEl  = document.getElementById('tx-amount');
    const descEl = document.getElementById('tx-desc');
    const dateEl = document.getElementById('tx-date');
    const mthEl  = document.getElementById('tx-method');

    if (amtEl)  amtEl.value  = '';
    if (descEl) descEl.value = '';
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    if (mthEl)  mthEl.value  = 'card';

    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="expense"]')?.classList.add('active');
    Categories.renderGrid('modal-category-grid', 'expense');
    Modal.open('modal-add-transaction');
    setTimeout(() => amtEl?.focus(), 340);
  };

  /* ── Transaction modal ────────────────────────────────────────────────── */
  const _initTxModal = () => {
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        txType = btn.dataset.type;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Categories.renderGrid('modal-category-grid', txType);
      });
    });
    document.getElementById('save-transaction-btn')?.addEventListener('click', _saveTx);
  };

  const _saveTx = () => {
    const amount = parseFloat(document.getElementById('tx-amount')?.value);
    const desc   = document.getElementById('tx-desc')?.value.trim();
    const date   = document.getElementById('tx-date')?.value;
    const method = document.getElementById('tx-method')?.value;
    const grid   = document.getElementById('modal-category-grid');
    const catId  = grid?.dataset.selected;

    if (!amount || amount <= 0) { Toast.show('Wprowadź kwotę'); return; }
    if (!date)                   { Toast.show('Wybierz datę'); return; }
    if (!catId)                  { Toast.show('Wybierz kategorię'); return; }

    Transactions.add({ type: txType, amount, categoryId: catId, desc, date, method });
    Modal.close('modal-add-transaction');
    refresh();
    Toast.show(txType === 'income' ? '✅ Przychód dodany' : '✅ Wydatek dodany');
  };

  /* ── Goals ────────────────────────────────────────────────────────────── */
  const _initGoals = () => {
    document.getElementById('add-goal-btn')?.addEventListener('click', () => {
      ['goal-name','goal-target','goal-saved','goal-emoji'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      Modal.open('modal-add-goal');
    });

    document.getElementById('save-goal-btn')?.addEventListener('click', () => {
      const name   = document.getElementById('goal-name')?.value.trim();
      const target = parseFloat(document.getElementById('goal-target')?.value);
      const saved  = parseFloat(document.getElementById('goal-saved')?.value) || 0;
      const emoji  = document.getElementById('goal-emoji')?.value.trim() || '🎯';

      if (!name)              { Toast.show('Wprowadź nazwę celu'); return; }
      if (!target || target <= 0) { Toast.show('Wprowadź kwotę docelową'); return; }

      Goals.add({ name, target, saved, emoji });
      Goals.render();
      Modal.close('modal-add-goal');
      Toast.show('🎯 Cel zapisany');
    });
  };

  /* ── Filters (transactions tab) ────────────────────────────────────────── */
  const _initFilters = () => {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        _renderFiltered();
      });
    });
  };

  /* ── Chart period ─────────────────────────────────────────────────────── */
  const _initChartPeriod = () => {
    document.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        Charts.renderAll(currentPeriod);
      });
    });
  };

  /* ── Search ───────────────────────────────────────────────────────────── */
  const _initSearch = () => {
    document.getElementById('search-input')?.addEventListener('input', e => {
      _renderFiltered(e.target.value.toLowerCase().trim());
    });
  };

  const _renderFiltered = (query = '') => {
    let list = Transactions.getAll();
    if (currentFilter !== 'all') list = list.filter(t => t.type === currentFilter);
    if (query) {
      list = list.filter(t => {
        const cat = t.type === 'income'
          ? (Categories.INCOME_CATEGORIES.find(c => c.id === t.categoryId) || {})
          : Categories.getById(t.categoryId, 'expense');
        return (
          (t.desc || '').toLowerCase().includes(query) ||
          (cat.name || '').toLowerCase().includes(query)
        );
      });
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    Transactions.renderList('all-transactions', list);
  };

  /* ── Global refresh (only active components) ─────────────────────────── */
  const refresh = () => {
    Dashboard.render();
    if (currentTab === 'transactions') _renderFiltered();
    if (currentTab === 'charts')       Charts.renderAll(currentPeriod);
    if (currentTab === 'goals')        Goals.render();
  };

  return { init, switchTab, refresh };
})();

/* ── Boot ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());

/* ── PWA ─────────────────────────────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  );
}
