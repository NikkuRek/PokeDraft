import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ICoach } from '../interfaces/index.js';

interface CoachCreationAttributes extends Optional<ICoach, 'id' | 'user_id' | 'created_at' | 'updated_at'> {}

export class Coach extends Model<ICoach, CoachCreationAttributes> implements ICoach {
  declare public id: number;
  declare public league_id: number;
  declare public user_id: number | null;
  declare public name: string;
  declare public team_name: string;
  declare public draft_order: number;
  declare public remaining_budget: number;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Coach.init(
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    team_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    draft_order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    remaining_budget: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'coaches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
