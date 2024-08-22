// Importación de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');

const routerSedes = express.Router();

routerSedes.use(express.json());
routerSedes.use(cors());

/**
 * Ruta para obtener todas las sedes.
 * 
 * @route GET /sedes
 * @returns {object[]} - Lista de todas las sedes que no han sido marcadas como borradas.
 */
routerSedes.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT nombre_sede, latitud, longitud, ip FROM sedes WHERE borrado is not true ORDER BY nombre_sede");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Ha ocurrido un error" });
  }
});

/**
 * Ruta para obtener una sede específica por su ID.
 * 
 * @route GET /sedes/:id_sede
 * @param {number} id_sede - ID de la sede a obtener.
 * @returns {object} - Información de la sede solicitada, o un mensaje de error si no se encuentra.
 */
routerSedes.get('/:id_sede', async (req, res) => {
  try {
    const { id_sede } = req.params;
    const sedes = await pool.query('SELECT nombre_sede, latitud, longitud, ip FROM sedes WHERE borrado is not true AND id_sede = $1', [id_sede]);

    if (sedes.rowCount === 0) {
      return res.status(404).json({ error: 'La sede no fue encontrada' });
    }
    res.json(sedes.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

module.exports = routerSedes;
  