// Importación de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const { validaPoligono, validaIdPoligono } = require('../validaciones/ValidarPoligonos.js');
const { auditar } = require('../funciones/funciones.js');

// Configuración del enrutador para poligonos
const routerPoligonos = express.Router();
routerPoligonos.use(express.json());
routerPoligonos.use(cors());

/**
 * Ruta para crear un nuevo polígono.
 * 
 * @route POST /poligonos
 * @param {string} nombre_poligono - Nombre del polígono.
 * @param {string} id_usuario - ID del usuario que crea el polígono.
 * @returns {object} - Mensaje de éxito y el ID del nuevo polígono, o un mensaje de error en caso de falla.
 */
routerPoligonos.post('/', validaPoligono, async (req, res) => {
  const consulta = `
    WITH validaciones AS (
      SELECT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = $2) AS existeUsuario
    )
    INSERT INTO poligonos (nombre_poligono, id_usuario)
    SELECT $1, $2
    FROM validaciones
    WHERE existeUsuario = true
    RETURNING *;
  `;
  try {
    const { nombre_poligono } = req.body;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    const nuevoPoligono = await pool.query(consulta, [nombre_poligono, id_usuarioAuditoria]);

    if (nuevoPoligono.rowCount === 0) {
      return res.status(404).json({ error: 'Error al crear el Polígono' });
    }

    auditar(operacion, id_usuarioAuditoria);
    res.status(200).json({ mensaje: 'Polígono creado exitosamente', id_poligono: nuevoPoligono.rows[0].id_poligono });
  } catch (err) {
    console.error(err.message);
  }
});

/**
 * Ruta para actualizar un polígono existente.
 * 
 * @route PUT /poligonos/:id_poligono
 * @param {string} id_poligono - ID del polígono a actualizar.
 * @param {string} nombre_poligono - Nuevo nombre del polígono.
 * @returns {object} - Mensaje de éxito o error.
 */
routerPoligonos.put('/:id_poligono', validaIdPoligono, validaPoligono, async (req, res) => {
  const query = `
    UPDATE poligonos
    SET nombre_poligono = $1
    WHERE id_poligono = $2
    RETURNING *;
  `;
  const { id_poligono } = req.params;
  const { nombre_poligono } = req.body;
  const operacion = req.method;
  const id_usuarioAuditoria = req.headers['id_usuario'];

  try {
    const actualizarPoligono = await pool.query(query, [nombre_poligono, id_poligono]);

    auditar(operacion, id_usuarioAuditoria);

    if (actualizarPoligono.rowCount > 0) {
      return res.status(200).json({ mensaje: 'Polígono actualizado exitosamente' });
    }
  } catch (error) {
    console.error('Error al actualizar el polígono:', error);
    res.status(500).json({ error: 'Datos incorrectos' });
  }
});

/**
 * Ruta para obtener todos los polígonos.
 * 
 * @route GET /poligonos
 * @returns {object} - Lista de todos los polígonos o un mensaje de error si no hay registros.
 */
routerPoligonos.get('/', async (req, res) => {
  try {
    const poligonos = await pool.query('SELECT * FROM poligonos ORDER BY id_poligono ASC');

    if (poligonos.rowCount === 0) {
      return res.status(404).json({ error: 'No hay polígonos registrados' });
    }
    res.json(poligonos.rows);
  } catch (error) {
    console.log(error);
  }
});

/**
 * Ruta para obtener un polígono por su ID.
 * 
 * @route GET /poligonos/:id_poligono
 * @param {string} id_poligono - ID del polígono a obtener.
 * @returns {object} - Datos del polígono o un mensaje de error si no se encuentra.
 */
routerPoligonos.get('/:id_poligono', validaIdPoligono, async (req, res) => {
  try {
    const { id_poligono } = req.params;
    const poligono = await pool.query('SELECT * FROM poligonos WHERE id_poligono = $1', [id_poligono]);

    if (poligono.rowCount === 0) {
      return res.status(404).json({ error: 'Polígono no encontrado' });
    }
    res.json(poligono.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

/**
 * Ruta para eliminar un polígono por su ID.
 * 
 * @route DELETE /poligonos/:id_poligono
 * @param {string} id_poligono - ID del polígono a eliminar.
 * @returns {object} - Mensaje de éxito o error.
 */
routerPoligonos.delete('/:id_poligono', validaIdPoligono, async (req, res) => {
  try {
    const { id_poligono } = req.params;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    const eliminarPoligono = await pool.query('DELETE FROM poligonos WHERE id_poligono = $1', [id_poligono]);

    if (eliminarPoligono.rowCount === 0) {
      return res.status(404).json({ error: 'Datos incorrectos' });
    }

    auditar(operacion, id_usuarioAuditoria);
    res.status(200).json({ mensaje: 'Polígono eliminado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al eliminar el polígono' });
  }
});

module.exports = routerPoligonos;
  