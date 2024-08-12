const { DateTime } = require('luxon'); // Librería para manejar fechas y horas
const db = require('../database/db.js'); // Conexión a la base de datos

// Obtiene la fecha o la hora actual en la zona horaria de Armenia/Quindio
function obtenerFechayHora(seleccion) {
  const zonaHoraria = 'Armenia/Quindio';
  const fechaOhora = DateTime.now().setZone(zonaHoraria);
 
  if (seleccion === "fecha") {
    return fechaOhora.toFormat('yyyy-MM-dd'); // Retorna la fecha en formato 'yyyy-MM-dd'
  } else if (seleccion === "hora") {
    return fechaOhora.toFormat('HH:mm:ss'); // Retorna la hora en formato 'HH:mm:ss'
  } else {
    return "Lo que intenta seleccionar no existe"; // Mensaje de error si la selección no es válida
  }
} 

// Registra una operación en la tabla de auditorías
function auditar(operacion, id_usuario) {
  try {
    const fechaActual = obtenerFechayHora("fecha");
    const horaActual = obtenerFechayHora("hora");

    db.query("INSERT INTO auditorias (operacion,id_usuario,fecha,hora) VALUES (UPPER($1),$2,CAST($3 as date),CAST($4 as time))",
      [operacion, id_usuario, fechaActual, horaActual]);
  } catch (err) {
    console.error(err.message); // Muestra el error en la consola si ocurre una excepción
  }
}

// Convierte campos específicos de un objeto a mayúsculas
function convertirMayusculas(campos, datos) {
  const datosMayusculas = { ...datos };

  campos.forEach(campo => {
    if (datosMayusculas[campo]) {
      datosMayusculas[campo] = datosMayusculas[campo].toUpperCase(); // Convierte a mayúsculas si el campo existe
    }
  });

  return datosMayusculas; // Retorna el objeto modificado
}

// Maneja errores y envía una respuesta adecuada al cliente
function errorHandler(err, req, res, next) {
  console.error(err.stack); // Muestra la pila de errores en la consola

  if (err instanceof Error && err.message) {
    res.status(400).json({ error: err.message }); // Responde con un mensaje de error específico
  } else {
    res.status(500).json({ error: 'Ha ocurrido un error inesperado.' }); // Responde con un mensaje genérico
  }
}

module.exports = { obtenerFechayHora, auditar, convertirMayusculas, errorHandler };
