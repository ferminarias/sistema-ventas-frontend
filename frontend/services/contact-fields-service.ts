import { apiRequest } from '@/lib/api'

export interface ContactFieldDef {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required: boolean
  order: number
  placeholder?: string
  help_text?: string
  options?: string[]
}

export interface ContactFieldsResponse {
  fields: ContactFieldDef[]
}

class ContactFieldsService {
  async list(clientId: number): Promise<ContactFieldsResponse> {
    const res = await apiRequest(`/api/clientes/${clientId}/contact-fields`)
    if (!res.ok) throw new Error('Error al obtener campos de contactos')
    return res.json()
  }

  async create(clientId: number, field: Omit<ContactFieldDef, 'order'>): Promise<ContactFieldDef> {
    const res = await apiRequest(`/api/clientes/${clientId}/contact-fields`, {
      method: 'POST',
      body: JSON.stringify(field),
    })
    if (!res.ok) throw new Error('Error al crear campo')
    return res.json()
  }

  async update(clientId: number, fieldId: string, field: Partial<ContactFieldDef>): Promise<ContactFieldDef> {
    const res = await apiRequest(`/api/clientes/${clientId}/contact-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(field),
    })
    if (!res.ok) throw new Error('Error al actualizar campo')
    return res.json()
  }

  async remove(clientId: number, fieldId: string): Promise<void> {
    const res = await apiRequest(`/api/clientes/${clientId}/contact-fields/${fieldId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar campo')
  }

  async reorder(clientId: number, order: string[]): Promise<void> {
    const res = await apiRequest(`/api/clientes/${clientId}/contact-fields/reorder`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    })
    if (!res.ok) throw new Error('Error al reordenar campos')
  }
}

export const contactFieldsService = new ContactFieldsService()


