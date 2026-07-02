/* ============================================
   CashFlow v0.1.0 — Modal Module
   ============================================ */

const Modal = (() => {
  const open = (id) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const close = (id) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  const closeAll = () => {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  };

  const bindEvents = () => {
    // Close on overlay click (not sheet)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });

    // Close buttons
    document.getElementById('btn-close-modal-tx')?.addEventListener('click', () => close('modal-transaction'));
    document.getElementById('btn-close-modal-goal')?.addEventListener('click', () => close('modal-goal'));
    document.getElementById('btn-close-settings')?.addEventListener('click', () => close('modal-settings'));

    // Menu button
    document.getElementById('btn-menu')?.addEventListener('click', () => {
      open('modal-settings');
      Categories.renderEditor();
    });

    // FAB
    document.getElementById('fab-add')?.addEventListener('click', () => {
      open('modal-transaction');
      // Set today's date
      const dateInput = document.getElementById('tx-date');
      if (dateInput && !dateInput.value) dateInput.value = DateUtil.today();
      // Populate categories
      const catSel = document.getElementById('tx-category');
      const curType = document.querySelector('.type-btn.active')?.dataset.type || 'expense';
      Categories.populateSelect(catSel, curType);
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  };

  return { open, close, closeAll, bindEvents };
})();
