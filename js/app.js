/* === MAIN APP === */
const App = (() => {
  let currentTab = 'dashboard';
  let currentFilter = 'all';
  let currentPeriod = 'month';
  let currentTransactionType = 'expense';
  let editingGoalId = null;

  const init = () => {
    Modal.init();
    SettingsManager.init();
    Calculator.init();

    initNav();
    initFAB();
    initTransactionModal();
    initGoals();
    initFilters();
    initChartPeriod();
    initSearch();

    // See all button
    document.getElementById('see-all-btn')?.addEventListener('click', () => {
      switchTab('transactions');
    });

    refresh();
  };

  const switchTab = (tabName) => {
    currentTab = tabName;
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');

    if (tabName === 'charts') Charts.renderAll(currentPeriod);
    if (tabName === 'goals') Goals.render();
    if (tabName === 'settings') {
      Categories.renderManager();
      Calculator.init(); // refresh history
    }
    if (tabName === 'transactions') renderFilteredTransactions();
  };

  const initNav = () => {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  };

  const initFAB = () => {
    document.getElementById('fab-btn')?.addEventListener('click', () => {
      openAddModal();
    });
  };

  const openAddModal = () => {
    currentTransactionType = 'expense';
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('tx-method').value = 'card';

    // Reset type toggle
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="expense"]').classList.add('active');

    Categories.renderGrid('modal-category-grid', 'expense');
    Modal.open('modal-add-transaction');
    setTimeout(() => document.getElementById('tx-amount')?.focus(), 350);
  };

  const initTransactionModal = () => {
    // Type toggle
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTransactionType = btn.dataset.type;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Categories.renderGrid('modal-category-grid', currentTransactionType);
      });
    });

    // Save transaction
    document.getElementById('save-transaction-btn')?.addEventListener('click', saveTransaction);
  };

  const saveTransaction = () => {
    const amount = parseFloat(document.getElementById('tx-amount')?.value);
    const desc = document.getElementById('tx-desc')?.value.trim();
    const date = document.getElementById('tx-date')?.value;
    const method = document.getElementById('tx-method')?.value;
    const grid = document.getElementById('modal-category-grid');
    const categoryId = grid?.dataset.selected;

    if (!amount || amount <= 0) { Toast.show('Wprowadź kwotę'); return; }
    if (!date) { Toast.show('Wybierz datę'); return; }
    if (!categoryId) { Toast.show('Wybierz kategorię'); return; }

    Transactions.add({ type: currentTransactionType, amount, categoryId, desc, date, method });
    Modal.close('modal-add-transaction');
    refresh();
    Toast.show(currentTransactionType === 'income' ? '✅ Przychód dodany' : '✅ Wydatek dodany');
  };

  const initGoals = () => {
    document.getElementById('add-goal-btn')?.addEventListener('click', () => {
      document.getElementById('goal-name').value = '';
      document.getElementById('goal-target').value = '';
      document.getElementById('goal-saved').value = '';
      document.getElementById('goal-emoji').value = '';
      Modal.open('modal-add-goal');
    });

    document.getElementById('save-goal-btn')?.addEventListener('click', () => {
      const name = document.getElementById('goal-name')?.value.trim();
      const target = parseFloat(document.getElementById('goal-target')?.value);
      const saved = parseFloat(document.getElementById('goal-saved')?.value) || 0;
      const emoji = document.getElementById('goal-emoji')?.value.trim() || '🎯';

      if (!name) { Toast.show('Wprowadź nazwę celu'); return; }
      if (!target || target <= 0) { Toast.show('Wprowadź kwotę docelową'); return; }

      Goals.add({ name, target, saved, emoji });
      Goals.render();
      Modal.close('modal-add-goal');
      Toast.show('🎯 Cel dodany');
    });
  };

  const initFilters = () => {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        renderFilteredTransactions();
      });
    });
  };

  const initChartPeriod = () => {
    document.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        Charts.renderAll(currentPeriod);
      });
    });
  };

  const initSearch = () => {
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      renderFilteredTransactions(e.target.value.toLowerCase());
    });
  };

  const renderFilteredTransactions = (query = '') => {
    let all = Transactions.getAll();
    if (currentFilter !== 'all') all = all.filter(t => t.type === currentFilter);
    if (query) all = all.filter(t => {
      const cat = t.type === 'income'
        ? Categories.INCOME_CATEGORIES.find(c => c.id === t.categoryId)
        : Categories.getById(t.categoryId, 'expense');
      return t.desc?.toLowerCase().includes(query) || cat?.name.toLowerCase().includes(query);
    });
    const sorted = [...all].sort((a,b) => new Date(b.date) - new Date(a.date));
    Transactions.renderList('all-transactions', sorted);
  };

  const refresh = () => {
    Dashboard.render();
    if (currentTab === 'transactions') renderFilteredTransactions();
    if (currentTab === 'charts') Charts.renderAll(currentPeriod);
    if (currentTab === 'goals') Goals.render();
  };

  return { init, switchTab, refresh };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
