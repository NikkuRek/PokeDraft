import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IDraftQueueItem } from '../interfaces/index.js';

interface DraftQueueCreationAttributes extends Optional<IDraftQueueItem, 'id' | 'created_at' | 'updated_at'> {}

export class DraftQueueItem extends Model<IDraftQueueItem, DraftQueueCreationAttributes> implements IDraftQueueItem {
  declare public id: number;
  declare public league_id: number;
  declare public coach_id: number;
  declare public pokemon_id: number;
  declare public priority: number;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

DraftQueueItem.init(
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
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'draft_queue_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
