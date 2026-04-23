require('dotenv').config();

const { Sequelize } = require('sequelize');

// PostgreSQL connection - Update these credentials for your database
const sequelize = new Sequelize(
  process.env.DB_NAME || 'profiles_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
      ssl: process.env.DB_HOST !== 'localhost' ? {
        require: true,
        rejectUnauthorized: false // For Neon.tech
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

module.exports = sequelize;