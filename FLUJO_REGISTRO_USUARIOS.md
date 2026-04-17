# 📋 Flujo de Registro de Usuarios - LogiTrans

## Visión General
El sistema implementa un flujo de registro de usuarios con arquitectura **3-capas** (frontend → backend):
- **Frontend**: Captura de datos y validación básica
- **Backend**: Validación, procesamiento y persistencia en base de datos

---

## 🏗️ ESTRUCTURA DEL BACKEND (FASE 3/backend/src)

### 1. **Controlador - `controllers/usuarios/usuarioController.js`**
**Función principal:** `crearCliente()`
- Ubicación: [src/controllers/usuarios/usuarioController.js](../../FASE%203/backend/src/controllers/usuarios/usuarioController.js)
- **Responsabilidades:**
  - Recibe datos del formulario de registro (nombre, email, nit, teléfono, tipo_usuario, estado, password)
  - Valida que la contraseña esté presente
  - **Hash de contraseña** usando `bcrypt` (10 salt rounds)
  - Llama al servicio `usuarioService.crearCliente()`
  - Retorna respuesta HTTP 201 con datos del usuario creado

**Código clave:**
```javascript
const crearCliente = async (req, res) => {
  const { nombre, email, nit, telefono, tipo_usuario, estado, password } = req.body;
  // Validación de password
  // Hash con bcrypt
  // Llamada a servicio
  // Respuesta 201 con datos del usuario
}
```

---

### 2. **Modelo - `models/usuarios/Usuario.js`**
**Funciones relevantes:**
- Ubicación: [src/models/usuarios/Usuario.js](../../FASE%203/backend/src/models/usuarios/Usuario.js)
- **Funciones principales:**
  - `buscarPorId()` - Obtiene usuario por ID
  - `listarUsuarios()` - Lista usuarios con filtros (tipo, estado, nombre)
  - `actualizarUsuario()` - Actualiza datos del usuario
  - `cambiarEstado()` - Cambia estado de usuario (ACTIVO, INACTIVO, SUSPENDIDO, etc.)

**Estructura de tabla:**
```sql
usuarios (
  id INT PRIMARY KEY,
  nit VARCHAR UNIQUE,
  nombre VARCHAR,
  email VARCHAR UNIQUE,
  telefono VARCHAR,
  tipo_usuario VARCHAR,  -- CLIENTE_CORPORATIVO, PILOTO, etc.
  estado VARCHAR,        -- PENDIENTE_ACEPTACION, ACTIVO, INACTIVO, BLOQUEADO
  fecha_registro DATETIME,
  creado_por INT,        -- FK a usuarios (auditoría)
  password_hash VARCHAR
)
```

---

### 3. **Ruta POST - `routes/usuarios/usuarioRoutes.js`**
**Endpoint:** `POST /api/usuarios`
- Ubicación: [src/routes/usuarios/usuarioRoutes.js](../../FASE%203/backend/src/routes/usuarios/usuarioRoutes.js)
- **Middleware:** `requireAuth` - Requiere autenticación con JWT
- **Body esperado:**
  ```json
  {
    "nombre": "string",
    "email": "string",
    "nit": "string",
    "telefono": "string (opcional)",
    "tipo_usuario": "string",
    "estado": "string",
    "password": "string"
  }
  ```
- **Response 201:**
  ```json
  {
    "ok": true,
    "mensaje": "Cliente creado correctamente",
    "data": {
      "id": number,
      "nombre": string,
      "email": string,
      "nit": string,
      "telefono": string,
      "tipo_usuario": string,
      "estado": string,
      "fecha_registro": datetime
    }
  }
  ```

**Rutas adicionales para gestión de usuarios:**
- `GET /api/usuarios` - Listar usuarios (con filtros)
- `GET /api/usuarios/:id` - Obtener usuario específico
- `PUT /api/usuarios/:id` - Actualizar datos de usuario
- `PATCH /api/usuarios/:id/estado` - Cambiar estado
- `POST /api/usuarios/:id/riesgo` - Crear evaluación de riesgo

---

### 4. **Servicio - `services/usuarios/usuarioService.js`**
**Función principal:** `crearCliente()`
- Ubicación: [src/services/usuarios/usuarioService.js](../../FASE%203/backend/src/services/usuarios/usuarioService.js)
- **Responsabilidades:**
  - Orquesta la lógica de negocio del registro
  - Llama al modelo `Usuario.crearCliente()`
  - Registra la acción en la tabla de auditoría
  - Maneja notificaciones por correo
  - Gestión de transacciones

**Funciones principales del servicio:**
- `crearCliente()` - Crea nuevo cliente corporativo
- `obtenerUsuario()` - Obtiene datos con perfil de riesgo si aplica
- `listarUsuarios()` - Delega a modelo
- `modificarUsuario()` - Actualiza usuario y registra auditoría
- `cambiarEstadoUsuario()` - Cambia estado y envía notificaciones por correo
- `crearRiesgoCliente()` - Asigna perfil de riesgo

**Características de auditoría:**
```javascript
await Auditoria.registrar({
  tabla_afectada: 'usuarios',
  accion: 'INSERT',
  registro_id: usuarioCreado.id,
  usuario_id: usuario_ejecutor,
  descripcion: 'Registro de nuevo usuario',
  datos_anteriores: null,
  datos_nuevos: usuarioCreado,
  ip_origen: ip
});
```

---

### 5. **Integración de Rutas - `routes/index_routes.js`**
- Ubicación: [src/routes/index_routes.js](../../FASE%203/backend/src/routes/index_routes.js)
- **Mount point:** `router.use('/usuarios', usuarioRoutes);`
- **Ruta final:** `/api/usuarios` → Enruta a `usuarioRoutes.js`

**Módulos integrados:**
- `/api/orden` - Gestión de órdenes
- `/api/facturacion` - Facturación
- `/api/usuarios` - Gestión de usuarios ✓
- `/api/contratos` - Contratos
- `/api/tarifario` - Tarifas
- `/api/notificaciones` - Notificaciones
- `/api/gerencial` - Dashboards

---

## 🎨 ESTRUCTURA DEL FRONTEND (FASE 3/frontend/src)

### 1. **Página/Componente - `pages/Registro/TiposRegistro.tsx`**
**Ubicación:** [src/pages/Registro/TiposRegistro.tsx](../../FASE%203/frontend/src/pages/Registro/TiposRegistro.tsx)

**Características:**
- Componente React con TypeScript (`.tsx`)
- **Campos del formulario:**
  - NIT (requerido)
  - Nombres
  - Apellidos
  - Teléfono
  - Email (requerido)
  - Password (requerido)
  - Confirm Password (requerido)

**Validaciones en frontend:**
- ✓ Las contraseñas deben coincidir
- ✓ Campos requeridos: NIT, Email, Password
- ✓ Manejo de estados: loading, error, success

**Flujo de componente:**
```typescript
const [formData, setFormData] = useState({...})
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState<string | null>(null)

// En submit:
// 1. Validar contraseñas coincidan
// 2. Llamar a registerRequest()
// 3. Si éxito: mostrar mensaje y redirigir a /login después 2s
// 4. Si error: mostrar mensaje de error
```

**Interfaz visual:**
- Layout de dos columnas (imagen de camión + formulario)
- Menú principal en la parte superior
- Gradiente azul/indigo
- Estilos Tailwind CSS
- Botón de envío con estados disabled mientras carga

---

### 2. **Servicio de Autenticación - `services/auth/authApi.ts`**
**Ubicación:** [src/services/auth/authApi.ts](../../FASE%203/frontend/src/services/auth/authApi.ts)

**Función:** `registerRequest()`
```typescript
export async function registerRequest(payload: RegisterPayload) {
  const response = await apiService.register(payload);
  return {
    ok: response.ok,
    mensaje: response.mensaje,
    data: response.data
  };
}
```

**Payload esperado:**
```typescript
export type RegisterPayload = {
  nit: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;  // e.g., 'cliente'
  nombres?: string;
  apellidos?: string;
  telefono?: string;
};
```

**Respuesta esperada:**
```typescript
export type RegisterResponse = {
  id: number;
  email: string;
  role: string;
};
```

---

### 3. **API Base Service - `services/api.ts`**
**Ubicación:** [src/services/api.ts](../../FASE%203/frontend/src/services/api.ts)

**Configuración:**
- `API_BASE_URL = "/api"`
- Método HTTP: `POST /api/auth/register` (asumido)

**Tipos TypeScript definidos:**
- `RegisterPayload` - Datos para registro
- `RegisterResponse` - Respuesta de registro
- `LoginPayload`, `LoginResponse` - Para login
- `MeResponse` - Info del usuario autenticado
- `AuthUser` - Estructura de usuario

---

## 📊 Flujo Completo de Registro

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (TiposRegistro.tsx)                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Usuario completa formulario (NIT, email, password, etc)       │
│ 2. Valida que passwords coincidan                               │
│ 3. Envía POST a /api/usuarios con datos + confirmPassword      │
│ 4. Muestra loading state mientras espera respuesta              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP POST /api/usuarios
                    payload: {nit, email, password...}
                             │
        ┌────────────────────▼────────────────────┐
        │      BACKEND (Routes)                   │
        │ usuarioRoutes.js POST /api/usuarios     │
        │ + middleware: requireAuth               │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │   BACKEND (Controller)                  │
        │   usuarioController.crearCliente()      │
        │ - Extrae datos del body                 │
        │ - Hash password con bcrypt              │
        │ - Valida password presente              │
        │ - Llama a servicio                      │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │   BACKEND (Service)                     │
        │   usuarioService.crearCliente()         │
        │ - Orquesta lógica de negocio            │
        │ - Registra en auditoría                 │
        │ - Envía notificaciones                  │
        │ - Llama a modelo                        │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │   BACKEND (Model)                       │
        │   Usuario.crearCliente()                │
        │ - INSERT en tabla usuarios              │
        │ - Retorna usuario creado                │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │        BASE DE DATOS (SQL Server)       │
        │        tabla: usuarios                  │
        │        Inserta nuevo registro           │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │    AUDITORÍA & NOTIFICACIONES          │
        │ - Registra en tabla auditoria           │
        │ - Envía email de bienvenida             │
        └────────────────────┬────────────────────┘
                             │
                  HTTP 201 Response
                  {ok: true, data: usuario}
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      FRONTEND (TiposRegistro.tsx)               │
├────────────────────────────────────────────────────────────────┤
│ 1. Recibe respuesta 201                                         │
│ 2. Muestra mensaje de éxito                                     │
│ 3. Limpia formulario                                            │
│ 4. Redirige a /login después 2 segundos                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Consideraciones de Seguridad

### Backend:
1. ✅ **Hash de contraseña:** bcrypt con 10 salt rounds
2. ✅ **Auditoría:** Registra usuario que registra y IP
3. ✅ **Autenticación:** Requiere JWT en header
4. ✅ **Validación:** Contraseña obligatoria
5. ⚠️ **UNIQUE constraints:** Email y NIT únicos en BD

### Frontend:
1. ✅ **Validación:** Contraseñas coinciden
2. ✅ **Estados:** Loading, error, success
3. ✅ **Limpieza:** Limpia formulario tras éxito
4. ⚠️ **Confirmación:** Pide confirmar contraseña

---

## 📁 Estructura de Carpetas Resumida

```
FASE 3/
├── backend/src/
│   ├── controllers/usuarios/
│   │   └── usuarioController.js         [Lógica HTTP - crearCliente()]
│   ├── models/usuarios/
│   │   ├── Usuario.js                   [Operaciones DB]
│   │   └── RiesgoCliente.js             [Evaluación de riesgo]
│   ├── routes/usuarios/
│   │   └── usuarioRoutes.js             [POST /api/usuarios]
│   ├── services/usuarios/
│   │   └── usuarioService.js            [Lógica de negocio]
│   ├── routes/
│   │   └── index_routes.js              [Mount: /usuarios]
│   └── config/db.js                     [Conexión SQL Server]
│
└── frontend/src/
    ├── pages/Registro/
    │   └── TiposRegistro.tsx            [Formulario de registro]
    ├── services/auth/
    │   └── authApi.ts                   [registerRequest()]
    └── services/
        └── api.ts                       [Tipos & API_BASE_URL]
```

---

## 🔄 Estados de Usuario Después del Registro

- **PENDIENTE_ACEPTACION** → Estado inicial (requiere aprobación)
- **ACTIVO** → Aprobado y puede usar sistema
- **INACTIVO** → Desactivado (puede reactivarse)
- **BLOQUEADO** → Bloqueado por incumplimiento/fraude

---

## 📝 Notas Adicionales

1. **Tipo de usuario:** El registro actual soporta `tipo_usuario` (CLIENTE_CORPORATIVO, PILOTO, etc.)
2. **Evaluación de riesgo:** Después del registro, se puede asignar perfil de riesgo (4 niveles)
3. **Notificaciones:** Se envían correos en cambios de estado
4. **Auditoría:** Todas las acciones quedan registradas en tabla `auditoria`
5. **Base de datos:** SQL Server (MSSQL)
6. **Framework backend:** Express.js + Node.js
7. **Framework frontend:** React + TypeScript + Vite
8. **Estilos:** Tailwind CSS
