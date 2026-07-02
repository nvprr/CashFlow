/* === TRANSACTIONS MODULE === */
const Transactions = (() => {
  const getAll = () => Storage.getTransactions();

  const add = (tx) => {
    const all = getAll();
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type: tx.type,
      amount: parseFloat(tx.amount),
      categoryId: tx.categoryId,
      desc: tx.desc || '',
      date: tx.date,
      method: tx.method || 'card',
      createdAt: new Date().toISOString()
    };
    all.unshift(newTx);
    Storage.setTransactions(all);
    return newTx;
  };

  const remove = (id) => {
    const all = getAll().filter(t => t.id !== id);
    Storage.setTransactions(all);
  };

  const getThisMonth = () => {
    const now = new Date();
    return getAll().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  };

  const getByPeriod = (months = 1) => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    return getAll().filter(t => new Date(t.date) >= cutoff);
  };

  const calcSummary = (list) => {
    const income = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const renderList = (containerId, list, limit = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const settings = Storage.getSettings();

    const displayList = limit ? list.slice(0, limit) : list;
    if (!displayList.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Brak transakcji</p><span>Dodaj pierwszą operację</span></div>`;
      return;
    }

    // Group by date
    const groups = {};
    displayList.forEach(tx => {
      const label = formatDateLabel(tx.date, settings.dateFormat);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });

    let html = '';
    Object.entries(groups).forEach(([date, txs]) => {
      html += `<div class="tx-date-group">${date}</div>`;
      txs.forEach(tx => {
        const cat = tx.type === 'income'
          ? Categories.INCOME_CATEGORIES.find(c => c.id === tx.categoryId) || { emoji: '💰', name: 'Przychód' }
          : Categories.getById(tx.categoryId, 'expense');
        const sign = tx.type === 'income' ? '+' : '-';
        const amt = formatCurrency(tx.amount, settings.currency);
        html += `
          <div class="tx-item" data-id="${tx.id}">
            <div class="tx-icon ${tx.type}">${cat.emoji}</div>
            <div class="tx-info">
              <div class="tx-desc">${tx.desc || cat.name}</div>
              <div class="tx-meta">${cat.name} · ${methodLabel(tx.method)}</div>
            </div>
            <div class="tx-amount ${tx.type}">${sign}${amt}</div>
          </div>
        `;
      });
    });
    container.innerHTML = html;

    container.querySelectorAll('.tx-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (confirm('Usuń tę transakcję?')) {
          remove(id);
          App.refresh();
          Toast.show('Transakcja usunięta');
        }
      });
    });
  };

  const formatDateLabel = (dateStr, fmt) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const txDay = new Date(d); txDay.setHours(0,0,0,0);
    if (txDay.getTime() === today.getTime()) return 'Dzisiaj';
    if (txDay.getTime() === yesterday.getTime()) return 'Wczoraj';
    return formatDate(dateStr, fmt);
  };

  return { getAll, add, remove, getThisMonth, getByPeriod, calcSummary, renderList };
})();

function formatDate(dateStr, fmt = 'DD.MM.YYYY') {
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return fmt.replace('DD',dd).replace('MM',mm).replace('YYYY',yyyy);
}

function formatCurrency(amount, currency = 'PLN') {
  const symbols = { PLN: 'zł', EUR: '€', USD: '$', GBP: '£', CZK: 'Kč' };
  const sym = symbols[currency] || currency;
  const formatted = amount.toFixed(2).replace('.', ',');
  if (['EUR','USD','GBP'].includes(currency)) return `${sym}${formatted}`;
  return `${formatted} ${sym}`;
}

function methodLabel(method) {
  const labels = { card: '💳 Karta', cash: '💵 Gotówka', transfer: '🏦 Przelew' };
  return labels[method] || method;
}
