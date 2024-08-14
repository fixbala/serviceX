const multer = require('multer'); // Importa el módulo multer para manejar la carga de archivos
const { extname, join } = require('path'); // Importa funciones del módulo path para manejar rutas y extensiones de archivos

// Ruta del directorio actual
const CURRENT_DIR = __dirname;

// Tipos MIME permitidos para la carga de archivos
const MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Configuración de Multer para la carga de archivos.
 * Define el almacenamiento en disco, el nombre de los archivos, los filtros de tipo de archivo y los límites de tamaño.
 */
const CargaArchivo = multer({
  storage: multer.diskStorage({ 
    destination: join(CURRENT_DIR, '../cargas'), // Define el directorio de destino para guardar los archivos cargados
    filename: (req, file, cb) => {
      const extArchivo = extname(file.originalname); // Obtiene la extensión del archivo
      const nombreArchivo = file.originalname.split(extArchivo)[0] // Obtiene el nombre del archivo sin la extensión
        .replace(/\s+/g, '_') // Reemplaza los espacios en blanco con guiones bajos
        .toLowerCase(); // Convierte el nombre a minúsculas

      cb(null, `${nombreArchivo}-${Date.now()}-${extArchivo}`); // Asigna el nombre final del archivo con una marca de tiempo
    },
  }),
  fileFilter: (req, file, cb) => {
    if (MIMETYPES.includes(file.mimetype)) {
      cb(null, true); // Acepta el archivo si el tipo MIME está permitido
    } else {
      cb(new Error('Tipo de archivo no permitido'), false); // Rechaza el archivo si el tipo MIME no está permitido
    }
  },
  limits: {
    fieldSize: 10000000 // Limita el tamaño del archivo a 10 MB
  }
});

/**
 * Exporta la configuración de Multer y el directorio actual.
 */
module.exports = { CargaArchivo, CURRENT_DIR };
