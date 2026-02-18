import { useState } from 'react'
import type { Client } from '../domain/client'
import { addContractorClient, deleteContractorClient, listContractorClients, updateContractorClient } from '../infrastructure/clientStorage'

interface AddClientInput {
  name: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
}

export function useContractorClients(contractorId: string) {
  const [clients, setClients] = useState<Client[]>(() => {
    const result = listContractorClients(contractorId)
    return result
  })

  function addClient(input: AddClientInput) {
    addContractorClient(contractorId, {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      street: input.street.trim(),
      city: input.city.trim(),
      state: input.state.trim().toUpperCase(),
      zipCode: input.zipCode.trim(),
    })
    setClients(listContractorClients(contractorId))
  }

  function reloadClients() {
    setClients(listContractorClients(contractorId))
  }

  function deleteClient(clientId: string) {
    deleteContractorClient(contractorId, clientId)
    setClients(listContractorClients(contractorId))
  }

  function updateClient(clientId: string, updates: Partial<AddClientInput>) {
    updateContractorClient(contractorId, clientId, updates)
    setClients(listContractorClients(contractorId))
  }

  return {
    clients,
    addClient,
    deleteClient,
    updateClient,
    reloadClients,
  }
}
