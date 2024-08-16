// Importacion de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const fs = require('fs');
const { validationResult } = require('express-validator');
const { join } = require('path');
const path = require('path');

// Configuración del enrutador para documentos
const routerDocumentos = express.Router();
routerDocumentos.use(express.json());
routerDocumentos.use(cors());

const { auditar, convertirMayusculas, errorHandler, obtenerFechayHora } = require('../funciones/funciones.js');
const { validarIdDocumento, validarDocumento, validarActDocumento } = require('../validaciones/ValidarDocumentos.js');

// Middleware para cargar documentos
const { CargaDocumento, CURRENT_DIR } = require('../middleware/DocumentosMulter.js');

// Ruta para crear un nuevo documento
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

    // Obtener la fecha y hora actual
    const fechaActual = obtenerFechayHora("fecha");
    const horaActual = obtenerFechayHora("hora");

    // Validar errores
    const errores = validationResult(req);
    if (errores.isEmpty()) {
      const crearDocumento = await pool.query(consulta, [
        documento, descripcion, horaActual, fechaActual, permiso
      ]);

      if (crearDocumento.rows.length > 0) {
        auditar(operacion, id_usuarioAuditoria);
        return res.status(200).json({ mensaje: 'Documento creado exitosamente' });
      } else {
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

// Ruta para modificar un documento existente usando PUT
routerDocumentos.put('/:id_documento', CargaDocumento.single('documento'), validarIdDocumento, validarActDocumento, validarDocumento, async (req, res) => {
  const { id_documento } = req.params;
  const { descripcion, fecha_subida, hora_subida, permiso } = req.body;

  // Obtener el nombre actual del documento en la base de datos
  const queryNombreDocumento = 'SELECT titulo FROM documentos WHERE id_documento = $1';
  const resultNombreDocumento = await pool.query(queryNombreDocumento, [id_documento]);
  const nombreDocumentoActual = resultNombreDocumento.rows.length > 0 ? resultNombreDocumento.rows[0].titulo : null;

  const documento = req.file ? req.file.filename : null;

  try {
    const errores = validationResult(req);
    if (errores.isEmpty()) {
      const query = `
        UPDATE documentos
        SET
          titulo = $1,
          descripcion = $2,
          permiso = $3,
          fecha_subida = $4, 
          hora_subida = $5 
        WHERE id_documento = $6
          AND NOT borrado
          AND EXISTS (SELECT 1 FROM documentos WHERE id_documento = $6)
        RETURNING *;
      `;

      const fechaActual = obtenerFechayHora("fecha");
      const horaActual = obtenerFechayHora("hora");

      const values = [
        documento || nombreDocumentoActual, 
        descripcion,
        permiso,
        fechaActual,
        horaActual,
        id_documento
      ];

      const actualizarDocumento = await pool.query(query, values);

      if (actualizarDocumento.rowCount > 0) {
        if (documento && nombreDocumentoActual) {
          const pathDocAnterior = join(__dirname, '../cargas', nombreDocumentoActual);

          fs.unlink(pathDocAnterior, (err) => {
            if (err) {
              console.error('Error al eliminar documento anterior:', err);
            } else {
              console.log('Documento anterior eliminado con éxito');
            }
          });
        }

        return res.status(200).json({ mensaje: 'Documento actualizado exitosamente' });
      } else {
        if (documento) {
          const pathDocNuevo = join(__dirname, '../cargas', documento);

          fs.unlink(pathDocNuevo, (err) => {
            if (err) {
              console.error('Error al eliminar el documento nuevo:', err);
            } else {
              console.log('Documento eliminado debido al error');
            }
          });
        }

        return res.status(400).json({ error: 'Error al actualizar el documento' });
      }
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Datos incorrectos' });
    }
  } catch (error) {
    console.error('Error al actualizar el documento:', error);
    res.status(500).json({ error: 'Error al actualizar el documento' });
  }
});

// Ruta para modificar parcialmente un documento usando PATCH
routerDocumentos.patch('/edit/:id_documento', validarIdDocumento, validarActDocumento, validarDocumento, async (req, res) => {
  const { id_documento } = req.params;
  const { titulo, descripcion, fecha_subida, hora_subida, permiso } = req.body;

  try {
    const errores = validationResult(req);
    if (errores.isEmpty()) {
      const queryNombreDocumento = 'SELECT titulo FROM documentos WHERE id_documento = $1';
      const resultNombreDocumento = await pool.query(queryNombreDocumento, [id_documento]);
      const nombreDocumentoActual = resultNombreDocumento.rows.length > 0 ? resultNombreDocumento.rows[0].titulo : null;

      if (!nombreDocumentoActual) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      let nuevoNombreDocumento = nombreDocumentoActual;
      if (nombreDocumentoActual !== titulo) {
        const extDocumento = path.extname(nombreDocumentoActual);
        nuevoNombreDocumento = `${titulo}-${Date.now()}${extDocumento}`;
        const pathDocumentoActual = path.join(__dirname, '../cargas', nombreDocumentoActual);
        const pathNuevoDocumento = path.join(__dirname, '../cargas', nuevoNombreDocumento);
        fs.renameSync(pathDocumentoActual, pathNuevoDocumento);
      }

      const query = `
        UPDATE documentos
        SET
          titulo = $1,
          descripcion = $2,
          permiso = $3,
          fecha_subida = $4,
          hora_subida = $5
        WHERE id_documento = $6
          AND NOT borrado
          AND EXISTS (SELECT 1 FROM documentos WHERE id_documento = $6)
        RETURNING *;
      `;

      const fechaActual = obtenerFechayHora("fecha");
      const horaActual = obtenerFechayHora("hora");

      const values = [
        nuevoNombreDocumento,
        descripcion,
        permiso,
        fechaActual,
        horaActual,
        id_documento,
      ];

      const actualizarDocumento = await pool.query(query, values);

      if (actualizarDocumento.rowCount > 0) {
        return res.status(200).json({ mensaje: 'Documento actualizado exitosamente' });
      } else {
        return res.status(400).json({ error: 'Error al actualizar el documento' });
      }
    } else {
      return res.status(400).json({ error: 'Datos incorrectos' });
    }
  } catch (error) {
    console.error('Error al actualizar el documento:', error);
    res.status(500).json({ error: 'Error al actualizar el documento' });
  }
});

// Ruta para obtener un documento específico
routerDocumentos.get('/:id_documento', validarIdDocumento, validarDocumento, async (req, res) => {
  try {
    const { id_documento } = req.params;
    const documentos = await pool.query('SELECT id_documento, titulo, descripcion, id_usuario, hora_subida, fecha_subida FROM documentos WHERE (id_documento = $1) AND borrado = false', [id_documento]);
    if (documentos.rowCount === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    res.json(documentos.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

// Ruta para obtener todos los documentos
routerDocumentos.get('/', async (req, res) => {
  try {
    const documentos = await pool.query('SELECT id_documento, titulo, descripcion, id_usuario, hora_subida, fecha_subida, permiso FROM documentos WHERE borrado = false ORDER BY id_documento ASC');

    const documentosFormateados = documentos.rows.map((documento) => ({
      ...documento,
      fecha_subida: documento.fecha_subida.toISOString().split('T')[0], // Formatea a "AAAA-MM-DD"
    }));

    res.json(documentosFormateados);
  } catch (error) {
    console.log(error);
  }
}); 

module.exports = routerDocumentos;
