// Importacion de express
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');

const { validaPoligono, validaIdPoligono} = require('../validaciones/ValidarPoligonos.js');
const {auditar} = require('../funciones/funciones.js')


const routerPoligonos= express.Router();

routerPoligonos.use(express.json());
routerPoligonos.use(cors());



//create
routerPoligonos.post('/', validaPoligono, async(req, res) => {
  const consulta = `
  WITH validaciones AS (
    SELECT
      EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = $2) AS existeUsuario)
      INSERT INTO poligonos (nombre_poligono, id_usuario)
      SELECT $1, $2
      FROM validaciones
  WHERE existeUsuario = true
  RETURNING *;`
    try {
        
      const {nombre_poligono} = req.body;

      // parametros para auditoria
      const  operacion  = req.method;
      const  id_usuarioAuditoria =req.headers['id_usuario'];

        const nuevoPoligono = await pool.query(consulta, [nombre_poligono, id_usuarioAuditoria]);

        if (nuevoPoligono.rowCount === 0) {
          return res.status(404).json({ error: 'Error al crear el Poligono' });
        }
      
      auditar(operacion,id_usuarioAuditoria);

      res.status(200).json({ mensaje: 'Poligono creado exitosamente', id_poligono: nuevoPoligono.rows[0].id_poligono });
    } catch (err) {
        console.error(err.message);
    }
})

//update
/** 
routerPoligonos.put('/:id_poligono', validaIdPoligono,validaPoligono, async (req, res) => {
  const query = `
  UPDATE poligonos
    SET
      nombre_poligono = $1
      WHERE id_poligono = $2
      RETURNING *;`

 

  const { id_poligono } = req.params;
  const { nombre_poligono } = req.body;
*/