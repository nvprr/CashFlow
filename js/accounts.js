/* === ACCOUNTS MODULE v0.3.0 === */
const Accounts = (() => {
  const DEFAULTS = [
    { id: 'acc_cash',    name: 'Gotówka',              emoji: '💵', color: '#00d4aa', balance: 0, type: 'asset',     order: 0 },
    { id: 'acc_main',    name: 'Konto osobiste',        emoji: '🏦', color: '#6c63ff', balance: 0, type: 'asset',     order: 1 },
    { id: 'acc_savings', name: 'Konto oszczędnościowe', emoji: '💰', color: '#ffd166', balance: 0, type: 'asset',     order: 2 },
    { id: 'acc_invest',  name: 'Inwestycje',            emoji: '📈', color: '#06d6a0', balance: 0, type: 'asset',     order: 3 },
    { id: 'acc_credit',  name: 'Kredyty / pożyczki',   emoji: '💳', color: '#ff6584', balance: 0, type: 'liability', order: 4 },
  ];

  const getAll = () => {
    const stored = Storage.getAccounts();
    return stored && stored.length ? stored : JSON.parse(JSON.stringify(DEFAULTS));
  };

  const setAll = (list) => Storage.setAccounts(list);

  const getById = (id) => getAll().find(a => a.id === id) || null;

  const add = (data) => {
    const all = getAll();
    const acc = {
      id:      `acc_${Date.now()}`,
      name:    data.name    || 'Konto',
      emoji:   data.emoji   || '🏦',
      color:   data.color   || '#6c63ff',
      balance: parseFloat(data.balance) || 0,
      type:    data.type    || 'asset',
      order:   all.length,
    };
    all.push(acc);
    setAll(all);
    return acc;
  };

  const update = (id, patch) => {
    const all = getAll().map(a => a.id === id ? { ...a, ...patch } : a);
    setAll(all);
  };

  const remove = (id) => setAll(getAll().filter(a => a.id !== id));

  // Apply a transaction delta to account balance
  const applyTx = (accountId, type, amount) => {
    if (!accountId) return;
    const acc = getById(accountId);
    if (!acc) return;
    const delta = type === 'income' ? amount : -amount;
    update(accountId, { balance: parseFloat((acc.balance + delta).toFixed(2)) });
  };

  // Revert a transaction delta (for delete)
  const revertTx = (accountId, type, amount) => {
    if (!accountId) return;
    const acc = getById(accountId);
    if (!acc) return;
    const delta = type === 'income' ? -amount : amount;
    update(accountId, { balance: parseFloat((acc.balance + delta).toFixed(2)) });
  };

  // Transfer between accounts
  const transfer = (fromId, toId, amount, desc, date) => {
    const all = getAll();
    const amt = parseFloat(amount);
    const from = all.find(a => a.id === fromId);
    const to   = all.find(a => a.id === toId);
    if (!from || !to || amt <= 0) return null;

    from.balance = parseFloat((from.balance - amt).toFixed(2));
    to.balance   = parseFloat((to.balance   + amt).toFixed(2));
    setAll(all);

    // Record as special transfer transaction pair
    const txBase = {
      amount: amt,
      categoryId: 'transfer',
      desc: desc || `${from.name} → ${to.name}`,
      date: date || new Date().toISOString().split('T')[0],
      method: 'transfer',
      createdAt: new Date().toISOString(),
    };
    const txs = Storage.getTransactions();
    const id = `tx_${Date.now()}`;
    txs.unshift({ ...txBase, id: id + '_out', type: 'transfer_out', accountId: fromId, linkedId: id + '_in' });
    txs.unshift({ ...txBase, id: id + '_in',  type: 'transfer_in',  accountId: toId,   linkedId: id + '_out' });
    Storage.setTransactions(txs);
    return true;
  };

  // Summary stats
  const getSummary = () => {
    const all = getAll();
    const assets      = all.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
    const liabilities = all.filter(a => a.type === 'liability').reduce((s, a) => s + Math.abs(a.balance), 0);
    return { assets, liabilities, netWorth: assets - liabilities, total: assets };
  };

  // Render account list (for accounts tab)
  const renderList = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all  = getAll();
    const s    = Storage.getSettings();
    const sum  = getSummary();

    if (!all.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏦</div><p>Brak kont</p></div>`;
      return;
    }

    el.innerHTML = all.map(acc => `
      <div class="account-card" data-id="${acc.id}" draggable="true">
        <div class="account-left">
          <div class="account-icon" style="background:${acc.color}22;border-color:${acc.color}44">
            <span>${acc.emoji}</span>
          </div>
          <div class="account-info">
            <div class="account-name">${acc.name}</div>
            <div class="account-type">${acc.type === 'liability' ? 'Zobowiązanie' : 'Aktywo'}</div>
          </div>
        </div>
        <div class="account-right">
          <div class="account-balance ${acc.type === 'liability' ? 'expense' : ''}"
               style="color:${acc.color}">${formatCurrency(acc.balance, s.currency)}</div>
          <div class="account-actions">
            <button class="acc-edit-btn" data-id="${acc.id}" title="Edytuj">✏️</button>
            <button class="acc-del-btn"  data-id="${acc.id}" title="Usuń">✕</button>
          </div>
        </div>
      </div>`).join('');

    // Net worth footer
    el.insertAdjacentHTML('beforeend', `
      <div class="accounts-net-worth">
        <div class="nw-row"><span>Aktywa</span><span class="income">${formatCurrency(sum.assets, s.currency)}</span></div>
        <div class="nw-row"><span>Zobowiązania</span><span class="expense">${formatCurrency(sum.liabilities, s.currency)}</span></div>
        <div class="nw-row nw-total"><span>Majątek netto</span><span>${formatCurrency(sum.netWorth, s.currency)}</span></div>
      </div>`);

    // Events
    el.querySelectorAll('.acc-edit-btn').forEach(btn =>
      btn.addEventListener('click', () => _openEditModal(btn.dataset.id))
    );
    el.querySelectorAll('.acc-del-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        if (confirm('Usunąć to konto?')) { remove(btn.dataset.id); renderList(containerId); Toast.show('Konto usunięte'); }
      })
    );

    // Drag reorder
    _initDragSort(el, containerId);
  };

  const _openEditModal = (id) => {
    const acc = getById(id);
    if (!acc) return;
    document.getElementById('acc-edit-id').value     = id;
    document.getElementById('acc-edit-name').value   = acc.name;
    document.getElementById('acc-edit-emoji').value  = acc.emoji;
    document.getElementById('acc-edit-balance').value= acc.balance;
    document.getElementById('acc-edit-color').value  = acc.color;
    document.getElementById('acc-edit-type').value   = acc.type;
    Modal.open('modal-edit-account');
  };

  const _initDragSort = (container, containerId) => {
    let dragged = null;
    container.querySelectorAll('.account-card').forEach(card => {
      card.addEventListener('dragstart', () => { dragged = card; card.style.opacity = '0.5'; });
      card.addEventListener('dragend',   () => { dragged = null; card.style.opacity = ''; });
      card.addEventListener('dragover',  e => { e.preventDefault(); });
      card.addEventListener('drop', e => {
        e.preventDefault();
        if (dragged && dragged !== card) {
          const all = getAll();
          const fromId = dragged.dataset.id;
          const toId   = card.dataset.id;
          const fromIdx = all.findIndex(a => a.id === fromId);
          const toIdx   = all.findIndex(a => a.id === toId);
          const [moved] = all.splice(fromIdx, 1);
          all.splice(toIdx, 0, moved);
          all.forEach((a, i) => a.order = i);
          setAll(all);
          renderList(containerId);
        }
      });
    });
  };

  // Compact widget view
  const renderWidget = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const all = getAll();
    const s   = Storage.getSettings();
    const sum = getSummary();
    el.innerHTML = `
      <div class="widget-accounts-list">
        ${all.map(a => `
          <div class="widget-account-row">
            <span class="wa-icon">${a.emoji}</span>
            <span class="wa-name">${a.name}</span>
            <span class="wa-bal" style="color:${a.color}">${formatCurrency(a.balance, s.currency)}</span>
          </div>`).join('')}
      </div>
      <div class="widget-net-worth">
        <span>Netto</span>
        <strong>${formatCurrency(sum.netWorth, s.currency)}</strong>
      </div>`;
  };

  return { getAll, getById, add, update, remove, applyTx, revertTx, transfer, getSummary, renderList, renderWidget };
})();
