// FASE 2/backend/src/controllers/contratos/contratoController.js
const contratoService = require('../../services/contratos/contratoService');

const crearContrato = async (req, res) => {
  try {
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    // numero_contrato es opcional porque se genera automáticamente
    const camposObligatorios = ['cliente_id', 'fecha_inicio', 'fecha_fin', 'limite_credito', 'plazo_pago'];
    for (const campo of camposObligatorios) {
      if (!datos[campo]) return res.status(400).json({ ok: false, mensaje: `El campo ${campo} es obligatorio` });
    }

    const contrato = await contratoService.crearContrato(datos, usuario_ejecutor, ip);
    res.status(201).json({ ok: true, mensaje: 'Contrato creado correctamente', data: contrato });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al crear contrato' });
  }
};

const obtenerProxNumeroContrato = async (req, res) => {
  try {
    const resultado = await contratoService.obtenerProxNumeroContrato();
    res.status(200).json({ ok: true, data: resultado });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener número de contrato' });
  }
};

const obtenerContrato = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user;
    
    const contrato = await contratoService.obtenerContrato(Number(id));
    
    // Si es cliente, solo puede ver sus propios contratos
    // Pero en lugar de error, simplemente retornar null (no mostrar mensaje)
    if (usuario.role === 'cliente' && contrato.cliente_id !== usuario.id) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'Contrato no encontrado' 
      });
    }
    
    res.status(200).json({ ok: true, data: contrato });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener contrato' });
  }
};

// backend/src/controllers/contratos/contratoController.js
const listarContratosPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    console.log('[contratoController] listarContratosPorCliente - cliente_id:', cliente_id);
    console.log('[contratoController] listarContratosPorCliente - tipo:', typeof cliente_id);
    
    const contratos = await contratoService.listarContratosPorCliente(Number(cliente_id));
    
    console.log('[contratoController] Contratos encontrados:', contratos);
    console.log('[contratoController] Cantidad de contratos:', contratos.length);
    
    res.status(200).json({ ok: true, data: contratos });
  } catch (error) {
    console.error('[contratoController] Error en listarContratosPorCliente:', error);
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al listar contratos' });
  }
};


// NUEVA FUNCIÓN
const listarTodosContratos = async (req, res) => {
  try {
    const { limit, estado } = req.query;
    const contratos = await contratoService.listarTodosContratos({ limit, estado });
    res.status(200).json({ ok: true, data: contratos });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al listar contratos' });
  }
};

const modificarContrato = async (req, res) => {
  try {
    const { id }          = req.params;
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    const contratoActualizado = await contratoService.modificarContrato(Number(id), datos, usuario_ejecutor, ip);
    res.status(200).json({ ok: true, mensaje: 'Contrato actualizado correctamente', data: contratoActualizado });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al modificar contrato' });
  }
};

const validarCliente = async (req, res) => {
  try {
    const { cliente_id }                   = req.params;
    const { origen, destino, tipo_unidad } = req.query;

    const resultado = await contratoService.validarCliente(Number(cliente_id), origen, destino, tipo_unidad);
    res.status(200).json({ ok: true, data: resultado });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al validar cliente' });
  }
};

const agregarDescuento = async (req, res) => {
  try {
    const { id }          = req.params;
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    // Validaciones básicas
    if (!datos.tipo_unidad || datos.porcentaje_descuento === undefined || datos.porcentaje_descuento === null) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos tipo_unidad y porcentaje_descuento son obligatorios' });
    }

    // Validar que porcentaje_descuento sea un número
    const porcentaje = Number(datos.porcentaje_descuento);
    if (isNaN(porcentaje)) {
      return res.status(400).json({ ok: false, mensaje: 'El porcentaje_descuento debe ser un número válido' });
    }

    const descuento = await contratoService.agregarDescuento(Number(id), datos, usuario_ejecutor, ip);
    res.status(201).json({ ok: true, mensaje: 'Descuento agregado correctamente', data: descuento });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al agregar descuento' });
  }
};

const agregarRuta = async (req, res) => {
  try {
    const { id }          = req.params;
    const datos           = req.body;
    const usuario_ejecutor = req.user ? Number(req.user.sub) : null;
    const ip              = req.ip;

    if (!datos.origen || !datos.destino) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos origen y destino son obligatorios' });
    }

    const ruta = await contratoService.agregarRuta(Number(id), datos, usuario_ejecutor, ip);
    res.status(201).json({ ok: true, mensaje: 'Ruta autorizada agregada correctamente', data: ruta });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al agregar ruta' });
  }
};

/**
 * GET /api/contratos/estadisticas/dashboard
 * @description Obtiene estadísticas del dashboard logístico
 */
const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const stats = await contratoService.obtenerEstadisticasDashboard();
    res.status(200).json({ ok: true, data: stats });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener estadísticas' });
  }
};

module.exports = {
  crearContrato,
  obtenerContrato,
  obtenerProxNumeroContrato,
  listarContratosPorCliente,
  listarTodosContratos,  
  modificarContrato,
  validarCliente,
  agregarDescuento,
  agregarRuta,
  obtenerEstadisticasDashboard
};