import { User } from './User.model.js';
import { League } from './League.model.js';
import { Coach } from './Coach.model.js';
import { Pokemon } from './Pokemon.model.js';
import { LeagueTier } from './LeagueTier.model.js';
import { RosterEntry } from './RosterEntry.model.js';
import { DraftPick } from './DraftPick.model.js';
import { Match } from './Match.model.js';
import { MatchPokemonStat } from './MatchPokemonStat.model.js';
import { DraftQueueItem } from './DraftQueueItem.model.js';
import { Transaction } from './Transaction.model.js';
import { Trade } from './Trade.model.js';
import { TradeItem } from './TradeItem.model.js';

// User -> League (Admin)
User.hasMany(League, { foreignKey: 'admin_id', as: 'AdminLeagues' });
League.belongsTo(User, { foreignKey: 'admin_id', as: 'Admin' });

// User -> Coach
User.hasMany(Coach, { foreignKey: 'user_id', as: 'Coaches' });
Coach.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// League -> Coach
League.hasMany(Coach, { foreignKey: 'league_id', as: 'Coaches', onDelete: 'CASCADE' });
Coach.belongsTo(League, { foreignKey: 'league_id', as: 'League' });

// League -> LeagueTier
League.hasMany(LeagueTier, { foreignKey: 'league_id', as: 'Tiers', onDelete: 'CASCADE' });
LeagueTier.belongsTo(League, { foreignKey: 'league_id', as: 'League' });

// Pokemon -> LeagueTier
Pokemon.hasMany(LeagueTier, { foreignKey: 'pokemon_id', as: 'LeagueTiers' });
LeagueTier.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });

// Coach -> RosterEntry
Coach.hasMany(RosterEntry, { foreignKey: 'coach_id', as: 'Roster', onDelete: 'CASCADE' });
RosterEntry.belongsTo(Coach, { foreignKey: 'coach_id', as: 'Coach' });

// Pokemon -> RosterEntry
Pokemon.hasMany(RosterEntry, { foreignKey: 'pokemon_id', as: 'RosterEntries' });
RosterEntry.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });

// League -> DraftPick
League.hasMany(DraftPick, { foreignKey: 'league_id', as: 'DraftPicks', onDelete: 'CASCADE' });
DraftPick.belongsTo(League, { foreignKey: 'league_id', as: 'League' });

// Coach -> DraftPick
Coach.hasMany(DraftPick, { foreignKey: 'coach_id', as: 'Picks' });
DraftPick.belongsTo(Coach, { foreignKey: 'coach_id', as: 'Coach' });

// Pokemon -> DraftPick
Pokemon.hasMany(DraftPick, { foreignKey: 'pokemon_id', as: 'DraftPicks' });
DraftPick.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });

// League -> Match
League.hasMany(Match, { foreignKey: 'league_id', as: 'Matches', onDelete: 'CASCADE' });
Match.belongsTo(League, { foreignKey: 'league_id', as: 'League' });

// Coach -> Match (Home & Away)
Coach.hasMany(Match, { foreignKey: 'home_coach_id', as: 'HomeMatches' });
Coach.hasMany(Match, { foreignKey: 'away_coach_id', as: 'AwayMatches' });
Match.belongsTo(Coach, { foreignKey: 'home_coach_id', as: 'HomeCoach' });
Match.belongsTo(Coach, { foreignKey: 'away_coach_id', as: 'AwayCoach' });

// Match -> MatchPokemonStat
Match.hasMany(MatchPokemonStat, { foreignKey: 'match_id', as: 'Stats', onDelete: 'CASCADE' });
MatchPokemonStat.belongsTo(Match, { foreignKey: 'match_id', as: 'Match' });

// Coach -> MatchPokemonStat
Coach.hasMany(MatchPokemonStat, { foreignKey: 'coach_id', as: 'PokemonStats' });
MatchPokemonStat.belongsTo(Coach, { foreignKey: 'coach_id', as: 'Coach' });

// Pokemon -> MatchPokemonStat
Pokemon.hasMany(MatchPokemonStat, { foreignKey: 'pokemon_id', as: 'MatchStats' });
MatchPokemonStat.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });

// DraftQueueItem Associations
League.hasMany(DraftQueueItem, { foreignKey: 'league_id', as: 'DraftQueues', onDelete: 'CASCADE' });
DraftQueueItem.belongsTo(League, { foreignKey: 'league_id', as: 'League' });
Coach.hasMany(DraftQueueItem, { foreignKey: 'coach_id', as: 'DraftQueue', onDelete: 'CASCADE' });
DraftQueueItem.belongsTo(Coach, { foreignKey: 'coach_id', as: 'Coach' });
Pokemon.hasMany(DraftQueueItem, { foreignKey: 'pokemon_id', as: 'QueuedEntries' });
DraftQueueItem.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });

// Transaction Associations
League.hasMany(Transaction, { foreignKey: 'league_id', as: 'Transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(League, { foreignKey: 'league_id', as: 'League' });
Coach.hasMany(Transaction, { foreignKey: 'coach_id', as: 'Transactions' });
Transaction.belongsTo(Coach, { foreignKey: 'coach_id', as: 'Coach' });
Transaction.belongsTo(Coach, { foreignKey: 'counterparty_coach_id', as: 'CounterpartyCoach' });
Transaction.belongsTo(Pokemon, { foreignKey: 'drop_pokemon_id', as: 'DropPokemon' });
Transaction.belongsTo(Pokemon, { foreignKey: 'add_pokemon_id', as: 'AddPokemon' });

// Trade & TradeItem Associations
League.hasMany(Trade, { foreignKey: 'league_id', as: 'Trades', onDelete: 'CASCADE' });
Trade.belongsTo(League, { foreignKey: 'league_id', as: 'League' });
Trade.belongsTo(Coach, { foreignKey: 'proposer_coach_id', as: 'ProposerCoach' });
Trade.belongsTo(Coach, { foreignKey: 'receiver_coach_id', as: 'ReceiverCoach' });
Trade.hasMany(TradeItem, { foreignKey: 'trade_id', as: 'Items', onDelete: 'CASCADE' });
TradeItem.belongsTo(Trade, { foreignKey: 'trade_id', as: 'Trade' });
TradeItem.belongsTo(Pokemon, { foreignKey: 'pokemon_id', as: 'Pokemon' });
TradeItem.belongsTo(Coach, { foreignKey: 'from_coach_id', as: 'FromCoach' });
TradeItem.belongsTo(Coach, { foreignKey: 'to_coach_id', as: 'ToCoach' });

export {
  User,
  League,
  Coach,
  Pokemon,
  LeagueTier,
  RosterEntry,
  DraftPick,
  Match,
  MatchPokemonStat,
  DraftQueueItem,
  Transaction,
  Trade,
  TradeItem
};
