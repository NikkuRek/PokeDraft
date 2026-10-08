import { api } from './services/api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderLobbyView } from './components/LobbyView.js';
import { renderDraftBoardView } from './components/DraftBoardView.js';
import { renderRosterHubView } from './components/RosterHubView.js';
import { renderMatchesView } from './components/MatchesView.js';
import { renderLeaderboardView } from './components/LeaderboardView.js';
import { renderAuthModal } from './components/AuthModal.js';

class App {
  private currentView: string = 'lobby';
  private selectedLeagueId: number | null = null;
  private leagues: Array<{ id: number; name: string }> = [];

  constructor() {
    const savedLeague = localStorage.getItem('pokedraft_selected_league');
    if (savedLeague) {
      this.selectedLeagueId = parseInt(savedLeague, 10);
    }
    this.init();
  }

  public showToast = (message: string, isError: boolean = false) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderLeftColor = 'var(--accent-red)';
    }
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  private async fetchLeaguesList() {
    try {
      const list = await api.getLeagues();
      this.leagues = list.map((l) => ({ id: l.id, name: l.name }));

      // If no league is selected, select the first one if available
      if (!this.selectedLeagueId && this.leagues.length > 0) {
        this.selectedLeagueId = this.leagues[0].id;
        localStorage.setItem('pokedraft_selected_league', String(this.selectedLeagueId));
      }
    } catch (e) {
      console.warn('No se pudieron cargar las ligas para la navbar:', e);
    }
  }

  public navigate = (view: string) => {
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

    // Render Navbar
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

    // Render Active View
    switch (this.currentView) {
      case 'lobby':
        await renderLobbyView(mainContainer, (id) => {
          this.selectLeague(id);
          this.navigate('draft');
        }, this.showToast);
        break;

      case 'draft':
        await renderDraftBoardView(mainContainer, this.selectedLeagueId, this.showToast);
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

// Instantiate App on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
