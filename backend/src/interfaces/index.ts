export type UserRole = 'ADMIN' | 'COACH';
export type DraftMode = 'POINTS' | 'TIERS';
export type LeagueStatus = 'SETUP' | 'DRAFTING' | 'IN_PROGRESS' | 'FINISHED';
export type RosterStatus = 'ACTIVE' | 'DROPPED' | 'TRADED';
export type MatchStatus = 'PENDING' | 'COMPLETED';

export interface IUser {
  id?: number;
  email: string;
  password?: string;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
}

export interface ILeague {
  id?: number;
  admin_id: number;
  name: string;
  draft_mode: DraftMode;
  total_budget: number;
  roster_size: number;
  time_per_pick_seconds: number;
  status: LeagueStatus;
  current_pick_turn?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICoach {
  id?: number;
  league_id: number;
  user_id?: number | null;
  name: string;
  team_name: string;
  draft_order: number;
  remaining_budget: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPokemon {
  id?: number;
  dex_number: number;
  name: string;
  type1: string;
  type2?: string | null;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_spa: number;
  base_spd: number;
  base_spe: number;
  base_bst: number;
  sprite_url: string;
  sprite_animated_url?: string | null;
  default_cost: number;
  default_tier?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ILeagueTier {
  id?: number;
  league_id: number;
  pokemon_id: number;
  custom_cost: number;
  custom_tier?: string | null;
}

export interface IRosterEntry {
  id?: number;
  coach_id: number;
  pokemon_id: number;
  cost_paid: number;
  is_tera_captain: boolean;
  status: RosterStatus;
  created_at?: Date;
  updated_at?: Date;
  Pokemon?: IPokemon;
}

export interface IDraftPick {
  id?: number;
  league_id: number;
  coach_id: number;
  pokemon_id: number;
  round: number;
  overall_pick: number;
  picked_at?: Date;
  Coach?: ICoach;
  Pokemon?: IPokemon;
}

export interface IMatch {
  id?: number;
  league_id: number;
  week: number;
  home_coach_id: number;
  away_coach_id: number;
  home_score: number;
  away_score: number;
  replay_url?: string | null;
  status: MatchStatus;
  created_at?: Date;
  updated_at?: Date;
  HomeCoach?: ICoach;
  AwayCoach?: ICoach;
  MatchPokemonStats?: IMatchPokemonStat[];
}

export interface IMatchPokemonStat {
  id?: number;
  match_id: number;
  coach_id: number;
  pokemon_id: number;
  kills: number;
  died: boolean;
  Pokemon?: IPokemon;
}

export interface IAuthPayload {
  id: number;
  email: string;
  role: UserRole;
}
