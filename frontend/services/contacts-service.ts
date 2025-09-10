import { apiRequest } from '@/lib/api'

export interface Contact {
  id: number
  nombre: string
  apellido: string
  correo?: string
  telefono?: string
  telefono_whatsapp?: string
  fecha_insercion: string
  updated_at: string
  created_by: number
  assigned_to?: number
  estado: 'no contactado' | 'contactado' | 'interesado' | 'seguimiento' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido' | 'descartado'
  programa_interes?: string
  utm_medio?: string
  utm_source?: string
  utm_campaign?: string
  utm_content?: string
  campos_adicionales?: Record<string, any>
  can_edit?: boolean
  can_delete?: boolean
  assigned_user?: {
    id: number
    nombre: string
    apellido: string
  }
  created_user?: {
    id: number
    nombre: string
    apellido: string
  }
}


export interface ContactFilters {
  search?: string
  estado?: string
  programa_interes?: string
  utm_source?: string
  utm_campaign?: string
  assigned_to?: number
  created_by?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ContactStats {
  total_contacts: number
  no_contactado: number
  contactado: number
  interesado: number
  seguimiento: number
  propuesta: number
  negociacion: number
  ganado: number
  perdido: number
  descartado: number
  por_programa: Record<string, number>
  por_utm_source: Record<string, number>
  por_utm_campaign: Record<string, number>
}

export interface ContactUser {
  id: number
  nombre: string
  apellido: string
  email: string
}

export interface ContactField {
  id: string
  label: string
  type: string
  options?: string[]
  required?: boolean
}

export interface ContactResponse {
  contacts: Contact[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

class ContactsService {
  // ✅ CORREGIDO: Eliminar baseUrl ya que apiRequest maneja la URL base automáticamente

  async getAvailableClients(): Promise<{ available_clients: any[], user_info: any }> {
    // ✅ USAR ESTRUCTURA COMO /api/clientes que SÍ funciona
    const response = await apiRequest('/api/clientes')
    if (!response.ok) {
      throw new Error('Error al obtener clientes disponibles')
    }
    
    // Los clientes vienen directamente como array, necesitamos adaptarlos
    const clientsArray = await response.json()
    
    // Transformar cada cliente para agregar las propiedades que necesita el frontend
    const available_clients = clientsArray.map((client: any) => ({
      id: client.id,
      name: client.name,
      description: client.description,
      // Agregar propiedades requeridas para contactos
      has_contacts_table: true, // Todos los clientes tienen tabla de contactos ahora
      total_contacts: 0, // Se actualizará cuando se seleccione
      contacts_by_estado: {}
    }))
    
    
    return {
      available_clients,
      user_info: { role: 'admin' } // Info básica del usuario
    }
  }

  async getContacts(clientId: number, filters: ContactFilters = {}): Promise<ContactResponse> {
    
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona
    const response = await apiRequest(`/api/clientes/${clientId}/contactos?${params.toString()}`)
    
    if (!response.ok) {
      // Debug específico para problemas de autenticación
      if (response.status === 401) {
        console.error('❌ ERROR 401: Token no válido o expirado al obtener contactos')
        throw new Error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.')
      }
      if (response.status === 403) {
        console.error('❌ ERROR 403: Sin permisos para ver contactos del cliente', clientId)
        throw new Error('No tiene permisos para ver contactos de este cliente.')
      }
      
      console.error('❌ GET CONTACTS ERROR:', response.status, await response.text())
      throw new Error('Error al obtener contactos')
    }
    return response.json()
  }

  async getContact(clientId: number, id: number): Promise<Contact> {
    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona  
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/${id}`)
    if (!response.ok) {
      throw new Error('Error al obtener contacto')
    }
    return response.json()
  }

  async createContact(clientId: number, contact: Partial<Contact>): Promise<Contact> {
    
    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona
    // ⚠️ IMPORTANTE: No pasar headers personalizados - apiRequest maneja Authorization automáticamente
    const response = await apiRequest(`/api/clientes/${clientId}/contactos`, {
      method: 'POST',
      body: JSON.stringify(contact),
    })
    
    if (!response.ok) {
      // Debug específico para problemas de autenticación
      if (response.status === 401) {
        console.error('❌ ERROR 401: Token no válido o expirado')
        throw new Error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.')
      }
      if (response.status === 403) {
        console.error('❌ ERROR 403: Sin permisos para crear contactos')
        throw new Error('No tiene permisos para crear contactos en este cliente.')
      }
      
      const errorData = await response.text()
      let errorMessage = 'Error al crear contacto'
      try {
        const errorJson = JSON.parse(errorData)
        errorMessage = errorJson.message || errorMessage
      } catch (e) {
        // Si no es JSON válido, usar el texto como está
      }
      console.error('❌ CREATE CONTACT ERROR:', response.status, errorMessage)
      throw new Error(errorMessage)
    }
    return response.json()
  }

  async updateContact(clientId: number, id: number, contact: Partial<Contact>): Promise<Contact> {
    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      let errorMessage = 'Error al actualizar contacto'
      try {
        const errorJson = JSON.parse(errorData)
        errorMessage = errorJson.message || errorMessage
      } catch (e) {
        // Si no es JSON válido, usar el texto como está
      }
      throw new Error(errorMessage)
    }
    return response.json()
  }

  async deleteContact(clientId: number, id: number): Promise<void> {
    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Error al eliminar contacto')
    }
  }

  // Gestión de notas del contacto
  async addContactNote(clientId: number, contactId: number, note: string): Promise<{ id: number; note: string; created_at: string; created_by: string }> {
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/${contactId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
    
    if (!response.ok) {
      throw new Error('Error al agregar nota')
    }
    
    return response.json()
  }

  async getContactNotes(clientId: number, contactId: number): Promise<Array<{ id: number; note: string; created_at: string; created_by: string }>> {
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/${contactId}/notes`)
    
    if (!response.ok) {
      throw new Error('Error al obtener notas')
    }
    
    return response.json()
  }

  async getStats(clientId: number): Promise<ContactStats> {
    // ✅ USAR ESTRUCTURA COMO /api/ventas que SÍ funciona
    const response = await apiRequest(`/api/clientes/${clientId}/contactos/stats`)
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas')
    }
    const data = await response.json()
    
    // El backend devuelve {client: {...}, stats: {...}}, necesitamos extraer solo stats
    if (data.stats) {
      const stats = data.stats
      
      // Mapear los estados desde by_estado a propiedades directas
      return {
        total_contacts: stats.total_contacts || 0,
        no_contactado: stats.by_estado?.no_contactado || 0,
        contactado: stats.by_estado?.contactado || 0,
        interesado: stats.by_estado?.interesado || 0,
        seguimiento: stats.by_estado?.seguimiento || 0,
        propuesta: stats.by_estado?.propuesta || 0,
        negociacion: stats.by_estado?.negociacion || 0,
        ganado: stats.by_estado?.ganado || 0,
        perdido: stats.by_estado?.perdido || 0,
        descartado: stats.by_estado?.descartado || 0,
        por_programa: stats.por_programa || {},
        por_utm_source: stats.por_utm_source || {},
        por_utm_campaign: stats.por_utm_campaign || {}
      }
    }
    
    // Si no hay stats, devolver estructura por defecto
    return {
      total_contacts: 0,
      no_contactado: 0,
      contactado: 0,
      interesado: 0,
      seguimiento: 0,
      propuesta: 0,
      negociacion: 0,
      ganado: 0,
      perdido: 0,
      descartado: 0,
      por_programa: {},
      por_utm_source: {},
      por_utm_campaign: {}
    }
  }

  async getUsers(): Promise<ContactUser[]> {
    // ✅ CORREGIDO: Usar endpoint de usuarios existente
    const response = await apiRequest('/api/users')
    if (!response.ok) {
      throw new Error('Error al obtener usuarios')
    }
    return response.json()
  }

  async getFields(): Promise<ContactField[]> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest('/api/contacts/fields')
    if (!response.ok) {
      throw new Error('Error al obtener campos')
    }
    return response.json()
  }

  async updateContactField(id: number, fieldId: string, value: any): Promise<Contact> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/contacts/${id}/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    })
    
    if (!response.ok) {
      throw new Error('Error al actualizar campo')
    }
    return response.json()
  }

  async deleteContactField(id: number, fieldId: string): Promise<Contact> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/contacts/${id}/fields/${fieldId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Error al eliminar campo')
    }
    return response.json()
  }

  async exportContacts(clientId: number, filters: ContactFilters & { format?: 'excel' | 'csv'; include_fields?: boolean } = {}): Promise<Blob> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/contacts/client/${clientId}/export?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Error al exportar contactos')
    }
    return response.blob()
  }

  async importContacts(clientId: number, file: File): Promise<{ message: string; imported: number; errors?: string[] }> {
    const formData = new FormData()
    formData.append('file', file)

    // ✅ CORREGIDO: Usar endpoint que coincida con estructura del backend
    const response = await apiRequest(`/api/contacts/client/${clientId}/import`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      let errorMessage = 'Error al importar contactos'
      try {
        const errorJson = JSON.parse(errorData)
        errorMessage = errorJson.message || errorMessage
      } catch (e) {
        // Si no es JSON válido, usar el texto como está
      }
      throw new Error(errorMessage)
    }
    return response.json()
  }
}

export const contactsService = new ContactsService()
