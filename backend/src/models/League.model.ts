import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ILeague, DraftMode, LeagueStatus, TimeoutAction } from '../interfaces/index.js';

interface LeagueCreationAttributes
  extends Optional<
    ILeague,
    | 'id'
    | 'status'
    | 'current_pick_turn'
    | 'format_name'
    | 'allow_dynamax'
    | 'allow_z_moves'
    | 'max_megas'
    | 'max_z_crystals'
    | 'max_tera_captains'
    | 'max_free_agency_moves'
    | 'require_trade_approval'
    | 'timeout_action'
    | 'is_paused'
    | 'turn_started_at'
    | 'paused_remaining_seconds'
    | 'created_at'
    | 'updated_at'
  > {}

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
  declare public format_name: string;
  declare public allow_dynamax: boolean;
  declare public allow_z_moves: boolean;
  declare public max_megas: number;
  declare public max_z_crystals: number;
  declare public max_tera_captains: number;
  declare public max_free_agency_moves: number;
  declare public require_trade_approval: boolean;
  declare public timeout_action: TimeoutAction;
  declare public is_paused: boolean;
  declare public turn_started_at: Date | null;
  declare public paused_remaining_seconds: number | null;
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
      defaultValue: 43200,
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
    },
    format_name: {
      type: DataTypes.STRING(80),
      defaultValue: 'NatDex Gen 9',
      allowNull: false
    },
    allow_dynamax: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    allow_z_moves: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    max_megas: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    max_z_crystals: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    max_tera_captains: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    max_free_agency_moves: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      allowNull: false
    },
    require_trade_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    timeout_action: {
      type: DataTypes.ENUM('AUTO_PICK', 'PAUSE'),
      defaultValue: 'AUTO_PICK',
      allowNull: false
    },
    is_paused: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    turn_started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paused_remaining_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true
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
