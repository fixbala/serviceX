// Importación de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const { validaPuntos, validaidPuntos } = require('../validaciones/ValidarPuntos.js');
const { auditar } = require('../funciones/funciones.js');

const routerPuntos = express.Router();
routerPuntos.use(express.json());
routerPuntos.use(cors());

/**
 * Ruta para crear un nuevo punto en un polígono.
 * 
 * @route POST /puntos
 * @param {number} id_poligono - ID del polígono al que pertenece el punto.
 * @param {number} latitud - Latitud del punto.
 * @param {number} longitud - Longitud del punto.
 * @returns {object} - Mensaje de éxito y el ID del nuevo punto, o un mensaje de error en caso de falla.
 */
routerPuntos.post('/', validaPuntos, async (req, res) => {
  try {
    const { id_poligono, latitud, longitud } = req.body;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    // Validación para asegurar que no exista un punto con la misma latitud y longitud en el polígono
    const existenciasPuntos = await pool.query("SELECT id_punto FROM puntos WHERE id_poligono = $1 AND latitud = $2 AND longitud = $3",
      [id_poligono, latitud, longitud]);

    if (existenciasPuntos.rows.length > 0) {
      return res.status(400).send({ error: "Ya existe este punto en el polígono" });
    }

    // Validación para asegurar que el polígono existe
    const existePoligono = await pool.query("SELECT id_poligono FROM poligonos WHERE id_poligono = $1", [id_poligono]);
    if (existePoligono.rowCount === 0) {
      return res.status(404).json({ error: 'Polígono no encontrado' });
    }

    // Inserción del nuevo punto en la base de datos
    const nuevoPunto = await pool.query('INSERT INTO puntos (id_poligono, latitud, longitud) VALUES($1, $2, $3) RETURNING id_punto', [id_poligono, latitud, longitud]);
    const idPuntoGenerado = nuevoPunto.rows[0].id_punto;

    auditar(operacion, id_usuarioAuditoria);

    return res.status(200).json({ mensaje: 'Punto creado exitosamente', id_punto: idPuntoGenerado });
  } catch (err) {
    console.error(err.message);
  }
});

/**
 * Ruta para actualizar un punto existente.
 * 
 * @route PUT /puntos/:id_punto
 * @param {number} id_punto - ID del punto a actualizar.
 * @param {number} id_poligono - Nuevo ID del polígono al que pertenece el punto.
 * @param {number} latitud - Nueva latitud del punto.
 * @param {number} longitud - Nueva longitud del punto.
 * @returns {object} - Mensaje de éxito o error.
 */
routerPuntos.put('/:id_punto', validaPuntos, async (req, res) => {
  try {
    const { id_punto } = req.params;
    const { id_poligono, latitud, longitud } = req.body;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    // Validación para asegurar que el punto existe
    const buscarIdPunto = await pool.query("SELECT id_punto FROM puntos WHERE id_punto = $1", [id_punto]);
    if (buscarIdPunto.rowCount === 0) {
      return res.status(404).json({ error: 'Punto no encontrado' });
    }

    // Validación para asegurar que el polígono existe
    const buscarIdPoligono = await pool.query("SELECT id_poligono FROM poligonos WHERE id_poligono = $1", [id_poligono]);
    if (buscarIdPoligono.rowCount === 0) {
      return res.status(404).json({ error: 'Polígono no encontrado' });
    }

    // Actualización del punto en la base de datos
    const modificarPunto = await pool.query('UPDATE puntos SET id_poligono = $1, latitud = $2, longitud = $3 WHERE id_punto = $4', 
                                            [id_poligono, latitud, longitud, id_punto]);

    auditar(operacion, id_usuarioAuditoria);

    res.status(200).json({ mensaje: 'Punto modificado exitosamente' });
  } catch (err) {
    console.error(err.message);
  }
});

/**
 * Ruta para eliminar un punto por su ID.
 * 
 * @route DELETE /puntos/:id_punto
 * @param {number} id_punto - ID del punto a eliminar.
 * @returns {object} - Mensaje de éxito o error.
 */
routerPuntos.delete('/:id_punto', validaidPuntos, async (req, res) => {
  try {
    const { id_punto } = req.params;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    // Eliminación del punto en la base de datos
    const borrarPunto = await pool.query('DELETE FROM puntos WHERE id_punto = $1', [id_punto]);

    auditar(operacion, id_usuarioAuditoria);

    if (borrarPunto.rowCount === 0) {
      return res.status(404).json({ error: 'Punto no encontrado' });
    }
    res.json('El punto fue borrado');
  } catch (err) {
    console.error(err.message);
  }
});

/**
 * Ruta para obtener todos los puntos ordenados por ID.
 * 
 * @route GET /puntos
 * @returns {object} - Lista de todos los puntos.
 */
routerPuntos.get('/', async (req, res) => {
  try {
    const puntos = await pool.query('SELECT * FROM puntos ORDER BY id_punto ASC');
    res.json(puntos.rows);
  } catch (error) {
    console.log(error);
  }
});
  
module.exports = routerPuntos;
