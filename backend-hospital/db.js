const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,

  ssl: process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1'
    ? { rejectUnauthorized: false }
    : false
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar con la base de datos:', err.stack);
  }
  console.log(`Conexión a PostgreSQL exitosa [Host: ${process.env.DB_HOST}]`)
  if (client) release();
});

pool.on('error', (err) => {
  console.error('conexion fallida', err)
});

module.exports = pool;