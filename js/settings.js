/* === SETTINGS MODULE === */
const SettingsManager = (() => {
  const init = () => {
    const s = Storage.getSettings();

    // Apply on load
    applySettings(s);

    // Theme toggle (topbar)
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      saveAndApply({ theme: next });
      updateThemeButtons(next);
    });

    // Theme toggle (settings tab)
    document.querySelectorAll('[data-theme]').forEach(btn => {
      if (!btn.id) { // Only settings buttons, not html element
        btn.addEventListener('click', () => {
          saveAndApply({ theme: btn.dataset.theme });
          updateThemeButtons(btn.dataset.theme);
        });
      }
    });
    updateThemeButtons(s.theme);

    // Accent color
    document.querySelectorAll('.accent-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        saveAndApply({ accent: dot.dataset.color });
      });
    });
    updateAccentButtons(s.accent);

    // Currency
    const currSel = document.getElementById('currency-select');
    if (currSel) {
      currSel.value = s.currency;
      currSel.addEventListener('change', () => saveAndApply({ currency: currSel.value }));
    }

    // Date format
    const dateSel = document.getElementById('date-format-select');
    if (dateSel) {
      dateSel.value = s.dateFormat;
      dateSel.addEventListener('change', () => saveAndApply({ dateFormat: dateSel.value }));
    }

    // Settings button in topbar
    document.getElementById('open-settings-btn')?.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      App.switchTab('settings');
    });

    // Categories
    document.getElementById('add-category-btn')?.addEventListener('click', () => {
      Modal.open('modal-add-category');
    });
    document.getElementById('save-category-btn')?.addEventListener('click', () => {
      const emoji = document.getElementById('cat-emoji')?.value.trim() || '🏷️';
      const name = document.getElementById('cat-name')?.value.trim();
      if (!name) { Toast.show('Wprowadź nazwę kategorii'); return; }
      Categories.add(emoji, name);
      Categories.renderManager();
      Modal.close('modal-add-category');
      document.getElementById('cat-emoji').value = '';
      document.getElementById('cat-name').value = '';
      Toast.show('Kategoria dodana');
    });
    Categories.renderManager();

    // Data management
    document.getElementById('export-btn')?.addEventListener('click', exportData);
    document.getElementById('import-input')?.addEventListener('change', importData);
    document.getElementById('backup-btn')?.addEventListener('click', exportData);
    document.getElementById('clear-data-btn')?.addEventListener('click', clearData);
  };

  const saveAndApply = (patch) => {
    const current = Storage.getSettings();
    const updated = { ...current, ...patch };
    Storage.setSettings(updated);
    applySettings(updated);
    App.refresh();
  };

  const applySettings = (s) => {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--accent', s.accent);
    // Re-derive accent-related vars
    const hex = s.accent;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);
    document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
    const metaTheme = document.getElementById('theme-color-meta');
    if (metaTheme) metaTheme.content = s.theme === 'dark' ? '#0f0f13' : '#f5f5f9';
  };

  const updateThemeButtons = (theme) => {
    document.querySelectorAll('.toggle-btn[data-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  };
  const updateAccentButtons = (accent) => {
    document.querySelectorAll('.accent-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === accent);
    });
  };

  const exportData = () => {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Dane wyeksportowane');
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (confirm('Importować dane? Zastąpią aktualne dane.')) {
          Storage.importAll(data);
          App.refresh();
          applySettings(Storage.getSettings());
          Toast.show('Dane zaimportowane pomyślnie');
        }
      } catch { Toast.show('Błąd: nieprawidłowy plik JSON'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearData = () => {
    if (confirm('Na pewno wyczyścić WSZYSTKIE dane? Tej operacji nie można cofnąć.')) {
      if (confirm('Ostatnie ostrzeżenie — wyczyścić dane?')) {
        Storage.clearAll();
        App.refresh();
        Toast.show('Dane wyczyszczone');
      }
    }
  };

  return { init, applySettings };
})();
