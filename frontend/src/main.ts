import { api } from './services/api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderLobbyView } from './components/LobbyView.js';
import { renderDraftBoardView } from './components/DraftBoardView.js';
import { renderRosterHubView } from './components/RosterHubView.js';
import { renderMatchesView } from './components/MatchesView.js';
import { renderLeaderboardView } from './components/LeaderboardView.js';
import { renderPokedexView } from './components/PokedexView.js';
import { renderAuthModal } from './components/AuthModal.js';
import { icon } from './utils/icons.js';
import { escapeHtml } from './utils/format.js';

const VALID_VIEWS = new Set(['lobby', 'draft', 'pokedex', 'rosters', 'matches', 'leaderboard']);

class App {
  private currentView: string = 'lobby';
  private selectedLeagueId: number | null = null;
  private leagues: Array<{ id: number; name: string }> = [];

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && VALID_VIEWS.has(viewParam)) {
      this.currentView = viewParam;
    }

    const savedLeague = localStorage.getItem('pokedraft_selected_league');
    if (savedLeague) {
      const parsed = parseInt(savedLeague, 10);
      if (!isNaN(parsed)) {
        this.selectedLeagueId = parsed;
      }
    }

    this.bindGlobalModalDismiss();
    this.init();
  }

  private bindGlobalModalDismiss() {
    const modalBackdrop = document.getElementById('modal-container');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          modalBackdrop.classList.add('hidden');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const container = document.getElementById('modal-container');
        if (container && !container.classList.contains('hidden')) {
          container.classList.add('hidden');
        }
      }
    });
  }

  public showToast = (message: string, isError: boolean = false) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast--error' : 'toast--success'}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${icon(isError ? 'alert' : 'check')}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 260);
    }, 3500);
  };

  private async fetchLeaguesList() {
    try {
      const list = await api.getLeagues();
      this.leagues = list.map((l) => ({ id: l.id, name: l.name }));

      if (!this.selectedLeagueId && this.leagues.length > 0) {
        this.selectedLeagueId = this.leagues[0].id;
        localStorage.setItem('pokedraft_selected_league', String(this.selectedLeagueId));
      }
    } catch (e) {
      console.warn('No se pudieron cargar las ligas para la navbar:', e);
    }
  }

  public navigate = (view: string) => {
    if (!VALID_VIEWS.has(view)) return;
    this.currentView = view;
    this.render();
  };

  public selectLeague = (leagueId: number) => {
    this.selectedLeagueId = leagueId;
    localStorage.setItem('pokedraft_selected_league', String(leagueId));
    this.render();
  };

  public openAuth = () => {
    renderAuthModal(() => {
      this.render();
    }, this.showToast);
  };

  public async render() {
    await this.fetchLeaguesList();

    renderNavbar(
      this.currentView,
      this.leagues,
      this.selectedLeagueId,
      this.navigate,
      this.selectLeague,
      this.openAuth
    );

    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;

    switch (this.currentView) {
      case 'lobby':
        await renderLobbyView(
          mainContainer,
          (id) => {
            this.selectLeague(id);
            this.navigate('draft');
          },
          this.showToast
        );
        break;

      case 'draft':
        await renderDraftBoardView(mainContainer, this.selectedLeagueId, this.showToast);
        break;

      case 'pokedex':
        await renderPokedexView(mainContainer, this.showToast);
        break;

      case 'rosters':
        await renderRosterHubView(mainContainer, this.selectedLeagueId, this.showToast);
        break;

      case 'matches':
        await renderMatchesView(mainContainer, this.selectedLeagueId, this.showToast);
        break;

      case 'leaderboard':
        await renderLeaderboardView(mainContainer, this.selectedLeagueId, this.showToast);
        break;

      default:
        await renderLobbyView(mainContainer, this.selectLeague, this.showToast);
        break;
    }
  }

  public async init() {
    await this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
