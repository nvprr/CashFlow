/* ============================================
   CashFlow v0.1.0 — Categories Module
   ============================================ */

const Categories = (() => {
  const DEFAULTS_EXPENSE = [
    { id: 'food',     emoji: '🍔', name: 'Jedzenie' },
    { id: 'transport',emoji: '🚗', name: 'Transport' },
    { id: 'home',     emoji: '🏠', name: 'Dom' },
    { id: 'gym',      emoji: '🏋️', name: 'Siłownia' },
    { id: 'entertain',emoji: '🎮', name: 'Rozrywka' },
    { id: 'health',   emoji: '🩺', name: 'Zdrowie' },
    { id: 'shopping', emoji: '🛒', name: 'Zakupy' },
    { id: 'subs',     emoji: '📱', name: 'Abonamenty' },
    { id: 'other',    emoji: '🎁', name: 'Inne' },
  ];

  const DEFAULTS_INCOME = [
    { id: 'salary',   emoji: '💼', name: 'Wypłata' },
    { id: 'bonus',    emoji: '🎉', name: 'Premia' },
    { id: 'freelance',emoji: '💻', name: 'Freelance' },
    { id: 'sale',     emoji: '📦', name: 'Sprzedaż' },
    { id: 'other_in', emoji: '💰', name: 'Inne wpływy' },
  ];

  const load = () => {
    const stored = Storage.get('categories', null);
    if (!stored) {
      Storage.set('categories', { expense: DEFAULTS_EXPENSE, income: DEFAULTS_INCOME });
    }
  };

  const getExpense = () => Storage.get('categories', {}).expense || DEFAULTS_EXPENSE;
  const getIncome  = () => Storage.get('categories', {}).income  || DEFAULTS_INCOME;
  const getAll     = () => [...getExpense(), ...getIncome()];

  const getById = (id) => getAll().find(c => c.id === id) || { emoji: '💸', name: id };

  const save = (expense, income) => {
    Storage.set('categories', { expense, income });
  };

  const populateSelect = (selectEl, type = 'expense') => {
    const cats = type === 'expense' ? getExpense() : getIncome();
    selectEl.innerHTML = cats.map(c =>
      `<option value="${c.id}">${c.emoji} ${c.name}</option>`
    ).join('');
  };

  const renderEditor = () => {
    const container = document.getElementById('categories-edit');
    if (!container) return;
    const expense = getExpense();
    container.innerHTML = expense.map((c, i) => `
      <div class="category-row" data-index="${i}">
        <input class="category-emoji-input" type="text" maxlength="2" value="${c.emoji}" data-field="emoji" />
        <input class="category-name-input" type="text" value="${c.name}" data-field="name" placeholder="Nazwa" />
        <button class="category-delete-btn" data-index="${i}">✕</button>
      </div>
    `).join('');

    // Bind changes
    container.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const row = inp.closest('.category-row');
        const idx = +row.dataset.index;
        const field = inp.dataset.field;
        const cats = getExpense();
        cats[idx][field] = inp.value;
        save(cats, getIncome());
      });
    });

    // Delete
    container.querySelectorAll('.category-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.index;
        const cats = getExpense();
        cats.splice(idx, 1);
        save(cats, getIncome());
        renderEditor();
      });
    });
  };

  const bindEvents = () => {
    document.getElementById('btn-add-category')?.addEventListener('click', () => {
      const cats = getExpense();
      cats.push({ id: 'cat_' + Date.now(), emoji: '⭐', name: 'Nowa kategoria' });
      save(cats, getIncome());
      renderEditor();
    });
  };

  return { load, getExpense, getIncome, getAll, getById, populateSelect, renderEditor, bindEvents };
})();
