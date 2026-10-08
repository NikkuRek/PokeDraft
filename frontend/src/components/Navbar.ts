export const renderNavbar = (
  currentView: string,
  leagues: Array<{ id: number; name: string }>,
  selectedLeagueId: number | null,
  onNavigate: (view: string) => void,
  onSelectLeague: (leagueId: number) => void,
  onOpenAuth: () => void
) => {
  const header = document.getElementById('main-header');
  if (!header) return;

  header.innerHTML = `
    <div class="brand" id="brand-logo">
      <div class="brand-icon">⚔️</div>
      <span>PokeDraft <span style="color: var(--accent-primary); font-size: 0.8em;">Manager</span></span>
    </div>

    <nav>
      <ul class="nav-links">
        <li class="nav-item ${currentView === 'lobby' ? 'active' : ''}" data-view="lobby">🏠 Ligas</li>
        <li class="nav-item ${currentView === 'draft' ? 'active' : ''}" data-view="draft">🎯 Sala de Draft</li>
        <li class="nav-item ${currentView === 'rosters' ? 'active' : ''}" data-view="rosters">🛡️ Plantillas & Coberturas</li>
        <li class="nav-item ${currentView === 'matches' ? 'active' : ''}" data-view="matches">⚔️ Calendario / Batallas</li>
        <li class="nav-item ${currentView === 'leaderboard' ? 'active' : ''}" data-view="leaderboard">🏆 Clasificación & MVP</li>
      </ul>
    </nav>

    <div class="header-actions">
      <select id="league-selector" class="select-input" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
        <option value="">-- Seleccionar Liga --</option>
        ${leagues.map((l) => `<option value="${l.id}" ${l.id === selectedLeagueId ? 'selected' : ''}>${l.name}</option>`).join('')}
      </select>
      <button id="btn-auth" class="btn btn-secondary btn-sm">👤 Cuenta</button>
    </div>
  `;

  // Attach event listeners
  document.getElementById('brand-logo')?.addEventListener('click', () => onNavigate('lobby'));

  header.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      if (view) onNavigate(view);
    });
  });

  document.getElementById('league-selector')?.addEventListener('change', (e: any) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onSelectLeague(val);
    }
  });

  document.getElementById('btn-auth')?.addEventListener('click', onOpenAuth);
};
