// Importación de módulos necesarios
const express = require('express'); // Importa el framework Express para la creación de servidores y rutas
const cors = require('cors'); // Importa el middleware CORS para permitir solicitudes desde diferentes orígenes
const pool = require('../database/db.js'); // Importa la conexión a la base de datos desde el archivo database.js

// Crea un enrutador para las rutas de auditoría
const routerAuditoria = express.Router();

// Middlewares
routerAuditoria.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes como JSON
routerAuditoria.use(cors()); // Middleware para habilitar CORS en las rutas

/**
 * GET /
 * Obtiene todos los registros de auditoría, ordenados por fecha y hora descendente.
 *
 * @route GET /
 * @returns {Array} - Un arreglo de objetos que representan los registros de auditoría.
 * @throws {Error} - Si ocurre un error en la consulta, responde con un estado 500 y un mensaje de error.
 */
routerAuditoria.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM auditorias ORDER BY fecha DESC, hora DESC"); // Consulta todos los registros de auditoría ordenados por fecha y hora
    res.json(result.rows); // Responde con los registros obtenidos en formato JSON
  } catch (error) {
    res.status(500).json({ message: "Ha ocurrido un error" }); // Responde con un estado 500 y un mensaje de error si ocurre una excepción
  }
});

/**
 * GET /:id_usuario
 * Obtiene todos los registros de auditoría para un usuario específico, identificado por su ID.
 *
 * @route GET /:id_usuario
 * @param {string} id_usuario - El ID del usuario cuyos registros de auditoría se desean obtener.
 * @returns {Array} - Un arreglo de objetos que representan los registros de auditoría del usuario.
 * @throws {Error} - Si ocurre un error en la consulta, responde con un estado 500 y un mensaje de error.
 */
routerAuditoria.get('/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params; // Extrae el ID del usuario de los parámetros de la solicitud
    const result = await pool.query('SELECT * FROM auditorias WHERE id_usuario = $1', [id_usuario]); // Consulta los registros de auditoría del usuario
    res.json(result.rows); // Responde con los registros obtenidos en formato JSON
  } catch (error) {
    res.status(500).json({ message: "Ha ocurrido un error" }); // Responde con un estado 500 y un mensaje de error si ocurre una excepción
  }
});
 
// Exporta el enrutador para su uso en otras partes de la aplicación
module.exports = routerAuditoria;
