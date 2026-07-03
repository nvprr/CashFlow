/* === TRANSACTIONS MODULE v0.3.0 === */
const Transactions = (() => {
  const getAll = () => Storage.getTransactions();

  const add = (tx) => {
    const all = getAll();
    const newTx = {
      id:         `tx_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type:       tx.type,
      amount:     parseFloat(tx.amount),
      categoryId: tx.categoryId,
      desc:       tx.desc  || '',
      date:       tx.date,
      method:     tx.method || 'card',
      accountId:  tx.accountId || null,
      createdAt:  new Date().toISOString(),
    };
    all.unshift(newTx);
    Storage.setTransactions(all);
    // Update account balance
    if (newTx.accountId && (newTx.type === 'income' || newTx.type === 'expense')) {
      Accounts.applyTx(newTx.accountId, newTx.type, newTx.amount);
    }
    return newTx;
  };

  const remove = (id) => {
    const all = getAll();
    const tx  = all.find(t => t.id === id);
    if (tx && tx.accountId && (tx.type === 'income' || tx.type === 'expense')) {
      Accounts.revertTx(tx.accountId, tx.type, tx.amount);
    }
    Storage.setTransactions(all.filter(t => t.id !== id));
  };

  const getThisMonth = () => {
    const now = new Date();
    return getAll().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        && (t.type === 'income' || t.type === 'expense');
    });
  };

  const getByPeriod = (months = 1) => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months + 1);
    cutoff.setDate(1); cutoff.setHours(0,0,0,0);
    return getAll().filter(t => new Date(t.date) >= cutoff && (t.type === 'income' || t.type === 'expense'));
  };

  const calcSummary = (list) => {
    const src = list.filter(t => t.type === 'income' || t.type === 'expense');
    const income  = src.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expense = src.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const renderList = (containerId, list, limit = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const s = Storage.getSettings();
    const accounts = Accounts.getAll();
    const display  = limit ? list.slice(0, limit) : list;

    if (!display.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Brak transakcji</p><span>Dodaj pierwszą operację</span></div>`;
      return;
    }

    const groups = {};
    display.forEach(tx => {
      const label = _dateLabel(tx.date, s.dateFormat);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });

    let html = '';
    Object.entries(groups).forEach(([date, txs]) => {
      html += `<div class="tx-date-group">${date}</div>`;
      txs.forEach(tx => {
        let icon, catName, sign, amtClass;
        if (tx.type === 'transfer_out' || tx.type === 'transfer_in') {
          icon = '🔄'; catName = 'Transfer'; sign = tx.type === 'transfer_in' ? '+' : ''; amtClass = tx.type === 'transfer_in' ? 'income' : 'expense';
        } else {
          const cat = tx.type === 'income'
            ? (Categories.INCOME_CATEGORIES.find(c => c.id === tx.categoryId) || { emoji: '💰', name: 'Przychód' })
            : Categories.getById(tx.categoryId, 'expense');
          icon = cat.emoji; catName = cat.name;
          sign = tx.type === 'income' ? '+' : '-'; amtClass = tx.type;
        }
        const acc     = accounts.find(a => a.id === tx.accountId);
        const accBadge = acc ? `<span class="tx-acc-badge" style="color:${acc.color}">${acc.emoji} ${acc.name}</span>` : '';
        html += `
          <div class="tx-item" data-id="${tx.id}">
            <div class="tx-icon ${amtClass}">${icon}</div>
            <div class="tx-info">
              <div class="tx-desc">${tx.desc || catName}</div>
              <div class="tx-meta">${catName}${accBadge ? ' · ' + accBadge : ''}</div>
            </div>
            <div class="tx-amount ${amtClass}">${sign}${formatCurrency(tx.amount, s.currency)}</div>
          </div>`;
      });
    });
    container.innerHTML = html;

    container.querySelectorAll('.tx-item').forEach(item => {
      item.addEventListener('click', () => {
        const id  = item.dataset.id;
        const tx  = getAll().find(t => t.id === id);
        if (tx && (tx.type === 'transfer_in' || tx.type === 'transfer_out')) {
          Toast.show('Transfery można usunąć z zakładki Konta');
          return;
        }
        if (confirm('Usuń tę transakcję?')) {
          remove(id);
          App.refresh();
          Toast.show('Transakcja usunięta');
        }
      });
    });
  };

  const _dateLabel = (dateStr, fmt) => {
    const txDay   = new Date(dateStr + 'T00:00:00');
    const today   = new Date(); today.setHours(0,0,0,0);
    const yest    = new Date(today); yest.setDate(today.getDate()-1);
    if (txDay.getTime() === today.getTime()) return 'Dzisiaj';
    if (txDay.getTime() === yest.getTime())  return 'Wczoraj';
    return formatDate(dateStr, fmt);
  };

  return { getAll, add, remove, getThisMonth, getByPeriod, calcSummary, renderList };
})();

/* ── Global helpers (used across modules) ── */
function formatDate(dateStr, fmt = 'DD.MM.YYYY') {
  const d    = new Date(dateStr + 'T00:00:00');
  const dd   = String(d.getDate()).padStart(2,'0');
  const mm   = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return fmt.replace('DD',dd).replace('MM',mm).replace('YYYY',yyyy);
}

function formatCurrency(amount, currency = 'PLN') {
  const symbols = { PLN:'zł', EUR:'€', USD:'$', GBP:'£', CZK:'Kč' };
  const sym     = symbols[currency] || currency;
  const val     = isNaN(amount) ? 0 : amount;
  const str     = Math.abs(val).toFixed(2).replace('.',',');
  const neg     = val < 0 ? '-' : '';
  return ['EUR','USD','GBP'].includes(currency) ? `${neg}${sym}${str}` : `${neg}${str} ${sym}`;
}

function methodLabel(method) {
  return { card:'💳 Karta', cash:'💵 Gotówka', transfer:'🏦 Przelew' }[method] || method;
}
