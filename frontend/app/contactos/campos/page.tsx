"use client"

import { useEffect, useState } from "react"
import { ClientSelector } from "@/components/contacts/client-selector"
import { ContactFieldsManagement } from "@/components/contacts/contact-fields-management"
import { contactsService } from "@/services/contacts-service"

interface ClientForContacts {
  id: number
  name: string
  description: string
  total_contacts: number
  has_contacts_table: boolean
  contacts_by_estado: Record<string, number>
}

export default function ContactFieldsPage() {
  const [clients, setClients] = useState<ClientForContacts[]>([])
  const [selected, setSelected] = useState<ClientForContacts | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    (async () => {
      const res = await contactsService.getAvailableClients()
      setClients(res.available_clients || [])
      setUserInfo(res.user_info || null)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campos de Contactos</h1>
          <p className="text-muted-foreground">Define campos personalizados por cliente</p>
        </div>
        <ClientSelector 
          clients={clients}
          selectedClient={selected}
          onSelectClient={setSelected as any}
          userInfo={userInfo}
          compact
        />
      </div>

      {selected ? (
        <ContactFieldsManagement clientId={selected.id} clientName={selected.name} />
      ) : (
        <div className="text-sm text-muted-foreground">Selecciona un cliente para gestionar sus campos.</div>
      )}
    </div>
  )
}


