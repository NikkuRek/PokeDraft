export interface IPokemon {
  id: number;
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
  cost: number;
  default_cost?: number;
  tier?: string | null;
  is_banned?: boolean;
  is_mega?: boolean;
}

export interface ICoach {
  id: number;
  league_id: number;
  user_id?: number | null;
  name: string;
  team_name: string;
  draft_order: number;
  remaining_budget: number;
  Roster?: IRosterEntry[];
}

export interface IRosterEntry {
  id: number;
  coach_id: number;
  pokemon_id: number;
  cost_paid: number;
  is_mega: boolean;
  is_z_user: boolean;
  is_tera_captain: boolean;
  status: 'ACTIVE' | 'DROPPED' | 'TRADED';
  Pokemon?: IPokemon;
}

export interface ILeague {
  id: number;
  admin_id?: number;
  name: string;
  draft_mode: 'POINTS' | 'TIERS';
  total_budget: number;
  roster_size: number;
  time_per_pick_seconds: number;
  status: 'SETUP' | 'DRAFTING' | 'IN_PROGRESS' | 'FINISHED';
  current_pick_turn: number;
  format_name?: string;
  allow_dynamax?: boolean;
  allow_z_moves?: boolean;
  max_megas?: number;
  max_z_crystals?: number;
  max_tera_captains?: number;
  max_free_agency_moves?: number;
  require_trade_approval?: boolean;
  timeout_action?: 'AUTO_PICK' | 'PAUSE';
  is_paused?: boolean;
  turn_started_at?: string | null;
  paused_remaining_seconds?: number | null;
  Coaches?: ICoach[];
}

export interface IDraftPick {
  id: number;
  league_id: number;
  coach_id: number;
  pokemon_id: number;
  round: number;
  overall_pick: number;
  picked_at?: string;
  Coach?: ICoach;
  Pokemon?: IPokemon;
}

export interface IDraftState {
  league: ILeague;
  active_turn: {
    coach: ICoach;
    round: number;
    pickInRound: number;
  } | null;
  coaches: ICoach[];
  picks: IDraftPick[];
  drafted_pokemon_ids: number[];
  banned_pokemon_ids?: number[];
  turn_expires_at?: string | null;
  remaining_seconds?: number | null;
  schedule: Array<{
    overallPick: number;
    round: number;
    pickInRound: number;
    coachId: number;
    coachName: string;
    teamName: string;
    isCompleted: boolean;
  }>;
}

export interface IDraftQueueItem {
  id: number;
  league_id: number;
  coach_id: number;
  pokemon_id: number;
  priority: number;
  Pokemon?: IPokemon;
}

export interface ILeagueTierItem {
  id: number;
  league_id: number;
  pokemon_id: number;
  custom_cost: number;
  custom_tier?: string | null;
  is_banned: boolean;
  Pokemon?: IPokemon;
}

export interface ITransaction {
  id: number;
  league_id: number;
  coach_id: number;
  counterparty_coach_id?: number | null;
  type: 'FREE_AGENCY' | 'TRADE';
  drop_pokemon_id?: number | null;
  add_pokemon_id?: number | null;
  trade_id?: number | null;
  notes?: string | null;
  created_at: string;
  Coach?: ICoach;
  CounterpartyCoach?: ICoach;
  DropPokemon?: IPokemon;
  AddPokemon?: IPokemon;
}

export interface ITradeItem {
  id: number;
  trade_id: number;
  from_coach_id: number;
  to_coach_id: number;
  pokemon_id: number;
  cost_paid: number;
  Pokemon?: IPokemon;
  FromCoach?: ICoach;
  ToCoach?: ICoach;
}

export interface ITrade {
  id: number;
  league_id: number;
  proposer_coach_id: number;
  receiver_coach_id: number;
  status: 'PENDING' | 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  notes?: string | null;
  created_at: string;
  ProposerCoach?: ICoach;
  ReceiverCoach?: ICoach;
  Items?: ITradeItem[];
}

export interface IMatch {
  id: number;
  league_id: number;
  week: number;
  leg?: number;
  home_coach_id: number;
  away_coach_id: number;
  home_score: number;
  away_score: number;
  replay_url?: string | null;
  status: 'PENDING' | 'COMPLETED';
  HomeCoach?: ICoach;
  AwayCoach?: ICoach;
  Stats?: any[];
}

export interface IStanding {
  coach_id: number;
  name: string;
  team_name: string;
  played: number;
  wins: number;
  losses: number;
  differential: number;
  points: number;
  h2h_points?: number;
  h2h_diff?: number;
  tied_on_primary?: boolean;
}

export interface IMvpPokemon {
  pokemon_id: number;
  name: string;
  sprite_url: string;
  sprite_animated_url?: string | null;
  type1: string;
  type2?: string | null;
  coach_name: string;
  team_name: string;
  kills: number;
  deaths: number;
  kd_ratio: number;
  appearances: number;
}

export interface IPokeApiAbility {
  name: string;
  is_hidden: boolean;
}

export interface IPokeApiDetail {
  dex_number: number;
  slug: string;
  name: string;
  type1: string;
  type2: string | null;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_spa: number;
  base_spd: number;
  base_spe: number;
  base_bst: number;
  sprite_url: string;
  sprite_shiny_url: string | null;
  sprite_home_url: string | null;
  sprite_animated_url: string | null;
  height_m: number;
  weight_kg: number;
  abilities: IPokeApiAbility[];
  cry_url: string | null;
  species_url: string | null;
}

export interface IPokeApiSpecies {
  genus_es: string;
  flavor_text_es: string;
  generation: string;
}
