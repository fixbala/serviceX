const { validationResult } = require('express-validator'); // Importa la función de validación de express-validator

/**
 * Middleware para validar los resultados de las operaciones de validación.
 * Si hay errores, devuelve una respuesta con los errores y un estado 403.
 * Si no hay errores, pasa al siguiente middleware.
 *
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 * @param {Function} next - La función para llamar al siguiente middleware.
 */
const validarResultados = (req, res, next) => {
    try {
        validationResult(req).throw(); // Lanza un error si la validación falla
        return next(); // Pasa al siguiente middleware si no hay errores
    } catch (err) {
        res.status(403); // Establece el estado de la respuesta a 403
        res.send({ errors: err.array() }); // Envía los errores de validación al cliente
    } 
} 

module.exports = { validarResultados }; // Exporta el middleware para su uso en otras partes de la aplicación
