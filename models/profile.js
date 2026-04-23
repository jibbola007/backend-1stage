const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // We'll override this with UUID v7
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: true
  },
  gender_probability: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  age_group: {
    type: DataTypes.ENUM('child', 'teenager', 'adult', 'senior'),
    allowNull: true
  },
  country_id: {
    type: DataTypes.STRING(2), // ISO 2-letter codes
    allowNull: true
  },
  country_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country_probability: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['gender'] },
    { fields: ['age_group'] },
    { fields: ['country_id'] },
    { fields: ['age'] },
    { fields: ['gender_probability'] },
    { fields: ['country_probability'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Profile;