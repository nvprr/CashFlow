/* ============================================
   CashFlow v0.1.0 — Toast Module
   ============================================ */

const Toast = (() => {
  const show = (message, type = 'success', duration = 2800) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  };

  return { show };
})();
