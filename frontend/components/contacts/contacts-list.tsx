"use client"

import { AdvancedContactsTable } from "@/components/contacts/advanced-contacts-table"

interface ContactsListProps {
  clientId: number
  clientName: string
}

export function ContactsList({ clientId, clientName }: ContactsListProps) {
  return (
    <AdvancedContactsTable 
        clientId={clientId}
      clientName={clientName} 
    />
  )
}