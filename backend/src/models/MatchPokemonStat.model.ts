import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IMatchPokemonStat } from '../interfaces/index.js';

interface MatchPokemonStatCreationAttributes extends Optional<IMatchPokemonStat, 'id' | 'kills' | 'died'> {}

export class MatchPokemonStat extends Model<IMatchPokemonStat, MatchPokemonStatCreationAttributes> implements IMatchPokemonStat {
  declare public id: number;
  declare public match_id: number;
  declare public coach_id: number;
  declare public pokemon_id: number;
  declare public kills: number;
  declare public died: boolean;
}

MatchPokemonStat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    kills: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    died: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'match_pokemon_stats',
    timestamps: false
  }
);
