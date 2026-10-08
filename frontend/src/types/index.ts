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
  is_tera_captain: boolean;
  status: 'ACTIVE' | 'DROPPED' | 'TRADED';
  Pokemon?: IPokemon;
}

export interface ILeague {
  id: number;
  name: string;
  draft_mode: 'POINTS' | 'TIERS';
  total_budget: number;
  roster_size: number;
  time_per_pick_seconds: number;
  status: 'SETUP' | 'DRAFTING' | 'IN_PROGRESS' | 'FINISHED';
  current_pick_turn: number;
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

export interface IMatch {
  id: number;
  league_id: number;
  week: number;
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
