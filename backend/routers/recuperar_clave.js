// Importación de módulos necesarios
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');  // Configuración de la base de datos
const routerRecuperarClave = express.Router();
const bcrypt = require('bcryptjs');

// Middleware para parsear JSON y permitir solicitudes CORS
routerRecuperarClave.use(express.json());
routerRecuperarClave.use(cors());

/**
 * PUT /
 * Ruta para actualizar la contraseña de un usuario.
 * 
 * Request Body:
 * - usuario: Nombre del usuario.
 * - nueva_clave: Nueva contraseña a establecer.
 * - respuesta: Respuesta a la pregunta de seguridad.
 * 
 * Respuestas:
 * - 200: Clave actualizada correctamente.
 * - 404: No se encontró el usuario.
 * - 401: Respuesta incorrecta a la pregunta de seguridad.
 * - 500: Error interno del servidor.
 */
routerRecuperarClave.put('/', async (req, res) => {
  try {
    const { usuario, nueva_clave, respuesta } = req.body;

    // Consulta para verificar la existencia del usuario y obtener su respuesta de seguridad
    const selectQuery = 'SELECT respuesta, clave, frase_encriptada FROM usuarios WHERE "nombre_usuario" = $1';
    const selectValues = [usuario];
    const result = await pool.query(selectQuery, selectValues);

    // Verificación de que el usuario existe
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el usuario' });
    }

    const user = result.rows[0];
    const frase_encriptada = user.frase_encriptada;

    // Encriptar la nueva clave con la frase encriptada del usuario
    const cadenaEncriptada = await bcrypt.hash(nueva_clave + frase_encriptada, 12);

    // Validar la respuesta de seguridad del usuario
    const respuestaValida = await bcrypt.compare(respuesta + frase_encriptada, user.respuesta);
    if (!respuestaValida) {
      return res.status(401).json({ error: 'Respuesta incorrecta' });
    }

    // Actualizar la clave del usuario en la base de datos
    const updateQuery = 'UPDATE usuarios SET clave = $1 WHERE "nombre_usuario" = $2';
    const updateValues = [cadenaEncriptada, usuario];
    const updateResult = await pool.query(updateQuery, updateValues);

    // Verificación de que la actualización se realizó correctamente
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró el usuario' });
    }

    // Respuesta exitosa
    res.json({ mensaje: 'Clave actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ha ocurrido un error' });
  }
});

/**
 * GET /
 * Ruta para obtener la pregunta de seguridad de un usuario.
 * 
 * Query Parameters:
 * - nombreUsuario: Nombre del usuario.
 * 
 * Respuestas:
 * - 200: Devuelve la pregunta de seguridad del usuario.
 * - 404: No se encontró el usuario.
 * - 500: Error interno del servidor.
 */
routerRecuperarClave.get('/', async (req, res) => {
  try {
    const { nombreUsuario } = req.query;

    // Consulta para obtener la pregunta de seguridad del usuario
    const selectQuery = 'SELECT pregunta FROM usuarios WHERE "nombre_usuario" = $1';
    const selectValues = [nombreUsuario];
    const result = await pool.query(selectQuery, selectValues);

    // Verificación de que el usuario existe
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el usuario' });
    }

    const preguntaUsuario = result.rows[0].pregunta;

    // Respuesta con la pregunta de seguridad
    res.json({ pregunta: preguntaUsuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ha ocurrido un error' });
  }
});

// Exportación del enrutador para usarlo en otros módulos
module.exports = routerRecuperarClave;
  