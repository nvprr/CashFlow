/* === CATEGORIES MODULE === */
const Categories = (() => {
  const DEFAULT_CATEGORIES = [
    { id: 'food',     emoji: '🍔', name: 'Jedzenie' },
    { id: 'transport',emoji: '🚗', name: 'Transport' },
    { id: 'home',     emoji: '🏠', name: 'Dom' },
    { id: 'gym',      emoji: '🏋️', name: 'Siłownia' },
    { id: 'fun',      emoji: '🎮', name: 'Rozrywka' },
    { id: 'health',   emoji: '🩺', name: 'Zdrowie' },
    { id: 'shopping', emoji: '🛒', name: 'Zakupy' },
    { id: 'subs',     emoji: '📱', name: 'Abonamenty' },
    { id: 'other',    emoji: '🎁', name: 'Inne' },
  ];

  const INCOME_CATEGORIES = [
    { id: 'salary',  emoji: '💼', name: 'Wypłata' },
    { id: 'bonus',   emoji: '🏅', name: 'Premia' },
    { id: 'extra',   emoji: '💡', name: 'Dodatkowe' },
    { id: 'sale',    emoji: '💸', name: 'Sprzedaż' },
    { id: 'other_in',emoji: '➕', name: 'Inne' },
  ];

  const getAll = () => Storage.getCategories() || DEFAULT_CATEGORIES;
  const setAll = (cats) => Storage.setCategories(cats);

  const add = (emoji, name) => {
    const cats = getAll();
    cats.push({ id: `cat_${Date.now()}`, emoji, name });
    setAll(cats);
  };

  const remove = (id) => {
    const cats = getAll().filter(c => c.id !== id);
    setAll(cats);
  };

  const getById = (id, type = 'expense') => {
    if (type === 'income') return INCOME_CATEGORIES.find(c => c.id === id) || { emoji: '💰', name: 'Przychód' };
    return getAll().find(c => c.id === id) || { emoji: '🎁', name: 'Inne' };
  };

  const renderGrid = (containerId, type = 'expense', selectedId = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cats = type === 'income' ? INCOME_CATEGORIES : getAll();
    container.innerHTML = cats.map(cat => `
      <button class="cat-btn ${selectedId === cat.id ? 'selected' : ''}" data-id="${cat.id}" type="button">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${cat.name}</span>
      </button>
    `).join('');
    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        container.dataset.selected = btn.dataset.id;
      });
    });
    if (!selectedId && cats.length) {
      container.querySelector('.cat-btn')?.classList.add('selected');
      container.dataset.selected = cats[0].id;
    }
  };

  const renderManager = () => {
    const container = document.getElementById('categories-manager');
    if (!container) return;
    const cats = getAll();
    container.innerHTML = cats.map(cat => `
      <div class="category-item">
        <span class="category-item-emoji">${cat.emoji}</span>
        <span class="category-item-name">${cat.name}</span>
        <button class="category-delete" data-id="${cat.id}" aria-label="Usuń">✕</button>
      </div>
    `).join('');
    container.querySelectorAll('.category-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        remove(btn.dataset.id);
        renderManager();
        Toast.show('Kategoria usunięta');
      });
    });
  };

  return { getAll, add, remove, getById, renderGrid, renderManager, INCOME_CATEGORIES };
})();
