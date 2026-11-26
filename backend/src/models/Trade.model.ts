import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ITrade, TradeStatus } from '../interfaces/index.js';

interface TradeCreationAttributes extends Optional<ITrade, 'id' | 'status' | 'notes' | 'created_at' | 'updated_at'> {}

export class Trade extends Model<ITrade, TradeCreationAttributes> implements ITrade {
  declare public id: number;
  declare public league_id: number;
  declare public proposer_coach_id: number;
  declare public receiver_coach_id: number;
  declare public status: TradeStatus;
  declare public notes: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Trade.init(
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
    proposer_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receiver_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'AWAITING_APPROVAL', 'ACCEPTED', 'REJECTED', 'CANCELLED'),
      defaultValue: 'PENDING',
      allowNull: false
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'trades',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
