import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IMatch, MatchStatus } from '../interfaces/index.js';

interface MatchCreationAttributes extends Optional<IMatch, 'id' | 'home_score' | 'away_score' | 'replay_url' | 'status' | 'created_at' | 'updated_at'> {}

export class Match extends Model<IMatch, MatchCreationAttributes> implements IMatch {
  declare public id: number;
  declare public league_id: number;
  declare public week: number;
  declare public home_coach_id: number;
  declare public away_coach_id: number;
  declare public home_score: number;
  declare public away_score: number;
  declare public replay_url: string | null;
  declare public status: MatchStatus;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Match.init(
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
    week: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    home_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    away_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    home_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    away_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    replay_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED'),
      defaultValue: 'PENDING',
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
