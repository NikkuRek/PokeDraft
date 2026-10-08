import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IDraftPick } from '../interfaces/index.js';

interface DraftPickCreationAttributes extends Optional<IDraftPick, 'id' | 'picked_at'> {}

export class DraftPick extends Model<IDraftPick, DraftPickCreationAttributes> implements IDraftPick {
  declare public id: number;
  declare public league_id: number;
  declare public coach_id: number;
  declare public pokemon_id: number;
  declare public round: number;
  declare public overall_pick: number;
  declare public readonly picked_at: Date;
}

DraftPick.init(
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
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    overall_pick: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    picked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'draft_picks',
    timestamps: false
  }
);
