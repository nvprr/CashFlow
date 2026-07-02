/* ============================================
   CashFlow v0.1.0 — Settings Module
   ============================================ */

const Settings = (() => {
  const DEFAULTS = {
    theme: 'dark',
    accent: '#00C896',
    currency: 'PLN',
    dateFormat: 'dd.mm.yyyy'
  };

  let _settings = {};

  const load = () => {
    _settings = Storage.get('settings', { ...DEFAULTS });
    apply();
  };

  const save = () => {
    Storage.set('settings', _settings);
  };

  const apply = () => {
    const { theme, accent } = _settings;

    // Theme
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) metaTheme.content = theme === 'dark' ? '#0D0D0F' : '#F5F5F7';

    // Accent
    document.documentElement.style.setProperty('--accent', accent);
    // Recalculate dim/glow from accent
    const rgb = hexToRgb(accent);
    if (rgb) {
      document.documentElement.style.setProperty('--accent-dim', `rgba(${rgb},0.15)`);
      document.documentElement.style.setProperty('--accent-glow', `rgba(${rgb},0.35)`);
    }

    // Icons
    const sun = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if (sun && moon) {
      sun.classList.toggle('hidden', theme === 'light');
      moon.classList.toggle('hidden', theme === 'dark');
    }

    // Currency in calc
    const calcCurr = document.getElementById('calc-currency');
    if (calcCurr) calcCurr.textContent = `${_settings.currency}/h`;

    const modalCurr = document.getElementById('modal-currency-sym');
    if (modalCurr) modalCurr.textContent = _settings.currency;

    // Update UI
    updateSettingsUI();
  };

  const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : null;
  };

  const get = (key) => _settings[key] ?? DEFAULTS[key];

  const set = (key, value) => {
    _settings[key] = value;
    save();
    apply();
  };

  const updateSettingsUI = () => {
    // Theme opts
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === _settings.theme);
    });
    // Accent dots
    document.querySelectorAll('.accent-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === _settings.accent);
    });
    // Currency select
    const cs = document.getElementById('settings-currency');
    if (cs) cs.value = _settings.currency;
    // Date format
    const df = document.getElementById('settings-date-format');
    if (df) df.value = _settings.dateFormat;
  };

  const bindEvents = () => {
    // Theme toggle (header button)
    document.getElementById('btn-theme')?.addEventListener('click', () => {
      set('theme', get('theme') === 'dark' ? 'light' : 'dark');
    });

    // Settings theme opts
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => set('theme', btn.dataset.theme));
    });

    // Accent colors
    document.querySelectorAll('.accent-dot').forEach(dot => {
      dot.addEventListener('click', () => set('accent', dot.dataset.color));
    });

    // Currency
    document.getElementById('settings-currency')?.addEventListener('change', (e) => {
      set('currency', e.target.value);
      // Re-render dashboard
      if (typeof Dashboard !== 'undefined') Dashboard.render();
    });

    // Date format
    document.getElementById('settings-date-format')?.addEventListener('change', (e) => {
      set('dateFormat', e.target.value);
    });

    // Export
    document.getElementById('btn-export')?.addEventListener('click', exportData);

    // Import trigger
    document.getElementById('btn-import-trigger')?.addEventListener('click', () => {
      document.getElementById('btn-import')?.click();
    });

    // Import file
    document.getElementById('btn-import')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Storage.importAll(data);
          Toast.show('✅ Dane zaimportowane! Odśwież stronę.', 'success');
          setTimeout(() => location.reload(), 1500);
        } catch {
          Toast.show('❌ Błąd importu — sprawdź plik.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Clear data
    document.getElementById('btn-clear-data')?.addEventListener('click', () => {
      if (confirm('Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.')) {
        Storage.clear();
        Toast.show('🗑️ Dane usunięte.', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    });
  };

  const exportData = () => {
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-backup-${DateUtil.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('📤 Eksport gotowy!', 'success');
  };

  return { load, apply, get, set, bindEvents };
})();
