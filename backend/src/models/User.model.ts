import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IUser } from '../interfaces/index.js';

interface UserCreationAttributes extends Optional<IUser, 'id' | 'created_at' | 'updated_at'> {}

export class User extends Model<IUser, UserCreationAttributes> implements IUser {
  declare public id: number;
  declare public email: string;
  declare public password: string;
  declare public role: 'ADMIN' | 'COACH';
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'COACH'),
      defaultValue: 'COACH',
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
