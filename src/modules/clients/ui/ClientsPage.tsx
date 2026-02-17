import { useState } from 'react'
import { useAuth } from '../../auth/application/useAuth'
import { useContractorClients } from '../application/useContractorClients'
import { ClientEditModal } from './ClientEditModal'
import type { Client } from '../domain/client'

export function ClientsPage() {
  const { user } = useAuth()
  const { clients, addClient, deleteClient, updateClient } = useContractorClients(user?.id ?? 'no-contractor')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  if (!user) {
    return null
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addClient({ name, email, phone, street, city, state, zipCode })
    setName('')
    setEmail('')
    setPhone('')
    setStreet('')
    setCity('')
    setState('')
    setZipCode('')
  }

  function handleDelete(clientId: string, clientName: string) {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      deleteClient(clientId)
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
  }

  function handleSaveEdit(clientData: Omit<Client, 'id' | 'contractorId' | 'createdAt'>) {
    if (editingClient) {
      updateClient(editingClient.id, clientData)
      setEditingClient(null)
    }
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>Clients</h1>
        <p className="subtitle">Register homeowners used in proposal search.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="John Doe"
              title="Full name of the homeowner or property owner"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="john@example.com"
              title="Email address for proposal delivery and communication"
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              placeholder="(123) 456-7890"
              title="Contact phone number"
            />
          </label>
          <label>
            Street
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              required
              placeholder="123 Main Street"
              title="Street address where insulation work will be performed"
            />
          </label>
          <label>
            City
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              placeholder="Portland"
              title="City name"
            />
          </label>
          <label>
            State
            <input
              value={state}
              maxLength={2}
              onChange={(event) => setState(event.target.value)}
              required
              placeholder="OR"
              title="Two-letter state code (e.g., CA, TX, OR)"
            />
          </label>
          <label>
            ZIP Code
            <input
              value={zipCode}
              maxLength={10}
              onChange={(event) => setZipCode(event.target.value)}
              required
              placeholder="97005"
              title="ZIP code for climate zone lookup and location identification"
            />
          </label>
          <div className="form-submit-row">
            <button className="primary-action" type="submit">
              Add Client
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Client Base</h2>
        <div className="list-grid">
          {clients.map((client) => (
            <article className="list-item" key={client.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                  <span>{client.phone}</span>
                  <span>
                    {client.street}, {client.city}, {client.state} {client.zipCode}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button type="button" className="secondary-action" onClick={() => handleEdit(client)}>
                    Edit
                  </button>
                  <button type="button" className="secondary-action" onClick={() => handleDelete(client.id, client.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingClient && (
        <ClientEditModal client={editingClient} onSave={handleSaveEdit} onCancel={() => setEditingClient(null)} />
      )}
    </main>
  )
}
