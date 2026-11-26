import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ITradeItem } from '../interfaces/index.js';

interface TradeItemCreationAttributes extends Optional<ITradeItem, 'id'> {}

export class TradeItem extends Model<ITradeItem, TradeItemCreationAttributes> implements ITradeItem {
  declare public id: number;
  declare public trade_id: number;
  declare public from_coach_id: number;
  declare public to_coach_id: number;
  declare public pokemon_id: number;
  declare public cost_paid: number;
}

TradeItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    trade_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    from_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cost_paid: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'trade_items',
    timestamps: false
  }
);
