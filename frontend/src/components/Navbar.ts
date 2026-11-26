import { api } from '../services/api.js';
import { escapeHtml } from '../utils/format.js';
import { icon, IconName } from '../utils/icons.js';

const NAV_ITEMS: Array<{ id: string; label: string; iconName: IconName }> = [
  { id: 'lobby', label: 'Ligas', iconName: 'leagues' },
  { id: 'draft', label: 'Sala de Draft', iconName: 'draft' },
  { id: 'pokedex', label: 'Pokédex', iconName: 'book' },
  { id: 'rosters', label: 'Plantillas', iconName: 'rosters' },
  { id: 'matches', label: 'Batallas', iconName: 'matches' },
  { id: 'leaderboard', label: 'Ranking', iconName: 'leaderboard' }
];

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

  const isAuthenticated = Boolean(api.getToken());

  header.innerHTML = `
    <button type="button" class="brand-trigger" id="brand-logo" aria-label="Ir al inicio de Ligas">
      <span class="dex-optic-cluster" aria-hidden="true">
        <span class="dex-optic-lens"></span>
        <span class="dex-led-bank">
          <span class="dex-led dex-led--red"></span>
          <span class="dex-led dex-led--gold"></span>
          <span class="dex-led dex-led--green"></span>
        </span>
      </span>
      <span class="brand-wordmark">
        <span class="brand-title">PokeDraft</span>
        <span class="brand-sub">Consola Dex</span>
      </span>
    </button>

    <nav class="nav-dock" aria-label="Navegación principal">
      ${NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id;
        return `
          <button
            type="button"
            class="nav-btn ${isActive ? 'active' : ''}"
            data-view="${item.id}"
            ${isActive ? 'aria-current="page"' : ''}
          >
            ${icon(item.iconName)}
            <span>${item.label}</span>
          </button>
        `;
      }).join('')}
    </nav>

    <div class="header-actions">
      <select id="league-selector" class="select-input header-select" aria-label="Seleccionar liga activa">
        <option value="">-- Seleccionar Liga --</option>
        ${leagues
          .map(
            (l) =>
              `<option value="${l.id}" ${l.id === selectedLeagueId ? 'selected' : ''}>${escapeHtml(l.name)}</option>`
          )
          .join('')}
      </select>
      <button type="button" id="btn-auth" class="btn btn-secondary btn-sm">
        <span class="auth-led ${isAuthenticated ? 'is-online' : ''}" aria-hidden="true"></span>
        ${icon('user')}
        <span>${isAuthenticated ? 'Sesión activa' : 'Cuenta'}</span>
      </button>
    </div>
  `;

  document.getElementById('brand-logo')?.addEventListener('click', () => onNavigate('lobby'));

  header.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) onNavigate(view);
    });
  });

  document.getElementById('league-selector')?.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const val = parseInt(target.value, 10);
    if (!isNaN(val)) {
      onSelectLeague(val);
    }
  });

  document.getElementById('btn-auth')?.addEventListener('click', onOpenAuth);
};
