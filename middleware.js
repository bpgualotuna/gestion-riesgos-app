/**
 * Middleware para JSON Server
 * Agrega relaciones y funcionalidades adicionales
 */

module.exports = (req, res, next) => {
  // Agregar CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  // Continuar con la petición
  next();
};

