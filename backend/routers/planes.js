const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const routerPlanes = express.Router();
const { validaIdPlan, validarPlan } = require('../validaciones/ValidarPlanes.js');
const { validationResult } = require('express-validator')
const { auditar } = require('../funciones/funciones.js')

routerPlanes.use(express.json());
routerPlanes.use(cors());


//create 
routerPlanes.post('/', validarPlan, async (req, res) => {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }

        const { nombre_plan, descripcion, precio, estado_plan } = req.body;

        // Verificar si ya existe un plan con el mismo nombre
        const planExistente = await pool.query(
            'SELECT * FROM planes WHERE nombre_plan = $1',
            [nombre_plan]
        );

        if (planExistente.rows.length > 0) {
            return res.status(400).json({ error: 'El nombre del plan ya está en uso' });
        }

        // Insertar el nuevo plan en la base de datos
        const query = `
            INSERT INTO planes (nombre_plan, descripcion, precio, estado_plan, borrado)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const values = [nombre_plan, descripcion, precio, estado_plan, false];

        const nuevoPlan = await pool.query(query, values);
        const idPlanGenerado = nuevoPlan.rows[0].id_plan;

        return res.status(200).json({ mensaje: 'Plan creado exitosamente', id_plan: idPlanGenerado });
    } catch (error) {
        console.error('Error al crear el plan:', error.message);
        res.status(500).json({ error: 'Error al crear el plan' });
    }
}); 