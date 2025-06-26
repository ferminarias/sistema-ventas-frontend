const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export interface ClientField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'file' | 'textarea' | 'select';
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
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener campos del cliente');
    }
    
    const data: ClientFieldsResponse = await response.json();
    return data.fields.sort((a, b) => a.order - b.order);
  }

  // Agregar campo personalizado
  async addClientField(clientId: number, field: Omit<ClientField, 'default' | 'order'>): Promise<ClientField> {
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(field),
    });
    
    if (!response.ok) {
      throw new Error('Error al agregar campo personalizado');
    }
    
    return response.json();
  }

  // Editar campo existente
  async updateClientField(clientId: number, fieldId: string, field: Partial<ClientField>): Promise<ClientField> {
    const response = await fetch(`${API_BASE}/api/clientes/${clientId}/campos/${fieldId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Error al subir archivo');
    }
    
    const data = await response.json();
    return data.url || data.path;
  }
}

export const clientFieldsService = new ClientFieldsService(); 