// Importación de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');

const routerSedesDepartamento = express.Router();

routerSedesDepartamento.use(express.json());
routerSedesDepartamento.use(cors());

/**
 * Ruta para obtener la lista de sedes junto con sus departamentos asociados.
 * 
 * @route GET /sedesdepartamentos
 * @returns {object[]} - Lista de todas las sedes con sus departamentos, incluyendo el ID y el nombre compuesto por departamento y sede.
 */
routerSedesDepartamento.get('/', async (req, res) => {
    // Consulta SQL para obtener los datos de sedes y departamentos
    const consulta = `
    SELECT sd.id_sede_departamento, CONCAT(d.nombre_departamento, '-', s.nombre_sede) AS Sede_Departamento
    FROM sedes_departamentos sd
    JOIN departamentos d ON sd.id_departamento = d.id_departamento
    JOIN sedes s ON sd.id_sede = s.id_sede;
    `;
    
    try {
        const obtenerSedesDepartamentos = await pool.query(consulta);
        res.json(obtenerSedesDepartamentos.rows);
    } catch (error) {
        res.status(500).json({ message: "Ha ocurrido un error" });
    }
});

module.exports = routerSedesDepartamento;
 