import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ILeague, DraftMode, LeagueStatus } from '../interfaces/index.js';

interface LeagueCreationAttributes extends Optional<ILeague, 'id' | 'status' | 'current_pick_turn' | 'created_at' | 'updated_at'> {}

export class League extends Model<ILeague, LeagueCreationAttributes> implements ILeague {
  declare public id: number;
  declare public admin_id: number;
  declare public name: string;
  declare public draft_mode: DraftMode;
  declare public total_budget: number;
  declare public roster_size: number;
  declare public time_per_pick_seconds: number;
  declare public status: LeagueStatus;
  declare public current_pick_turn: number;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

League.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    draft_mode: {
      type: DataTypes.ENUM('POINTS', 'TIERS'),
      defaultValue: 'POINTS',
      allowNull: false
    },
    total_budget: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      allowNull: false
    },
    roster_size: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false
    },
    time_per_pick_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 120,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('SETUP', 'DRAFTING', 'IN_PROGRESS', 'FINISHED'),
      defaultValue: 'SETUP',
      allowNull: false
    },
    current_pick_turn: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'leagues',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
