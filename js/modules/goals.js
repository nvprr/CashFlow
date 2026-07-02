/* ============================================
   CashFlow v0.1.0 — Goals Module
   ============================================ */

const Goals = (() => {
  const getAll = () => Storage.get('goals', []);

  const add = (goal) => {
    const all = getAll();
    goal.id = 'goal_' + Date.now();
    goal.createdAt = new Date().toISOString();
    all.push(goal);
    Storage.set('goals', all);
  };

  const update = (id, changes) => {
    const all = getAll().map(g => g.id === id ? { ...g, ...changes } : g);
    Storage.set('goals', all);
  };

  const remove = (id) => {
    Storage.set('goals', getAll().filter(g => g.id !== id));
  };

  const renderGoalCard = (goal) => {
    const cur = Settings.get('currency');
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100)) || 0;
    const done = pct >= 100;

    const card = document.createElement('div');
    card.className = `goal-card${done ? ' completed' : ''}`;
    card.dataset.id = goal.id;
    card.innerHTML = `
      <div class="goal-header">
        <div class="goal-info">
          <div class="goal-emoji">${goal.emoji || '🎯'}</div>
          <div>
            <div class="goal-name">${goal.name}</div>
            <div class="goal-status${done ? ' done' : ''}">${done ? '✅ Cel osiągnięty!' : `Cel: ${Format.number(goal.target)} ${cur}`}</div>
          </div>
        </div>
        <div class="goal-actions">
          <button class="goal-btn goal-delete" title="Usuń cel">✕</button>
        </div>
      </div>
      <div class="goal-amounts">
        <div class="goal-current">${Format.number(goal.current)} <span style="font-size:13px;font-weight:400;color:var(--text-secondary)">${cur}</span></div>
        <div class="goal-target">${Format.number(goal.target)} ${cur}</div>
      </div>
      <div class="goal-progress-track">
        <div class="goal-progress-fill" style="width:0%"></div>
      </div>
      <div class="goal-pct">${pct}%</div>
      ${!done ? `
      <div class="goal-add-row">
        <input class="goal-add-input" type="number" placeholder="Dodaj kwotę..." min="0" step="0.01" />
        <button class="goal-add-btn">+ Dodaj</button>
      </div>` : ''}
    `;

    // Animate progress bar
    requestAnimationFrame(() => {
      const bar = card.querySelector('.goal-progress-fill');
      if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 50);
    });

    // Delete
    card.querySelector('.goal-delete').addEventListener('click', () => {
      if (confirm(`Usunąć cel "${goal.name}"?`)) {
        remove(goal.id);
        render();
        Toast.show('🗑️ Cel usunięty', 'success');
      }
    });

    // Add amount
    const addBtn = card.querySelector('.goal-add-btn');
    const addInput = card.querySelector('.goal-add-input');
    addBtn?.addEventListener('click', () => {
      const amount = parseFloat(addInput.value);
      if (!amount || amount <= 0) { Toast.show('Podaj prawidłową kwotę', 'error'); return; }
      update(goal.id, { current: Math.min(goal.target, goal.current + amount) });
      render();
      Toast.show(`✅ Dodano ${Format.number(amount)} ${cur}`, 'success');
    });

    return card;
  };

  const render = () => {
    const container = document.getElementById('goals-list');
    if (!container) return;
    const goals = getAll();
    container.innerHTML = '';
    if (!goals.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">Brak celów</div><div class="empty-sub">Dodaj swój pierwszy cel oszczędnościowy</div></div>`;
      return;
    }
    goals.forEach(g => container.appendChild(renderGoalCard(g)));
  };

  const bindEvents = () => {
    document.getElementById('btn-add-goal')?.addEventListener('click', () => {
      Modal.open('modal-goal');
    });

    document.getElementById('btn-save-goal')?.addEventListener('click', () => {
      const name    = document.getElementById('goal-name').value.trim();
      const target  = parseFloat(document.getElementById('goal-target').value);
      const current = parseFloat(document.getElementById('goal-current').value) || 0;
      const emoji   = document.getElementById('goal-emoji').value.trim() || '🎯';

      if (!name) { Toast.show('Podaj nazwę celu', 'error'); return; }
      if (!target || target <= 0) { Toast.show('Podaj kwotę docelową', 'error'); return; }

      add({ name, target, current, emoji });
      render();
      Modal.close('modal-goal');
      Toast.show('🎯 Cel dodany!', 'success');

      // Reset
      ['goal-name','goal-target','goal-current','goal-emoji'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    });
  };

  return { getAll, add, update, remove, render, bindEvents };
})();
