/* === SETTINGS MODULE v0.2.0 === */
const SettingsManager = (() => {
  let _bound = false;

  const init = () => {
    const s = Storage.getSettings();
    _apply(s);
    if (_bound) { syncSelects(); return; }
    _bound = true;

    // Topbar theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      _saveApply({ theme: next });
      _syncThemeButtons(next);
    });

    // Settings-tab theme buttons
    document.querySelectorAll('.toggle-btn[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        _saveApply({ theme: btn.dataset.theme });
        _syncThemeButtons(btn.dataset.theme);
      });
    });

    // Accent dots
    document.querySelectorAll('.accent-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        _saveApply({ accent: dot.dataset.color });
      });
    });

    // Currency & date format
    document.getElementById('currency-select')?.addEventListener('change', e => _saveApply({ currency: e.target.value }));
    document.getElementById('date-format-select')?.addEventListener('change', e => _saveApply({ dateFormat: e.target.value }));

    // Settings shortcut from topbar
    document.getElementById('open-settings-btn')?.addEventListener('click', () => App.switchTab('settings'));

    // Categories
    document.getElementById('add-category-btn')?.addEventListener('click', () => Modal.open('modal-add-category'));
    document.getElementById('save-category-btn')?.addEventListener('click', _saveCategory);

    // Data
    document.getElementById('export-btn')?.addEventListener('click', _export);
    document.getElementById('backup-btn')?.addEventListener('click', _export);
    document.getElementById('import-input')?.addEventListener('change', _import);
    document.getElementById('clear-data-btn')?.addEventListener('click', _clearData);

    _syncThemeButtons(s.theme);
    _syncAccentButtons(s.accent);
    syncSelects();
  };

  const syncSelects = () => {
    const s = Storage.getSettings();
    const cur = document.getElementById('currency-select');
    const dat = document.getElementById('date-format-select');
    if (cur) cur.value = s.currency;
    if (dat) dat.value = s.dateFormat;
    _syncThemeButtons(s.theme);
    _syncAccentButtons(s.accent);
    Categories.renderManager();
  };

  const _saveApply = (patch) => {
    Storage.patchSettings(patch);
    _apply(Storage.getSettings());
    App.refresh();
  };

  const _apply = (s) => {
    document.documentElement.setAttribute('data-theme', s.theme);
    // Accent CSS vars
    const hex = s.accent || '#6c63ff';
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    const root = document.documentElement;
    root.style.setProperty('--accent',     hex);
    root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
    root.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty('--accent-glow',`rgba(${r},${g},${b},0.35)`);
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.content = s.theme === 'dark' ? '#0f0f13' : '#f5f5f9';
  };

  const _syncThemeButtons = (theme) => {
    document.querySelectorAll('.toggle-btn[data-theme]').forEach(b =>
      b.classList.toggle('active', b.dataset.theme === theme)
    );
  };
  const _syncAccentButtons = (accent) => {
    document.querySelectorAll('.accent-dot').forEach(d =>
      d.classList.toggle('active', d.dataset.color === accent)
    );
  };

  const _saveCategory = () => {
    const emoji = document.getElementById('cat-emoji')?.value.trim() || '🏷️';
    const name  = document.getElementById('cat-name')?.value.trim();
    if (!name) { Toast.show('Wprowadź nazwę'); return; }
    Categories.add(emoji, name);
    Categories.renderManager();
    Modal.close('modal-add-category');
    document.getElementById('cat-emoji').value = '';
    document.getElementById('cat-name').value  = '';
    Toast.show('Kategoria dodana');
  };

  const _export = () => {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cashflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Dane wyeksportowane');
  };

  const _import = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const ok = Storage.importAll(ev.target.result);
        if (!ok) throw new Error('parse failed');
        if (confirm('Dane załadowane. Zastąpić aktualne dane?')) {
          _apply(Storage.getSettings());
          syncSelects();
          App.refresh();
          Toast.show('✅ Dane zaimportowane');
        }
      } catch { Toast.show('❌ Błąd: nieprawidłowy plik'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const _clearData = () => {
    if (confirm('Wyczyścić WSZYSTKIE dane? Tej operacji nie można cofnąć.')) {
      if (confirm('Ostatnie ostrzeżenie. Kontynuować?')) {
        Storage.clearAll();
        App.refresh();
        Toast.show('Dane wyczyszczone');
      }
    }
  };

  return { init, syncSelects };
})();
