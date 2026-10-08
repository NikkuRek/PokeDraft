import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.config.js';
import { IPokemon } from '../interfaces/index.js';

interface PokemonCreationAttributes extends Optional<IPokemon, 'id' | 'type2' | 'sprite_animated_url' | 'default_tier' | 'created_at' | 'updated_at'> {}

export class Pokemon extends Model<IPokemon, PokemonCreationAttributes> implements IPokemon {
  declare public id: number;
  declare public dex_number: number;
  declare public name: string;
  declare public type1: string;
  declare public type2: string | null;
  declare public base_hp: number;
  declare public base_atk: number;
  declare public base_def: number;
  declare public base_spa: number;
  declare public base_spd: number;
  declare public base_spe: number;
  declare public base_bst: number;
  declare public sprite_url: string;
  declare public sprite_animated_url: string | null;
  declare public default_cost: number;
  declare public default_tier: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Pokemon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    dex_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    type1: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    type2: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    base_hp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_atk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_def: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_spa: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_spd: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_spe: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_bst: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sprite_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sprite_animated_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    default_cost: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false
    },
    default_tier: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'Tier 3'
    }
  },
  {
    sequelize,
    tableName: 'pokemons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
