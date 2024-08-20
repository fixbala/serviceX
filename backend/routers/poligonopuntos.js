// Importación de módulos y dependencias
const express = require('express');
const cors = require('cors');
const pool = require('../database/db.js');

// Configuración del enrutador para poligonos y puntos
const routerPoligonosPuntos = express.Router();
routerPoligonosPuntos.use(express.json());
routerPoligonosPuntos.use(cors());

/**
 * Ruta para obtener todos los polígonos y sus puntos asociados.
 * 
 * @route GET /poligonopuntos
 * @returns {object} - Una colección GeoJSON de todos los polígonos y sus puntos asociados,
 *                     o un mensaje de error en caso de falla.
 */
routerPoligonosPuntos.get('/', async (req, res) => {
  try {
    // Consulta para obtener polígonos y sus puntos asociados
    const query = `
    SELECT
      pl.id_poligono,
      pl.nombre_poligono,
      pt.id_punto,
      pt.latitud,
      pt.longitud
    FROM poligonos pl
    JOIN puntos pt ON pl.id_poligono = pt.id_poligono;
    `;

    const result = await pool.query(query);

    // Mapeo para organizar los datos de los polígonos y sus puntos
    const featuresMap = new Map();

    result.rows.forEach(row => {
      if (!featuresMap.has(row.id_poligono)) {
        featuresMap.set(row.id_poligono, {
          type: 'Feature',
          properties: {
            name: row.nombre_poligono,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [parseFloat(row.longitud), parseFloat(row.latitud)]
              ]
            ],
          },
        });
      } else {
        const existingFeature = featuresMap.get(row.id_poligono);
        existingFeature.geometry.coordinates[0].push([
          parseFloat(row.longitud),
          parseFloat(row.latitud),
        ]);
      }
    });

    // Conversión del mapa de características a un array de GeoJSON
    const featuresArray = [...featuresMap.values()];

    // Creación de la respuesta GeoJSON
    const geoJsonResponse = {
      type: "FeatureCollection",
      features: featuresArray.map(feature => {
        return {
          type: "Feature",
          properties: {
            name: feature.properties.name,
          },
          geometry: {
            coordinates: [feature.geometry.coordinates[0]],
            type: "Polygon", // Especifica que la geometría es un polígono
          },
        };
      })
    };

    // Envío de la respuesta
    res.json(geoJsonResponse);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al obtener los datos');
  }
});
  
module.exports = routerPoligonosPuntos;
