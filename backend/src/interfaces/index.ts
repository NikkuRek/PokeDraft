export type UserRole = 'ADMIN' | 'COACH';
export type DraftMode = 'POINTS' | 'TIERS';
export type LeagueStatus = 'SETUP' | 'DRAFTING' | 'IN_PROGRESS' | 'FINISHED';
export type RosterStatus = 'ACTIVE' | 'DROPPED' | 'TRADED';
export type MatchStatus = 'PENDING' | 'COMPLETED';
export type TimeoutAction = 'AUTO_PICK' | 'PAUSE';
export type TransactionType = 'FREE_AGENCY' | 'TRADE';
export type TradeStatus = 'PENDING' | 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

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
  format_name?: string;
  allow_dynamax?: boolean;
  allow_z_moves?: boolean;
  max_megas?: number;
  max_z_crystals?: number;
  max_tera_captains?: number;
  max_free_agency_moves?: number;
  require_trade_approval?: boolean;
  timeout_action?: TimeoutAction;
  is_paused?: boolean;
  turn_started_at?: Date | null;
  paused_remaining_seconds?: number | null;
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
  is_banned?: boolean;
}

export interface IRosterEntry {
  id?: number;
  coach_id: number;
  pokemon_id: number;
  cost_paid: number;
  is_mega?: boolean;
  is_z_user?: boolean;
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
  leg?: number;
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

export interface IDraftQueueItem {
  id?: number;
  league_id: number;
  coach_id: number;
  pokemon_id: number;
  priority: number;
  created_at?: Date;
  updated_at?: Date;
  Pokemon?: IPokemon;
}

export interface ITransaction {
  id?: number;
  league_id: number;
  coach_id: number;
  counterparty_coach_id?: number | null;
  type: TransactionType;
  drop_pokemon_id?: number | null;
  add_pokemon_id?: number | null;
  trade_id?: number | null;
  notes?: string | null;
  created_at?: Date;
}

export interface ITrade {
  id?: number;
  league_id: number;
  proposer_coach_id: number;
  receiver_coach_id: number;
  status: TradeStatus;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITradeItem {
  id?: number;
  trade_id: number;
  from_coach_id: number;
  to_coach_id: number;
  pokemon_id: number;
  cost_paid: number;
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
