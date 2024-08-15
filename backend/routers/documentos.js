// Importacion de express
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const fs = require('fs');
const { validationResult } = require('express-validator')
const { join } = require('path');
const path = require('path');
 
const routerDocumentos = express.Router();
routerDocumentos.use(express.json());
routerDocumentos.use(cors());
const { auditar, convertirMayusculas, errorHandler, obtenerFechayHora } = require('../funciones/funciones.js')
const { validarIdDocumento, validarDocumento, validarActDocumento} = require('../validaciones/ValidarDocumentos.js')

//Crear Documento

const { CargaDocumento, CURRENT_DIR } = require('../middleware/DocumentosMulter.js');

routerDocumentos.post('/', CargaDocumento.single('documento'), validarDocumento, async (req, res) => {
  
  const consulta = `
  INSERT INTO documentos (titulo, descripcion, id_usuario, hora_subida, fecha_subida, permiso, borrado) 
  VALUES ($1, $2, 1, CAST($3 as time), CAST($4 as date), $5, false) RETURNING *;
`;

try {
  const { titulo, descripcion, hora_subida, fecha_subida, permiso } = req.body;
  const operacion = req.method;
  const id_usuarioAuditoria = req.headers['id_usuario'];
  const documento = req.file.filename;

  // Construir una cadena de fecha y hora válida
  const fechaActual = obtenerFechayHora("fecha");
  const horaActual = obtenerFechayHora("hora");

  const errores = validationResult(req);

  if (errores.isEmpty()) {
    const crearDocumento = await pool.query(consulta, [
      documento, descripcion, horaActual, fechaActual, permiso
    ]);
    if (crearDocumento.rows.length > 0) {
      auditar(operacion, id_usuarioAuditoria);
      return res.status(200).json({ mensaje: 'Documento creado exitosamente' });
    }else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Error al crear el documento' });
    }
  } else {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Datos incorrectos' });
  }
} catch (error) {
  console.error(error.message);
  return res.status(400).json({ error: 'Error al crear el documento' });
}

});