import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { ITransaction, TransactionType } from '../interfaces/index.js';

interface TransactionCreationAttributes
  extends Optional<ITransaction, 'id' | 'counterparty_coach_id' | 'drop_pokemon_id' | 'add_pokemon_id' | 'trade_id' | 'notes' | 'created_at'> {}

export class Transaction extends Model<ITransaction, TransactionCreationAttributes> implements ITransaction {
  declare public id: number;
  declare public league_id: number;
  declare public coach_id: number;
  declare public counterparty_coach_id: number | null;
  declare public type: TransactionType;
  declare public drop_pokemon_id: number | null;
  declare public add_pokemon_id: number | null;
  declare public trade_id: number | null;
  declare public notes: string | null;
  declare public readonly created_at: Date;
}

Transaction.init(
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
    counterparty_coach_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('FREE_AGENCY', 'TRADE'),
      allowNull: false
    },
    drop_pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    add_pokemon_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    trade_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);
