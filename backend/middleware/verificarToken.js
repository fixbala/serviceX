const { jwtVerify } = require('jose'); // Importa la función jwtVerify de la librería 'jose' para verificar tokens JWT.
const pool = require('../database/db.js'); // Importa la conexión a la base de datos desde el archivo database.js

/**
 * Middleware para verificar un token JWT en una solicitud.
 * Este middleware verifica la validez del token JWT y obtiene la información del usuario asociada.
 * Si el token es válido y el usuario existe, se agrega el usuario al objeto de solicitud (req).
 * Si el token no es válido o el usuario no existe, se responde con un estado 401 (No Autorizado).
 *
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 * @param {Function} next - La función para llamar al siguiente middleware.
 * @returns {Object} - Responde con un estado 401 si el token no es válido o si no hay token.
 */
const verificarJWT = async (req, res, next) => {

    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ mensaje: 'No hay token' });

    const token = authorization.split(' ')[1];
    
    try {
        const encoder = new TextEncoder();
        const { payload } = await jwtVerify(
            token,
            encoder.encode(process.env.JWT_PRIVATE_KEY) // Verifica el token usando la clave privada almacenada en las variables de entorno
        );

        const query = 'SELECT * FROM usuarios WHERE id_usuario = $1';
        const user = await pool.query(query, [payload.idUser]); // Busca el usuario en la base de datos usando el ID del payload del token

        if (user.rowCount === 0) return res.sendStatus(401); // Si el usuario no existe, responde con estado 401 (No Autorizado)

        delete user.rows[0].clave;   // Elimina la clave del usuario de los datos que se enviarán en la respuesta
        delete user.rows[0].respuesta; // Elimina la respuesta del usuario de los datos que se enviarán en la respuesta

        req.usuario = user.rows[0]; // Agrega el usuario al objeto de solicitud (req) para su uso en los siguientes middlewares o controladores
        next(); // Llama al siguiente middleware
    } catch (err) {
        return res.status(401).json({ mensaje: 'No Autorizado' }); // Si hay un error en la verificación del token, responde con estado 401
    }
};
 
module.exports = { verificarJWT }; // Exporta el middleware para su uso en otras partes de la aplicación
 