require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'corridorx_super_secret_jwt_key_2026_eureka',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dbFilePath: process.env.DB_FILE_PATH || './data/database.json'
};
