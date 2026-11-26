import {
  ILeague,
  ICoach,
  IPokemon,
  IDraftState,
  IMatch,
  IStanding,
  IMvpPokemon,
  IRosterEntry,
  IDraftQueueItem,
  ILeagueTierItem,
  ITransaction,
  ITrade
} from '../types/index.js';

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

  public getAuthUser(): { id: number; email: string; role: 'ADMIN' | 'COACH' } | null {
    if (!this.token) return null;
    try {
      const parts = this.token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const parsed = JSON.parse(atob(padded));
      if (!parsed || typeof parsed.id !== 'number') return null;
      return {
        id: parsed.id,
        email: String(parsed.email || ''),
        role: parsed.role === 'ADMIN' ? 'ADMIN' : 'COACH'
      };
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
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

  // Leagues & Rules
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

  async updateLeagueRules(leagueId: number, data: Partial<ILeague>): Promise<ILeague> {
    return this.request(`/leagues/${leagueId}/rules`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getLeagueTiers(leagueId: number): Promise<ILeagueTierItem[]> {
    return this.request(`/leagues/${leagueId}/tiers`);
  }

  async setLeaguePokemonTier(
    leagueId: number,
    pokemonId: number,
    customCost: number,
    customTier?: string | null,
    isBanned: boolean = false
  ): Promise<ILeagueTierItem> {
    return this.request(`/leagues/${leagueId}/tiers`, {
      method: 'POST',
      body: JSON.stringify({
        pokemon_id: pokemonId,
        custom_cost: customCost,
        custom_tier: customTier || null,
        is_banned: isBanned
      })
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
  async getPokemons(
    params: { query?: string; type?: string; leagueId?: number; limit?: number; offset?: number } = {}
  ): Promise<IPokemon[]> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.type) searchParams.append('type', params.type);
    if (params.leagueId) searchParams.append('leagueId', String(params.leagueId));
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.offset) searchParams.append('offset', String(params.offset));

    const qs = searchParams.toString();
    return this.request(`/pokemons${qs ? `?${qs}` : ''}`);
  }

  async syncPokemonFromPokeApi(nameOrId: string | number, defaultCost: number = 10): Promise<IPokemon> {
    return this.request('/pokemons/sync-pokeapi', {
      method: 'POST',
      body: JSON.stringify({ nameOrId, defaultCost })
    });
  }

  // Draft + Live SSE + Async Queue + Commissioner Controls
  createDraftEventSource(leagueId: number): EventSource {
    return new EventSource(`${API_BASE}/draft/league/${leagueId}/stream`);
  }

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

  async pauseDraft(leagueId: number): Promise<ILeague> {
    return this.request(`/draft/league/${leagueId}/pause`, { method: 'POST' });
  }

  async resumeDraft(leagueId: number): Promise<ILeague> {
    return this.request(`/draft/league/${leagueId}/resume`, { method: 'POST' });
  }

  async forceDraftPick(leagueId: number, pokemonId: number) {
    return this.request(`/draft/league/${leagueId}/force-pick`, {
      method: 'POST',
      body: JSON.stringify({ pokemon_id: pokemonId })
    });
  }

  async skipDraftTurn(leagueId: number) {
    return this.request(`/draft/league/${leagueId}/skip-turn`, { method: 'POST' });
  }

  async getDraftQueue(leagueId: number, coachId: number): Promise<IDraftQueueItem[]> {
    return this.request(`/draft/league/${leagueId}/queue/${coachId}`);
  }

  async addToDraftQueue(leagueId: number, coachId: number, pokemonId: number): Promise<IDraftQueueItem[]> {
    return this.request(`/draft/league/${leagueId}/queue/${coachId}`, {
      method: 'POST',
      body: JSON.stringify({ pokemon_id: pokemonId })
    });
  }

  async reorderDraftQueue(leagueId: number, coachId: number, pokemonIds: number[]): Promise<IDraftQueueItem[]> {
    return this.request(`/draft/league/${leagueId}/queue/${coachId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ pokemon_ids: pokemonIds })
    });
  }

  async removeFromDraftQueue(leagueId: number, coachId: number, pokemonId: number): Promise<IDraftQueueItem[]> {
    return this.request(`/draft/league/${leagueId}/queue/${coachId}/${pokemonId}`, {
      method: 'DELETE'
    });
  }

  // Roster, Designations & Transactions
  async getCoachRoster(coachId: number): Promise<{
    coach: ICoach;
    roster: IRosterEntry[];
    coverage: any;
    showdownExport: string;
    league?: ILeague;
    free_agency_used?: number;
  }> {
    return this.request(`/rosters/coach/${coachId}`);
  }

  async freeAgencyDropAdd(coachId: number, dropPokemonId: number, addPokemonId: number) {
    return this.request(`/rosters/coach/${coachId}/free-agency`, {
      method: 'POST',
      body: JSON.stringify({ drop_pokemon_id: dropPokemonId, add_pokemon_id: addPokemonId })
    });
  }

  async updateRosterDesignations(
    coachId: number,
    entryId: number,
    data: { is_mega?: boolean; is_z_user?: boolean; is_tera_captain?: boolean }
  ): Promise<IRosterEntry> {
    return this.request(`/rosters/coach/${coachId}/entry/${entryId}/designations`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getLeagueTransactions(leagueId: number): Promise<ITransaction[]> {
    return this.request(`/rosters/league/${leagueId}/transactions`);
  }

  // Trades
  async getLeagueTrades(leagueId: number): Promise<ITrade[]> {
    return this.request(`/trades/league/${leagueId}`);
  }

  async proposeTrade(
    leagueId: number,
    data: {
      proposer_coach_id: number;
      receiver_coach_id: number;
      proposer_pokemon_ids: number[];
      receiver_pokemon_ids: number[];
      notes?: string;
    }
  ): Promise<ITrade> {
    return this.request(`/trades/league/${leagueId}/propose`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async respondToTrade(tradeId: number, action: 'ACCEPT' | 'REJECT' | 'CANCEL'): Promise<ITrade> {
    return this.request(`/trades/${tradeId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  async reviewTrade(leagueId: number, tradeId: number, approve: boolean): Promise<ITrade> {
    return this.request(`/trades/league/${leagueId}/${tradeId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approve })
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
