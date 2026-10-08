import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IRosterEntry, RosterStatus } from '../interfaces/index.js';

interface RosterEntryCreationAttributes extends Optional<IRosterEntry, 'id' | 'is_tera_captain' | 'status' | 'created_at' | 'updated_at'> {}

export class RosterEntry extends Model<IRosterEntry, RosterEntryCreationAttributes> implements IRosterEntry {
  declare public id: number;
  declare public coach_id: number;
  declare public pokemon_id: number;
  declare public cost_paid: number;
  declare public is_tera_captain: boolean;
  declare public status: RosterStatus;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

RosterEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    coach_id: {
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
    },
    is_tera_captain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'DROPPED', 'TRADED'),
      defaultValue: 'ACTIVE',
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'roster_entries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
