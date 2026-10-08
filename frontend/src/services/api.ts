import { ILeague, ICoach, IPokemon, IDraftState, IMatch, IStanding, IMvpPokemon, IRosterEntry } from '../types/index.js';

const API_BASE = '/api';

class ApiService {
  private token: string | null = localStorage.getItem('pokedraft_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('pokedraft_token', token);
    } else {
      localStorage.removeItem('pokedraft_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.msg || data.message || 'Error en la petición al servidor.');
    }

    return data.data !== undefined ? data.data : data;
  }

  // Auth
  async login(email: string, password: string) {
    const res: any = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async register(email: string, password: string, role: string = 'COACH') {
    const res: any = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    this.setToken(res.token);
    return res;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Leagues
  async getLeagues(): Promise<ILeague[]> {
    return this.request('/leagues');
  }

  async getLeagueById(id: number): Promise<ILeague> {
    return this.request(`/leagues/${id}`);
  }

  async createLeague(data: Partial<ILeague>): Promise<ILeague> {
    return this.request('/leagues', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Coaches
  async getCoaches(leagueId: number): Promise<ICoach[]> {
    return this.request(`/coaches/league/${leagueId}`);
  }

  async registerCoach(data: { league_id: number; name: string; team_name: string }): Promise<ICoach> {
    return this.request('/coaches', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Pokemon Catalog
  async getPokemons(params: { query?: string; type?: string; leagueId?: number; limit?: number; offset?: number } = {}): Promise<IPokemon[]> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.type) searchParams.append('type', params.type);
    if (params.leagueId) searchParams.append('leagueId', String(params.leagueId));
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.offset) searchParams.append('offset', String(params.offset));

    const qs = searchParams.toString();
    return this.request(`/pokemons${qs ? `?${qs}` : ''}`);
  }

  // Draft
  async startDraft(leagueId: number): Promise<ILeague> {
    return this.request(`/draft/league/${leagueId}/start`, { method: 'POST' });
  }

  async getDraftState(leagueId: number): Promise<IDraftState> {
    return this.request(`/draft/league/${leagueId}/state`);
  }

  async makeDraftPick(leagueId: number, coachId: number, pokemonId: number) {
    return this.request(`/draft/league/${leagueId}/pick`, {
      method: 'POST',
      body: JSON.stringify({ coach_id: coachId, pokemon_id: pokemonId })
    });
  }

  async undoDraftPick(leagueId: number) {
    return this.request(`/draft/league/${leagueId}/undo`, { method: 'POST' });
  }

  // Roster
  async getCoachRoster(coachId: number): Promise<{ coach: ICoach; roster: IRosterEntry[]; coverage: any; showdownExport: string }> {
    return this.request(`/rosters/coach/${coachId}`);
  }

  async freeAgencyDropAdd(coachId: number, dropPokemonId: number, addPokemonId: number) {
    return this.request(`/rosters/coach/${coachId}/free-agency`, {
      method: 'POST',
      body: JSON.stringify({ drop_pokemon_id: dropPokemonId, add_pokemon_id: addPokemonId })
    });
  }

  // Matches & Leaderboard
  async generateFixture(leagueId: number): Promise<IMatch[]> {
    return this.request(`/matches/league/${leagueId}/generate-fixture`, { method: 'POST' });
  }

  async getMatches(leagueId: number, week?: number): Promise<IMatch[]> {
    return this.request(`/matches/league/${leagueId}${week ? `?week=${week}` : ''}`);
  }

  async recordMatchResult(matchId: number, data: any) {
    return this.request(`/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getStandings(leagueId: number): Promise<IStanding[]> {
    return this.request(`/leaderboard/league/${leagueId}/standings`);
  }

  async getMvpRanking(leagueId: number): Promise<IMvpPokemon[]> {
    return this.request(`/leaderboard/league/${leagueId}/mvp`);
  }
}

export const api = new ApiService();
