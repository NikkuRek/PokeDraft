import { api } from '../services/api.js';
import { escapeHtml } from '../utils/format.js';
import { icon, IconName } from '../utils/icons.js';

const NAV_ITEMS: Array<{ id: string; label: string; mobileLabel: string; iconName: IconName }> = [
  { id: 'lobby', label: 'Ligas', mobileLabel: 'Ligas', iconName: 'leagues' },
  { id: 'draft', label: 'Sala de Draft', mobileLabel: 'Draft', iconName: 'draft' },
  { id: 'pokedex', label: 'Pokédex', mobileLabel: 'Pokédex', iconName: 'book' },
  { id: 'rosters', label: 'Plantillas', mobileLabel: 'Equipos', iconName: 'rosters' },
  { id: 'matches', label: 'Batallas', mobileLabel: 'Batallas', iconName: 'matches' },
  { id: 'leaderboard', label: 'Ranking', mobileLabel: 'Ranking', iconName: 'leaderboard' }
];

let navHandlers: {
  onNavigate: (view: string) => void;
  onSelectLeague: (leagueId: number) => void;
  onOpenAuth: () => void;
} | null = null;
let lastLeaguesSignature = '';
let lastAuthState: boolean | null = null;

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

  navHandlers = { onNavigate, onSelectLeague, onOpenAuth };
  const isAuthenticated = Boolean(api.getToken());
  const leaguesSig = leagues.map((l) => `${l.id}:${l.name}`).join('|');

  if (header.dataset.mounted !== '1') {
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
              <span class="nav-label-mobile">${item.mobileLabel}</span>
              <span class="nav-label-desktop">${item.label}</span>
            </button>
          `;
        }).join('')}
      </nav>

      <div class="header-actions">
        <select id="league-selector" class="select-input header-select" aria-label="Seleccionar liga activa">
          <option value="">-- Liga --</option>
          ${leagues
            .map(
              (l) =>
                `<option value="${l.id}" ${l.id === selectedLeagueId ? 'selected' : ''}>${escapeHtml(l.name)}</option>`
            )
            .join('')}
        </select>
        <button
          type="button"
          id="btn-auth"
          class="btn btn-secondary btn-sm btn-auth-compact"
          aria-label="${isAuthenticated ? 'Mi cuenta (sesión activa)' : 'Iniciar sesión o crear cuenta'}"
        >
          <span class="auth-led ${isAuthenticated ? 'is-online' : ''}" aria-hidden="true"></span>
          ${icon('user')}
          <span class="auth-btn-label">${isAuthenticated ? 'Sesión activa' : 'Cuenta'}</span>
        </button>
      </div>
    `;

    header.dataset.mounted = '1';
    lastLeaguesSignature = leaguesSig;
    lastAuthState = isAuthenticated;

    document.getElementById('brand-logo')?.addEventListener('click', () => navHandlers?.onNavigate('lobby'));

    header.querySelector('.nav-dock')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.nav-btn');
      const view = btn?.getAttribute('data-view');
      if (view) navHandlers?.onNavigate(view);
    });

    document.getElementById('league-selector')?.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      const val = parseInt(target.value, 10);
      if (!isNaN(val)) {
        navHandlers?.onSelectLeague(val);
      }
    });

    document.getElementById('btn-auth')?.addEventListener('click', () => navHandlers?.onOpenAuth());
    return;
  }

  // Patch active navigation tab in place without tearing down header DOM
  header.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach((btn) => {
    const isActive = btn.getAttribute('data-view') === currentView;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Patch league options only when league list changed, then sync selected value
  const selector = document.getElementById('league-selector') as HTMLSelectElement | null;
  if (selector) {
    if (leaguesSig !== lastLeaguesSignature) {
      selector.innerHTML = `
        <option value="">-- Liga --</option>
        ${leagues.map((l) => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('')}
      `;
      lastLeaguesSignature = leaguesSig;
    }
    selector.value = selectedLeagueId ? String(selectedLeagueId) : '';
  }

  // Patch auth indicator only when auth state changed
  if (isAuthenticated !== lastAuthState) {
    const authBtn = document.getElementById('btn-auth');
    if (authBtn) {
      authBtn.setAttribute(
        'aria-label',
        isAuthenticated ? 'Mi cuenta (sesión activa)' : 'Iniciar sesión o crear cuenta'
      );
      authBtn.querySelector('.auth-led')?.classList.toggle('is-online', isAuthenticated);
      const labelEl = authBtn.querySelector('.auth-btn-label');
      if (labelEl) {
        labelEl.textContent = isAuthenticated ? 'Sesión activa' : 'Cuenta';
      }
    }
    lastAuthState = isAuthenticated;
  }
};
