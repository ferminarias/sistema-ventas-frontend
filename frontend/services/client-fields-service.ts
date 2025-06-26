const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Función para obtener headers con autenticación
function getAuthHeaders(includeContentType: boolean = true): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {}

  if (includeContentType) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export interface ClientField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'file' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  default: boolean;
  order: number;
  placeholder?: string;
  help_text?: string;
  options?: string[]; // Para campos tipo select
}

export interface ClientFieldsResponse {
  fields: ClientField[];
}

class ClientFieldsService {
  // Obtener campos de un cliente
  async getClientFields(clientId: number): Promise<ClientField[]> {
    console.log(`Obteniendo campos para cliente ${clientId}...`)
    
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos`, {
      headers: getAuthHeaders(false),
      credentials: 'include',
    });
    
    console.log(`Response status al obtener campos:`, response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener campos:', errorData);
      throw new Error(errorData.message || 'Error al obtener campos del cliente');
    }
    
    const data: ClientFieldsResponse = await response.json();
    console.log(`Campos obtenidos:`, data.fields?.length || 0, 'campos')
    return data.fields.sort((a, b) => a.order - b.order);
  }

  // Agregar campo personalizado
  async addClientField(clientId: number, field: Omit<ClientField, 'default' | 'order'>): Promise<ClientField> {
    console.log(`Agregando campo personalizado para cliente ${clientId}:`, field)
    
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(field),
    });
    
    console.log(`Response status al agregar campo personalizado:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status} al agregar campo personalizado:`);
      console.error(`❌ Request body enviado:`, JSON.stringify(field, null, 2));
      console.error(`❌ Response headers:`, Object.fromEntries(response.headers.entries()));
      console.error(`❌ Response body:`, errorText);
      
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error(`❌ No es JSON válido:`, errorText);
      }
      
      throw new Error((errorData as any).message || errorText || 'Error al agregar campo personalizado');
    }
    
    const data = await response.json();
    console.log('Campo personalizado agregado exitosamente:', data);
    return data;
  }

  // Editar campo existente
  async updateClientField(clientId: number, fieldId: string, field: Partial<ClientField>): Promise<ClientField> {
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos/${fieldId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(field),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar campo');
    }
    
    return response.json();
  }

  // Eliminar campo personalizado
  async deleteClientField(clientId: number, fieldId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos/${fieldId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar campo');
    }
  }

  // Crear venta con campos dinámicos
  async createDynamicVenta(ventaData: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE}/api/ventas/dynamic`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(ventaData),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear venta');
    }
    
    return response.json();
  }

  // Subir archivo
  async uploadFile(file: File, fieldId: string, ventaId?: number): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_id', fieldId);
    if (ventaId) {
      formData.append('venta_id', ventaId.toString());
    }

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: getAuthHeaders(false), // No incluir Content-Type para FormData
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Error al subir archivo');
    }
    
    const data = await response.json();
    return data.url || data.path;
  }

  // Agregar campo predefinido (nueva funcionalidad del backend)
  async addQuickField(clientId: number, fieldType: 'imagen' | 'documento' | 'firma'): Promise<ClientField> {
    console.log(`Llamando endpoint: ${API_BASE}/api/clientes/${clientId}/campos/quick-add/${fieldType}`)
    
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos/quick-add/${fieldType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    console.log(`Response status para ${fieldType}:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status} para ${fieldType}:`);
      console.error(`❌ Response headers:`, Object.fromEntries(response.headers.entries()));
      console.error(`❌ Response body:`, errorText);
      
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error(`❌ No es JSON válido:`, errorText);
      }
      
      throw new Error((errorData as any).message || errorText || `Error ${response.status} al agregar campo ${fieldType}`);
    }
    
    const data = await response.json();
    console.log(`Data recibida para ${fieldType}:`, data);
    return data;
  }

  // Verificar configuración de campos (endpoint de debug)
  async debugCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/api/clientes/debug/check`, {
      headers: getAuthHeaders(false),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Error en verificación de debug');
    }
    
    return response.json();
  }
}

export const clientFieldsService = new ClientFieldsService(); 