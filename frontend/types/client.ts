export interface FormField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  order: number
}

export interface Client {
  id: number
  name: string
  description?: string
  createdAt: string
  assignedUsers: number[]
  formConfig: FormField[]
  isActive?: boolean // Opcional, si tu backend lo maneja
  logo?: string // URL del logo del cliente
}

export interface CreateClientRequest {
  name: string
  description?: string
  assignedUsers: number[]
  formConfig: FormField[]
  logo?: string // URL del logo del cliente
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number
} 