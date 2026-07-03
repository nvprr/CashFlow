/* === APP v0.3.0 === */
const App = (() => {
  let currentTab    = 'dashboard';
  let currentFilter = 'all';
  let currentPeriod = 'month';
  let txType        = 'expense';
  let _inited       = false;

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
    _initAccounts();
    _initBudgets();
    _initScheduled();
    _initTransfer();
    _initWidgetSettings();

    document.getElementById('see-all-btn')?.addEventListener('click', () => switchTab('transactions'));

    refresh();
  };

  const switchTab = (name) => {
    currentTab = name;
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${name}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${name}"]`)?.classList.add('active');

    if (name === 'charts')      Charts.renderAll(currentPeriod);
    if (name === 'goals')       Goals.render();
    if (name === 'calculator')  Calculator.init();
    if (name === 'accounts')    { Accounts.renderList('accounts-list'); _populateAccountSelects(); }
    if (name === 'budgets')     Budgets.render('budgets-list');
    if (name === 'scheduled')   Scheduled.render('scheduled-list');
    if (name === 'settings') {
      Categories.renderManager();
      Widgets.renderPicker();
      SettingsManager.syncSelects();
    }
    if (name === 'transactions') _renderFiltered();
  };

  const _initNav = () => {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn =>
      btn.addEventListener('click', () => switchTab(btn.dataset.tab))
    );
    document.querySelectorAll('[data-goto]').forEach(btn =>
      btn.addEventListener('click', () => switchTab(btn.dataset.goto))
    );
    // More tab tiles
    document.querySelectorAll('.more-tile[data-tab]').forEach(btn =>
      btn.addEventListener('click', () => switchTab(btn.dataset.tab))
    );
  };

  const _initFAB = () => document.getElementById('fab-btn')?.addEventListener('click', _openAddModal);

  const _openAddModal = () => {
    txType = 'expense';
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value   = '';
    document.getElementById('tx-date').value   = new Date().toISOString().split('T')[0];
    document.getElementById('tx-method').value = 'card';
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="expense"]')?.classList.add('active');
    Categories.renderGrid('modal-category-grid', 'expense');
    _populateAccountSelects();
    Modal.open('modal-add-transaction');
    setTimeout(() => document.getElementById('tx-amount')?.focus(), 340);
  };

  const _initTxModal = () => {
    document.querySelectorAll('.type-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        txType = btn.dataset.type;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Categories.renderGrid('modal-category-grid', txType);
      })
    );
    document.getElementById('save-transaction-btn')?.addEventListener('click', _saveTx);
  };

  const _saveTx = () => {
    const amount    = parseFloat(document.getElementById('tx-amount')?.value);
    const desc      = document.getElementById('tx-desc')?.value.trim();
    const date      = document.getElementById('tx-date')?.value;
    const method    = document.getElementById('tx-method')?.value;
    const catId     = document.getElementById('modal-category-grid')?.dataset.selected;
    const accountId = document.getElementById('tx-account-select')?.value || null;

    if (!amount || amount <= 0) { Toast.show('Wprowadź kwotę'); return; }
    if (!date)                   { Toast.show('Wybierz datę'); return; }
    if (!catId)                  { Toast.show('Wybierz kategorię'); return; }

    Transactions.add({ type: txType, amount, categoryId: catId, desc, date, method, accountId });
    Modal.close('modal-add-transaction');
    refresh();
    Toast.show(txType === 'income' ? '✅ Przychód dodany' : '✅ Wydatek dodany');
  };

  const _initGoals = () => {
    document.getElementById('add-goal-btn')?.addEventListener('click', () => {
      ['goal-name','goal-target','goal-saved','goal-emoji'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
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

  const _initFilters = () => {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip =>
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        _renderFiltered();
      })
    );
  };

  const _initChartPeriod = () => {
    document.querySelectorAll('[data-period]').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        Charts.renderAll(currentPeriod);
      })
    );
  };

  const _initSearch = () => {
    document.getElementById('search-input')?.addEventListener('input', e =>
      _renderFiltered(e.target.value.toLowerCase().trim())
    );
  };

  const _renderFiltered = (query = '') => {
    let list = Transactions.getAll();
    if (currentFilter !== 'all') list = list.filter(t => t.type === currentFilter);
    if (query) list = list.filter(t => {
      const cat = t.type === 'income'
        ? (Categories.INCOME_CATEGORIES.find(c => c.id === t.categoryId) || {})
        : Categories.getById(t.categoryId, 'expense');
      return (t.desc||'').toLowerCase().includes(query) || (cat.name||'').toLowerCase().includes(query);
    });
    list.sort((a,b) => new Date(b.date)-new Date(a.date));
    Transactions.renderList('all-transactions', list);
  };

  // ── Accounts ──────────────────────────────────────────────────────────────
  const _initAccounts = () => {
    document.getElementById('add-account-btn')?.addEventListener('click', () => {
      ['acc-new-name','acc-new-emoji','acc-new-balance'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = el.id === 'acc-new-emoji' ? '🏦' : '';
      });
      Modal.open('modal-add-account');
    });
    document.getElementById('save-account-btn')?.addEventListener('click', () => {
      const name    = document.getElementById('acc-new-name')?.value.trim();
      const emoji   = document.getElementById('acc-new-emoji')?.value.trim()  || '🏦';
      const balance = parseFloat(document.getElementById('acc-new-balance')?.value) || 0;
      const color   = document.getElementById('acc-new-color')?.value || '#6c63ff';
      const type    = document.getElementById('acc-new-type')?.value  || 'asset';
      if (!name) { Toast.show('Wprowadź nazwę konta'); return; }
      Accounts.add({ name, emoji, balance, color, type });
      Accounts.renderList('accounts-list');
      Modal.close('modal-add-account');
      Toast.show('✅ Konto dodane');
      refresh();
    });

    // Edit account modal save
    document.getElementById('save-edit-account-btn')?.addEventListener('click', () => {
      const id      = document.getElementById('acc-edit-id')?.value;
      const name    = document.getElementById('acc-edit-name')?.value.trim();
      const emoji   = document.getElementById('acc-edit-emoji')?.value.trim()   || '🏦';
      const balance = parseFloat(document.getElementById('acc-edit-balance')?.value) || 0;
      const color   = document.getElementById('acc-edit-color')?.value || '#6c63ff';
      const type    = document.getElementById('acc-edit-type')?.value  || 'asset';
      if (!name || !id) return;
      Accounts.update(id, { name, emoji, balance, color, type });
      Accounts.renderList('accounts-list');
      Modal.close('modal-edit-account');
      Toast.show('✅ Konto zaktualizowane');
      refresh();
    });
  };

  const _populateAccountSelects = () => {
    const accounts = Accounts.getAll();
    const opts = `<option value="">— Bez konta —</option>` +
      accounts.map(a => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join('');
    ['tx-account-select','transfer-from','transfer-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts;
    });
  };

  // ── Transfer ──────────────────────────────────────────────────────────────
  const _initTransfer = () => {
    document.getElementById('open-transfer-btn')?.addEventListener('click', () => {
      _populateAccountSelects();
      document.getElementById('transfer-amount').value = '';
      document.getElementById('transfer-desc').value   = '';
      document.getElementById('transfer-date').value   = new Date().toISOString().split('T')[0];
      Modal.open('modal-transfer');
    });
    document.getElementById('save-transfer-btn')?.addEventListener('click', () => {
      const fromId = document.getElementById('transfer-from')?.value;
      const toId   = document.getElementById('transfer-to')?.value;
      const amount = parseFloat(document.getElementById('transfer-amount')?.value);
      const desc   = document.getElementById('transfer-desc')?.value.trim();
      const date   = document.getElementById('transfer-date')?.value;
      if (!fromId || !toId)       { Toast.show('Wybierz oba konta'); return; }
      if (fromId === toId)         { Toast.show('Wybierz różne konta'); return; }
      if (!amount || amount <= 0) { Toast.show('Wprowadź kwotę transferu'); return; }
      Accounts.transfer(fromId, toId, amount, desc, date);
      Modal.close('modal-transfer');
      Accounts.renderList('accounts-list');
      refresh();
      Toast.show('🔄 Transfer wykonany');
    });
  };

  // ── Budgets ───────────────────────────────────────────────────────────────
  const _initBudgets = () => {
    document.getElementById('add-budget-btn')?.addEventListener('click', () => {
      ['bud-name','bud-limit'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      Modal.open('modal-add-budget');
    });
    document.getElementById('save-budget-btn')?.addEventListener('click', () => {
      const name   = document.getElementById('bud-name')?.value.trim();
      const limit  = parseFloat(document.getElementById('bud-limit')?.value);
      const period = document.getElementById('bud-period')?.value || 'month';
      const catId  = document.getElementById('bud-category')?.value || null;
      const color  = document.getElementById('bud-color')?.value || '#6c63ff';
      if (!name)             { Toast.show('Wprowadź nazwę'); return; }
      if (!limit || limit<=0){ Toast.show('Wprowadź limit'); return; }
      Budgets.add({ name, limit, period, categoryId: catId || null, color });
      Budgets.render('budgets-list');
      Modal.close('modal-add-budget');
      Toast.show('✅ Budżet dodany');
    });

    // Populate category select in budget modal
    const budCat = document.getElementById('bud-category');
    if (budCat) {
      budCat.innerHTML = `<option value="">Wszystkie kategorie</option>` +
        Categories.getAll().map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    }
  };

  // ── Scheduled ────────────────────────────────────────────────────────────
  const _initScheduled = () => {
    document.getElementById('add-scheduled-btn')?.addEventListener('click', () => {
      ['sch-new-name','sch-new-amount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('sch-new-date').value = new Date().toISOString().split('T')[0];
      Modal.open('modal-add-scheduled');
    });
    document.getElementById('save-scheduled-btn')?.addEventListener('click', () => {
      const name      = document.getElementById('sch-new-name')?.value.trim();
      const amount    = parseFloat(document.getElementById('sch-new-amount')?.value);
      const date      = document.getElementById('sch-new-date')?.value;
      const frequency = document.getElementById('sch-new-freq')?.value || 'monthly';
      const catId     = document.getElementById('sch-new-cat')?.value || 'other';
      if (!name)             { Toast.show('Wprowadź nazwę'); return; }
      if (!amount || amount<=0){ Toast.show('Wprowadź kwotę'); return; }
      if (!date)             { Toast.show('Wybierz datę'); return; }
      Scheduled.add({ name, amount, date, frequency, categoryId: catId });
      Scheduled.render('scheduled-list');
      Modal.close('modal-add-scheduled');
      Toast.show('✅ Płatność dodana');
    });

    // Populate category select
    const schCat = document.getElementById('sch-new-cat');
    if (schCat) {
      schCat.innerHTML = Categories.getAll().map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    }
  };

  // ── Widget settings ────────────────────────────────────────────────────────
  const _initWidgetSettings = () => {
    document.getElementById('reset-widgets-btn')?.addEventListener('click', () => {
      if (confirm('Przywrócić domyślny układ dashboardu?')) {
        Widgets.resetLayout();
        refresh();
        Widgets.renderPicker();
        Toast.show('Układ przywrócony');
      }
    });
  };

  // ── Global refresh ────────────────────────────────────────────────────────
  const refresh = () => {
    Dashboard.render();
    if (currentTab === 'transactions') _renderFiltered();
    if (currentTab === 'charts')       Charts.renderAll(currentPeriod);
    if (currentTab === 'goals')        Goals.render();
    if (currentTab === 'accounts')     Accounts.renderList('accounts-list');
    if (currentTab === 'budgets')      Budgets.render('budgets-list');
    if (currentTab === 'scheduled')    Scheduled.render('scheduled-list');
  };

  return { init, switchTab, refresh };
})();

document.addEventListener('DOMContentLoaded', () => App.init());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
