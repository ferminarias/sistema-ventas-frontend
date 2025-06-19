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
}


export interface CreateClientRequest {
  name: string
  description?: string
  assignedUsers: number[]
  formConfig: FormField[]
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number
} 