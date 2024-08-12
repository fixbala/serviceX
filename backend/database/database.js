require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.DB_USER,         // Usuario de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña del usuario de la base de datos
  host: process.env.DB_HOST,         // Host de la base de datos
  port: process.env.DB_PORT,         // Puerto de la base de datos
  database: process.env.DB_DATABASE, // Nombre de la base de datos
});  

module.exports = pool; // Exporta la conexión configurada
 