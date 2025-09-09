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
    // ✅ CORREGIDO: Solo pasar el endpoint, apiRequest agregará la base URL
    const response = await apiRequest('/api/contacts/available-clients')
    if (!response.ok) {
      throw new Error('Error al obtener clientes disponibles')
    }
    return response.json()
  }

  async getContacts(clientId: number, filters: ContactFilters = {}): Promise<ContactResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Error al obtener contactos')
    }
    return response.json()
  }

  async getContact(clientId: number, id: number): Promise<Contact> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts/${id}`)
    if (!response.ok) {
      throw new Error('Error al obtener contacto')
    }
    return response.json()
  }

  async createContact(clientId: number, contact: Partial<Contact>): Promise<Contact> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      let errorMessage = 'Error al crear contacto'
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

  async updateContact(clientId: number, id: number, contact: Partial<Contact>): Promise<Contact> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Error al eliminar contacto')
    }
  }

  async getStats(clientId: number): Promise<ContactStats> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts/stats`)
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas')
    }
    return response.json()
  }

  async getUsers(): Promise<ContactUser[]> {
    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest('/api/contacts/users')
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
      headers: {
        'Content-Type': 'application/json',
      },
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

    // ✅ CORREGIDO: Solo pasar el endpoint
    const response = await apiRequest(`/api/clients/${clientId}/contacts/import`, {
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
