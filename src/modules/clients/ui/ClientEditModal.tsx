import { useState } from 'react'
import type { Client } from '../domain/client'

interface ClientEditModalProps {
  client: Client
  onSave: (clientData: Omit<Client, 'id' | 'contractorId' | 'createdAt'>) => void
  onCancel: () => void
}

export function ClientEditModal(props: ClientEditModalProps) {
  const [name, setName] = useState(props.client.name)
  const [email, setEmail] = useState(props.client.email)
  const [phone, setPhone] = useState(props.client.phone)
  const [street, setStreet] = useState(props.client.street)
  const [city, setCity] = useState(props.client.city)
  const [state, setState] = useState(props.client.state)
  const [zipCode, setZipCode] = useState(props.client.zipCode)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onSave({ name, email, phone, street, city, state, zipCode })
  }

  return (
    <div className="modal-overlay" onClick={props.onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Client</h2>
          <button type="button" className="modal-close" onClick={props.onCancel}>
            ×
          </button>
        </div>

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
          <div className="form-submit-row" style={{ gridColumn: '1 / -1' }}>
            <button className="secondary-action" type="button" onClick={props.onCancel}>
              Cancel
            </button>
            <button className="primary-action" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
