const multer = require('multer'); // Importa el módulo multer para manejar la carga de archivos
const { extname, join } = require('path'); // Importa funciones del módulo path para manejar rutas y extensiones de archivos


// Ruta del directorio actual
  const CURRENT_DIR = __dirname;
  /**
 * Ejemplo de configuración de tipos MIME permitidos:
 */
// Tipos MIME permitidos para la carga de documentos (actualmente está vacío, pero puedes habilitar los formatos comentados más adelante).
  const MIMETYPES = ['application/pdf',          // PDF
  'application/msword',       // Doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Docx
  'application/vnd.ms-powerpoint', // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-excel', // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX 
  ];
/** 
 * Configuración de Multer para la carga de documentos.
 * Define el almacenamiento en disco, el nombre de los archivos, los filtros de tipo de archivo y los límites de tamaño.
 */
const CargaDocumento = multer({
  storage: multer.diskStorage({
    destination: join(CURRENT_DIR, '../cargas'), // Define el directorio de destino para guardar los documentos cargados
    filename: (req, file, cb) => {
      const extDocumento = extname(file.originalname); // Obtiene la extensión del documento
      const nombreDocumento = file.originalname.split(extDocumento)[0] // Obtiene el nombre del documento sin la extensión
        .replace(/\s+/g, '_') // Reemplaza los espacios en blanco con guiones bajos
        .toLowerCase(); // Convierte el nombre a minúsculas

      cb(null, `${nombreDocumento}-${Date.now()}-${extDocumento}`); // Asigna el nombre final del documento con una marca de tiempo
    },
  }),
  fileFilter: (req, file, cb) => {
    if (MIMETYPES.includes(file.mimetype)) {
      cb(null, true); // Acepta el documento si el tipo MIME está permitido
    } else {
      cb(new Error('Formato del archivo no permitido'), false); // Rechaza el documento si el tipo MIME no está permitido
    }
  },
  limits: {
    fieldSize: 10000000 // Limita el tamaño del archivo a 10 MB
  }
});
 
/**
 * Exporta la configuración de Multer y el directorio actual.
 */
module.exports = { CargaDocumento, CURRENT_DIR };
