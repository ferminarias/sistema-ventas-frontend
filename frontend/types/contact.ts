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
