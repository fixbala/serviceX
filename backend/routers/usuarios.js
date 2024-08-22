// Dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const { validationResult } = require('express-validator')

const { validarIdUsuario, validarActUsuario, validarUsuario, validarpathusuario } = require('../validaciones/ValidarUsuarios.js')
const { auditar, convertirMayusculas, errorHandler } = require('../funciones/funciones.js')
const { CargaArchivo, CURRENT_DIR } = require('../middleware/CargaMulter.js')
const { join } = require('path');

const routerUsuarios = express.Router();
routerUsuarios.use(express.json());
routerUsuarios.use(cors());

/// Crear Usuario

routerUsuarios.post('/', CargaArchivo.single('fileUsuario'), validarUsuario, async (req, res) => {

  const consulta = `
  WITH validaciones AS (
    SELECT
      EXISTS (SELECT 1 FROM sedes_departamentos WHERE id_sede_departamento = $2) AS existeSedeDepartamento,
      EXISTS (SELECT 1 FROM tipos_usuarios WHERE id_tipo_usuario = $3) AS existeTipoUsuario,
      NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre_usuario = $1) AS nombreUsuarioNoExiste,
      NOT EXISTS (SELECT 1 FROM usuarios WHERE cedula = $12) AS cedulaUsuarioNoExiste
  )
  INSERT INTO usuarios (
    nombre_usuario, id_sededepar, id_tipousuario, nombre, apellido, pregunta, respuesta, clave, foto_usuario, extension_telefonica, telefono, cedula, correo,frase_encriptada
  )
  SELECT
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
  FROM validaciones
  WHERE existeSedeDepartamento = true AND existeTipoUsuario = true AND nombreUsuarioNoExiste AND cedulaUsuarioNoExiste
  RETURNING *;
`;

  try {

    const { nombre_usuario, id_sededepar, id_tipousuario, nombre, apellido, pregunta, respuesta, clave, extension_telefonica, telefono, cedula, correo } = req.body;
    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];
    const imagenUsuario = req.file.filename;

    const camposAmayusculas = ['nombre', 'apellido', 'pregunta'];
    const camposMayus = convertirMayusculas(camposAmayusculas, req.body);

    const fraseEncriptacion = crypto.randomBytes(64).toString('base64');
    const claveSegura = await bcrypt.hash(clave + fraseEncriptacion, 12);
    const respuestaSegura = await bcrypt.hash(respuesta + fraseEncriptacion, 12);

    const errores = validationResult(req);
    
    if (errores.isEmpty()) {
      const crearUsuario = await pool.query(consulta, [
        nombre_usuario, id_sededepar, id_tipousuario, camposMayus.nombre, camposMayus.apellido,
        camposMayus.pregunta, respuestaSegura, claveSegura, imagenUsuario, extension_telefonica,
        telefono, cedula, correo, fraseEncriptacion
      ]);
      if (crearUsuario.rows.length > 0) {
        auditar(operacion, id_usuarioAuditoria);
        return res.status(200).json({ mensaje: 'Usuario creado exitosamente' });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Error al crear el usuario' });
      }
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Datos incorrectos' });
    }

  } catch (error) {
    console.error(error.message);
  }
}); 
