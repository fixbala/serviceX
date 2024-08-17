// Importación de módulos y dependencias
const express = require('express');
const { SignJWT } = require('jose');
const bcrypt = require("bcryptjs");
const cors = require('cors');
const pool = require('../database/db.js');

// Configuración del enrutador para login
const routerLogin = express.Router();
routerLogin.use(express.json());
routerLogin.use(cors());

/**
 * Ruta para manejar el inicio de sesión de los usuarios.
 * 
 * @route POST /login
 * @param {string} nombre_usuario - Nombre de usuario del cliente.
 * @param {string} clave - Contraseña del cliente.
 * @returns {object} - Un JWT si las credenciales son válidas o un mensaje de error si no lo son.
 */
routerLogin.post('/', async (req, res) => {
    try {
        // Desestructuración de nombre de usuario y clave desde el cuerpo de la solicitud
        const { nombre_usuario, clave } = req.body;

        // Consulta para buscar el usuario en la base de datos que no esté marcado como borrado
        const query = 'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND borrado = false';
        const result = await pool.query(query, [nombre_usuario]);

        // Si el usuario no existe, devuelve un error 401
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Obtención de la información del usuario
        const user = result.rows[0];

        // Verificación de la contraseña usando bcrypt
        const contrasenaValida = await bcrypt.compare(clave + user.frase_encriptada, user.clave);

        // Si la contraseña no es válida, devuelve un error 401
        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Extracción del ID del usuario
        const idUser = user.id_usuario;

        // Construcción del JWT utilizando SignJWT
        const jwtConstructor = new SignJWT({ idUser });
        const encoder = new TextEncoder();
        const jwt = await jwtConstructor
            .setProtectedHeader({ alg: "HS256", typ: "JWT" }) // Configuración del encabezado JWT
            .setIssuedAt() // Establece el momento en que se emitió el JWT
            .setExpirationTime("1h") // Establece el tiempo de expiración a 1 hora
            .sign(encoder.encode(process.env.JWT_PRIVATE_KEY)); // Firma el JWT con la clave privada

        // Respuesta con el JWT generado y el ID del usuario
        res.status(200).json({ jwt, idUser });

    } catch (error) {
        // Manejo de errores en caso de falla en el servidor
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
 
module.exports = routerLogin;
