// Importación de módulos necesarios
const express = require('express'); // Importa el framework Express para la creación de servidores y rutas
const cors = require('cors'); // Importa el middleware CORS para permitir solicitudes desde diferentes orígenes
const pool = require('../database/db.js'); // Importa la conexión a la base de datos
const { validationResult } = require('express-validator'); // Importa express-validator para manejar validaciones
const { auditar, convertirMayusculas } = require('../funciones/funciones.js'); // Importa funciones auxiliares de otro módulo
const { validaClientes, validaidClientes } = require('../validaciones/ValidarClientes.js'); // Importa funciones de validación

// Crear un enrutador para las rutas de clientes
const routerClientes = express.Router();

// Middlewares
routerClientes.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes como JSON
routerClientes.use(cors()); // Middleware para habilitar CORS en las rutas

/**
 * POST /
 * Crea un nuevo cliente si los datos son válidos y no hay conflictos en la base de datos.
 *
 * @route POST /
 * @body {string} nombre - Nombre del cliente.
 * @body {string} ubicacion - Ubicación del cliente.
 * @body {string} telefono - Teléfono del cliente.
 * @body {string} correo - Correo electrónico del cliente.
 * @body {number} id_plan - ID del plan asociado al cliente.
 * @body {string} estado_usuario - Estado del usuario asociado al cliente.
 * @returns {Object} - Mensaje de éxito o error.
 */
routerClientes.post('/', validaClientes, async (req, res) => {
  const consulta = `
  WITH validaciones AS (
    SELECT
      EXISTS (SELECT 1 FROM planes WHERE id_plan = $5) AS existePlan,
      EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = $6) AS existeUsuario,
      NOT EXISTS (SELECT 1 FROM clientes WHERE correo = $4) AS correoNoExiste
    )
  INSERT INTO clientes (
    nombre, ubicacion, telefono, correo, id_plan, id_usuario, estado_usuario
  )
  SELECT
    $1, $2, $3, $4, $5, $6, $7
  FROM validaciones
  WHERE existePlan = true AND existeUsuario = true AND correoNoExiste
  RETURNING *;
  `;

  try {
    const { nombre, ubicacion, telefono, correo, id_plan, estado_usuario } = req.body;
    const operacion = req.method;
    const id_usuario = req.headers['id_usuario'];

    const camposAmayusculas = ['nombre'];
    const camposMayus = convertirMayusculas(camposAmayusculas, req.body);

    const errores = validationResult(req);
    if (errores.isEmpty()) {
      const crearCliente = await pool.query(consulta, [
        camposMayus.nombre, ubicacion, telefono, correo, id_plan, id_usuario, estado_usuario
      ]);

      if (crearCliente.rows.length > 0) {
        auditar(operacion, id_usuario);
        return res.status(200).json({ mensaje: 'Cliente creado exitosamente' });
      } else {
        return res.status(400).json({ error: 'Error al crear el cliente' });
      }
    } else {
      return res.status(400).json({ error: 'Datos incorrectos' });
    }
  } catch (error) {
    console.error(error.message);
  }
});

/**
 * PUT /:id_cliente
 * Actualiza los datos de un cliente existente.
 *
 * @route PUT /:id_cliente
 * @param {string} id_cliente - ID del cliente a actualizar.
 * @body {string} nombre - Nombre del cliente.
 * @body {string} ubicacion - Ubicación del cliente.
 * @body {string} telefono - Teléfono del cliente.
 * @body {string} correo - Correo electrónico del cliente.
 * @body {number} id_plan - ID del plan asociado al cliente.
 * @body {string} estado_usuario - Estado del usuario asociado al cliente.
 * @returns {Object} - Mensaje de éxito o error.
 */
routerClientes.put('/:id_cliente', validaClientes, validaidClientes, async (req, res) => {
  const query = `
    UPDATE clientes
    SET
      nombre = $1,
      ubicacion = $2,
      telefono = $3,
      correo = $4,
      id_plan = $5,
      id_usuario = $6,
      estado_usuario = $7
    WHERE id_cliente = $8
      AND NOT borrado
      AND EXISTS (SELECT 1 FROM planes WHERE id_plan = $5)
      AND EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = $6)
      AND NOT EXISTS (SELECT 1 FROM clientes WHERE correo = $4 AND id_cliente <> $8)
    RETURNING *;
  `;

  try {
    const { id_cliente } = req.params;
    const { nombre, ubicacion, telefono, correo, id_plan, estado_usuario } = req.body;
    const operacion = req.method;
    const id_usuario = req.headers['id_usuario'];

    const camposAmayusculas = ['nombre'];
    const camposMayus = convertirMayusculas(camposAmayusculas, req.body);

    const actualizarCliente = await pool.query(query, [
      camposMayus.nombre, ubicacion, telefono, correo, id_plan, id_usuario, estado_usuario, id_cliente
    ]);

    if (actualizarCliente.rowCount > 0) {
      auditar(operacion, id_usuario);
      return res.status(200).json({ mensaje: 'Cliente actualizado exitosamente' });
    } else {
      return res.status(400).json({ error: 'Error al actualizar el cliente' });
    }
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);
  }
});

/**
 * PATCH /:id_cliente
 * Marca un cliente como borrado (eliminación lógica).
 *
 * @route PATCH /:id_cliente
 * @param {string} id_cliente - ID del cliente a eliminar.
 * @returns {Object} - Mensaje de éxito o error.
 */
routerClientes.patch('/:id_cliente', validaidClientes, async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const operacion = req.method;
    const id_usuario = req.headers['id_usuario'];

    const clienteExistente = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1 AND borrado = false', [id_cliente]);

    if (clienteExistente.rowCount === 0) {
      return res.status(404).json({ error: 'Datos incorrectos' });
    }

    const updateQuery = `
      UPDATE clientes 
      SET borrado = true
      WHERE id_cliente = $1
      RETURNING *;
    `;

    await pool.query(updateQuery, [id_cliente]);

    res.json({ mensaje: 'Cliente eliminado correctamente' });
    auditar(operacion, id_usuario);
    
  } catch (error) {
    console.error('Error al marcar cliente como borrado:', error);
    res.status(500).json({ error: 'Datos incorrectos' });
  }
});

/**
 * GET /
 * Obtiene todos los clientes que no están marcados como borrados.
 *
 * @route GET /
 * @returns {Array} - Un arreglo de objetos que representan los clientes.
 */
routerClientes.get('/', async (req, res) => {
  try {
    const clientes = await pool.query('SELECT id_cliente, nombre, ubicacion, telefono, correo, id_plan, id_usuario, estado_usuario FROM clientes WHERE borrado = false ORDER BY id_cliente ASC');
    res.json(clientes.rows);
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /:id_cliente
 * Obtiene los datos de un cliente específico.
 *
 * @route GET /:id_cliente
 * @param {string} id_cliente - ID del cliente a obtener.
 * @returns {Object} - Un objeto que representa los datos del cliente.
 */
routerClientes.get('/:id_cliente', async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const clientes = await pool.query('SELECT id_cliente, nombre, ubicacion, telefono, correo, id_plan, id_usuario, estado_usuario FROM clientes WHERE id_cliente = $1 AND borrado = false', [id_cliente]);
    if (clientes.rowCount === 0) {
      return res.status(404).json({ error: 'Datos incorrectos' });
    }
    res.json(clientes.rows[0]);
  } catch (error) {
    console.log(error);
  }
});
 
// Exporta el enrutador para su uso en otras partes de la aplicación
module.exports = routerClientes;
