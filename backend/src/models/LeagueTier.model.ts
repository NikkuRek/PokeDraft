import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ILeagueTier } from '../interfaces/index.js';

interface LeagueTierCreationAttributes extends Optional<ILeagueTier, 'id' | 'custom_tier' | 'is_banned'> {}

export class LeagueTier extends Model<ILeagueTier, LeagueTierCreationAttributes> implements ILeagueTier {
  declare public id: number;
  declare public league_id: number;
  declare public pokemon_id: number;
  declare public custom_cost: number;
  declare public custom_tier: string | null;
  declare public is_banned: boolean;
}

LeagueTier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    league_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    custom_cost: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    custom_tier: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'league_tiers',
    timestamps: false
  }
);
