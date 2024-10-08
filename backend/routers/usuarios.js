// Importar dependencias necesarias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const { validationResult } = require('express-validator');

const { validarIdUsuario, validarActUsuario, validarUsuario, validarpathusuario } = require('../validaciones/ValidarUsuarios.js');
const { auditar, convertirMayusculas, errorHandler } = require('../funciones/funciones.js');
const { CargaArchivo, CURRENT_DIR } = require('../middleware/CargaMulter.js');
const { join } = require('path');

const routerUsuarios = express.Router();
routerUsuarios.use(express.json());
routerUsuarios.use(cors());

/**
 * Ruta para crear un nuevo usuario.
 * Se realizan varias validaciones antes de insertar el usuario en la base de datos.
 */
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
        nombre_usuario, id_sededepar, id_tipousuario, nombre, apellido, pregunta, respuesta, clave, foto_usuario, extension_telefonica, telefono, cedula, correo, frase_encriptada
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

/**
 * Ruta para modificar un usuario existente.
 * Se realizan validaciones y se actualizan los campos en la base de datos.
 */
routerUsuarios.put('/:id_usuario', CargaArchivo.single('fileUsuario'), validarIdUsuario, validarActUsuario, validarUsuario, async (req, res) => {
    const { id_usuario } = req.params;
    const {
        nombre_usuario, id_sededepar, id_tipousuario, nombre, apellido, pregunta, respuesta, clave, extension_telefonica, telefono, cedula, correo
    } = req.body;

    const queryImagenAnterior = 'SELECT foto_usuario FROM usuarios WHERE id_usuario = $1';
    const resultImagenAnterior = await pool.query(queryImagenAnterior, [id_usuario]);

    const imagenAnterior = resultImagenAnterior.rows.length > 0 ? resultImagenAnterior.rows[0].foto_usuario : null;

    const fileUsuario = req.file ? req.file.filename : null;

    const camposAmayusculas = ['nombre', 'apellido', 'pregunta'];
    const camposMayus = convertirMayusculas(camposAmayusculas, req.body);

    const operacion = req.method;
    const id_usuarioAuditoria = req.headers['id_usuario'];

    try {

        const fraseEncriptacion = crypto.randomBytes(64).toString('base64');
        const claveEncriptada = await bcrypt.hash(clave + fraseEncriptacion, 12);
        const respuestaEncriptada = await bcrypt.hash(respuesta + fraseEncriptacion, 12);

        const errores = validationResult(req);

        if (errores.isEmpty()) {
            const query = `
            UPDATE usuarios
            SET
                nombre_usuario = $1,
                id_sededepar = $2,
                id_tipousuario = $3,
                nombre = $4,
                apellido = $5,
                pregunta = $6,
                respuesta = $7,
                clave = $8,
                foto_usuario = COALESCE($9, foto_usuario),
                extension_telefonica = $10,
                telefono = $11,
                cedula = $12,
                correo = $13
            WHERE id_usuario = $14
                AND NOT borrado
                AND EXISTS (SELECT 1 FROM sedes_departamentos WHERE id_sede_departamento = $2)
                AND EXISTS (SELECT 1 FROM tipos_usuarios WHERE id_tipo_usuario = $3)
                AND NOT EXISTS (
                    SELECT 1 FROM usuarios
                    WHERE (nombre_usuario = $1 OR cedula = $12)
                    AND id_usuario <> $14
                )
            RETURNING *;
            `;

            const values = [
                nombre_usuario,
                id_sededepar,
                id_tipousuario,
                camposMayus.nombre,
                camposMayus.apellido,
                camposMayus.pregunta,
                respuestaEncriptada,
                claveEncriptada,
                fileUsuario,
                extension_telefonica,
                telefono,
                cedula,
                correo,
                id_usuario
            ];

            const actualizarUsuario = await pool.query(query, values);
            
            if (actualizarUsuario.rowCount > 0) {
                auditar(operacion, id_usuarioAuditoria);

                if (fileUsuario && imagenAnterior) {
                    const pathImagenAnterior = join(CURRENT_DIR, '../cargas', imagenAnterior);

                    fs.unlink(pathImagenAnterior, (err) => {
                        if (err) {
                            console.error('Error al eliminar la imagen anterior:', err);
                        } else {
                            console.log('Imagen anterior eliminada con éxito');
                        }
                    });
                }

                return res.status(200).json({ mensaje: 'Usuario actualizado exitosamente' });
            } else {
                if (fileUsuario) {
                    const pathImagenNueva = join(CURRENT_DIR, '../cargas', fileUsuario);
                
                    fs.unlink(pathImagenNueva, (err) => {
                        if (err) {
                            console.error('Error al eliminar la imagen nueva:', err);
                        } else {
                            console.log('Imagen nueva eliminada debido al error');
                        }
                    });
                }

                return res.status(400).json({ error: 'Error al actualizar el usuario' });
            }
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Datos incorrectos' });
        }

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

/**
 * Ruta para eliminar (marcar como borrado) un usuario.
 * No se elimina físicamente de la base de datos, sino que se marca como borrado.
 */
routerUsuarios.patch('/:id_usuario', validarIdUsuario, async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Validar que el usuario existe y no está borrado
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1 AND borrado = false', [id_usuario]);

        if (usuarioExistente.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Actualiza el usuario y marca como borrado
        const updateQuery = `
            UPDATE usuarios 
            SET borrado = true
            WHERE id_usuario = $1
            RETURNING *;
        `;

        await pool.query(updateQuery, [id_usuario]);

        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});
 
// Exportar el router para su uso en la aplicación principal
module.exports = routerUsuarios;
