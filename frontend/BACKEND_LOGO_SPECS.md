# 🎨 Especificaciones para Implementación de Logos de Clientes

## 📋 **Resumen de Cambios Frontend**

### **1. Componentes Modificados:**
- ✅ `DashboardHeader`: Muestra logo del cliente junto al título
- ✅ `Sidebar`: Muestra logos pequeños en la lista de clientes
- ✅ `CreateClientDialog`: Campo para subir logo al crear cliente
- ✅ `ConfigureFormDialog`: **NUEVO** - Sección para configurar logo del cliente
- ✅ `FileUpload`: Componente optimizado para carga de imágenes
- ✅ Tipos actualizados: `Client` y `CreateClientRequest` incluyen `logo?: string`

### **2. Ubicaciones de los Logos:**
- **Dashboard del Cliente**: Logo prominente (64x64px) en el header
- **Sidebar**: Logo pequeño (24x24px) junto al nombre del cliente
- **Tarjeta de Información**: Logo mediano (64x64px) en la esquina
- **Configuración de Cliente**: Campo para subir/editar logo

### **3. Flujo de Configuración:**
1. **Administración → Gestión de Clientes**
2. **Hacer clic en el ícono de configuración** (⚙️) del cliente
3. **Sección "Logo del Cliente"** en la parte superior
4. **Subir imagen** con preview en tiempo real
5. **Guardar cambios** junto con la configuración de campos

## 🔧 **Cambios Requeridos en el Backend**

### **1. Modelo de Cliente**
```sql
-- Agregar campo logo a la tabla clientes
ALTER TABLE clientes ADD COLUMN logo VARCHAR(500);
```

### **2. API Endpoints**

#### **A. Crear Cliente (POST /api/clientes)**
```json
{
  "name": "Universidad XYZ",
  "description": "Descripción del cliente",
  "assignedUsers": [1, 2, 3],
  "formConfig": [...],
  "logo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Base64 o URL de Cloudinary
}
```

#### **B. Actualizar Cliente (PUT /api/clientes/:id)**
```json
{
  "name": "Universidad XYZ",
  "description": "Descripción actualizada",
  "assignedUsers": [1, 2, 3],
  "formConfig": [...],
  "logo": "https://res.cloudinary.com/.../universidad-xyz-logo.jpg"
}
```

#### **C. Obtener Cliente (GET /api/clientes/:id)**
```json
{
  "id": 1,
  "name": "Universidad XYZ",
  "description": "Descripción",
  "createdAt": "2025-01-15T10:30:00Z",
  "assignedUsers": [1, 2, 3],
  "formConfig": [...],
  "logo": "https://res.cloudinary.com/.../universidad-xyz-logo.jpg"
}
```

#### **D. Lista de Clientes (GET /api/clientes)**
```json
[
  {
    "id": 1,
    "name": "Universidad XYZ",
    "description": "Descripción",
    "createdAt": "2025-01-15T10:30:00Z",
    "assignedUsers": [1, 2, 3],
    "formConfig": [...],
    "logo": "https://res.cloudinary.com/.../universidad-xyz-logo.jpg"
  }
]
```

### **3. Integración con Cloudinary**

#### **A. Configuración**
```javascript
// Instalar dependencia
npm install cloudinary

// Configurar en .env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### **B. Función de Subida**
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadLogo(base64Image, clientName) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'client-logos',
      public_id: `${clientName.toLowerCase().replace(/\s+/g, '-')}-logo`,
      transformation: [
        { width: 200, height: 200, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
```

#### **C. Middleware para Procesar Logo**
```javascript
// En el endpoint de crear/actualizar cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { name, description, assignedUsers, formConfig, logo } = req.body;
    
    let logoUrl = null;
    if (logo && logo.startsWith('data:image/')) {
      // Subir a Cloudinary si es base64
      logoUrl = await uploadLogo(logo, name);
    } else if (logo) {
      // Usar URL directa si ya es una URL
      logoUrl = logo;
    }
    
    const newClient = await createClient({
      name,
      description,
      assignedUsers,
      formConfig,
      logo: logoUrl
    });
    
    res.json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// En el endpoint de actualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { name, description, assignedUsers, formConfig, logo } = req.body;
    const clientId = req.params.id;
    
    let logoUrl = null;
    if (logo && logo.startsWith('data:image/')) {
      // Subir a Cloudinary si es base64
      logoUrl = await uploadLogo(logo, name);
    } else if (logo) {
      // Usar URL directa si ya es una URL
      logoUrl = logo;
    }
    
    const updatedClient = await updateClient(clientId, {
      name,
      description,
      assignedUsers,
      formConfig,
      logo: logoUrl
    });
    
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **4. Validaciones**

#### **A. Validación de Imagen**
```javascript
function validateImage(base64String) {
  // Verificar que sea una imagen válida
  const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!imageRegex.test(base64String)) {
    throw new Error('Formato de imagen no válido');
  }
  
  // Verificar tamaño (máximo 2MB)
  const base64Data = base64String.split(',')[1];
  const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 2) {
    throw new Error('La imagen no puede ser mayor a 2MB');
  }
  
  return true;
}
```

#### **B. Validación de URL**
```javascript
function validateLogoUrl(url) {
  if (!url) return true; // Logo opcional
  
  try {
    new URL(url);
    return true;
  } catch {
    throw new Error('URL de logo no válida');
  }
}
```

### **5. Estructura de Respuesta**

#### **A. Lista de Clientes**
```json
[
  {
    "id": 1,
    "name": "Universidad XYZ",
    "description": "Descripción",
    "createdAt": "2025-01-15T10:30:00Z",
    "assignedUsers": [1, 2, 3],
    "formConfig": [...],
    "logo": "https://res.cloudinary.com/.../universidad-xyz-logo.jpg"
  }
]
```

#### **B. Cliente Individual**
```json
{
  "id": 1,
  "name": "Universidad XYZ",
  "description": "Descripción completa",
  "createdAt": "2025-01-15T10:30:00Z",
  "assignedUsers": [1, 2, 3],
  "formConfig": [...],
  "logo": "https://res.cloudinary.com/.../universidad-xyz-logo.jpg"
}
```

## 🚀 **Pasos de Implementación**

### **1. Backend (Railway)**
1. **Instalar Cloudinary**: `npm install cloudinary`
2. **Configurar variables de entorno** en Railway
3. **Modificar modelo de cliente** para incluir campo `logo`
4. **Actualizar endpoints** para manejar logos en base64
5. **Implementar validaciones** de imagen
6. **Probar subida de logos** desde configuración de campos

### **2. Frontend (Ya implementado)**
- ✅ Componentes actualizados
- ✅ Tipos modificados
- ✅ UI optimizada para logos
- ✅ Fallbacks para errores de carga
- ✅ **NUEVO**: Configuración de logo en gestión de campos

### **3. Testing**
1. **Crear cliente con logo** desde la administración
2. **Editar logo existente** desde configuración de campos
3. **Verificar visualización** en dashboard y sidebar
4. **Probar diferentes formatos** (JPG, PNG, GIF)
5. **Verificar fallbacks** cuando no hay logo

## 📝 **Notas Importantes**

- **Tamaño máximo**: 2MB por imagen
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Resolución recomendada**: 200x200px (se redimensiona automáticamente)
- **Carpeta en Cloudinary**: `client-logos/`
- **Nombres de archivo**: `{nombre-cliente}-logo`
- **Ubicación de configuración**: Administración → Gestión de Clientes → ⚙️ Configurar

## 🔄 **Migración de Datos Existentes**

Si ya tienes clientes sin logos, el campo será `null` y se mostrará el fallback con la inicial del nombre del cliente.

## 🎯 **Flujo de Usuario**

1. **Ir a Administración → Gestión de Clientes**
2. **Hacer clic en el ícono de configuración** (⚙️) del cliente deseado
3. **En la sección "Logo del Cliente"** subir la imagen
4. **Ver preview en tiempo real** de la imagen
5. **Configurar campos del formulario** (opcional)
6. **Guardar cambios** para aplicar logo y configuración
7. **Ver logo en dashboard y sidebar** del cliente 