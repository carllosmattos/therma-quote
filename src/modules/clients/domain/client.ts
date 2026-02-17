export interface Client {
  id: string
  name: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
  doeClimateZone?: number
  deletedAt?: string
}
