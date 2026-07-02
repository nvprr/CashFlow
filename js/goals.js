/* === GOALS MODULE === */
const Goals = (() => {
  const getAll = () => Storage.getGoals();

  const add = (goal) => {
    const all = getAll();
    all.push({
      id: `goal_${Date.now()}`,
      name: goal.name,
      target: parseFloat(goal.target),
      saved: parseFloat(goal.saved) || 0,
      emoji: goal.emoji || '🎯',
      createdAt: new Date().toISOString()
    });
    Storage.setGoals(all);
  };

  const remove = (id) => {
    Storage.setGoals(getAll().filter(g => g.id !== id));
  };

  const addFunds = (id, amount) => {
    const all = getAll().map(g => {
      if (g.id === id) return { ...g, saved: Math.min(g.saved + parseFloat(amount), g.target) };
      return g;
    });
    Storage.setGoals(all);
  };

  const render = () => {
    const container = document.getElementById('goals-list');
    if (!container) return;
    const all = getAll();
    const settings = Storage.getSettings();

    if (!all.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>Brak celów</p><span>Dodaj cel, aby śledzić oszczędności</span></div>`;
      return;
    }

    container.innerHTML = all.map(g => {
      const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
      const savedFmt = formatCurrency(g.saved, settings.currency);
      const targetFmt = formatCurrency(g.target, settings.currency);
      return `
        <div class="goal-card" data-id="${g.id}">
          <div class="goal-header">
            <div class="goal-emoji">${g.emoji}</div>
            <div class="goal-info">
              <div class="goal-name">${g.name}</div>
              <div class="goal-amounts">${savedFmt} z ${targetFmt}</div>
            </div>
            <div class="goal-percent">${pct}%</div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="goal-actions">
            <button class="add-funds" data-id="${g.id}">+ Dodaj środki</button>
            <button class="delete-goal" data-id="${g.id}">Usuń</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.delete-goal').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Usuń ten cel?')) { remove(btn.dataset.id); render(); Toast.show('Cel usunięty'); }
      });
    });
    container.querySelectorAll('.add-funds').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const amt = prompt('Ile chcesz dodać? (zł)');
        if (amt && !isNaN(parseFloat(amt)) && parseFloat(amt) > 0) {
          addFunds(btn.dataset.id, amt);
          render();
          Toast.show(`Dodano ${parseFloat(amt).toFixed(2)} zł`);
        }
      });
    });
  };

  return { getAll, add, remove, addFunds, render };
})();
