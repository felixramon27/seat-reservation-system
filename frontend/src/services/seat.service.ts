import { Seat } from '@/types/seat'

const API_BASE = 'http://localhost:3002'

export const getSeats = async (): Promise<Seat[]> => {
  const response = await fetch(`${API_BASE}/seats`)
  if (!response.ok) throw new Error('Failed to fetch seats')
  return response.json()
}

export const reserveSeat = async (seatId: string): Promise<Seat> => {
  const response = await fetch(`${API_BASE}/seats/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatId })
  })
  if (!response.ok) throw new Error('Failed to reserve seat')
  return response.json()
}

// Para inicializar (solo desarrollo)
export const initSeats = async () => {
  const response = await fetch(`${API_BASE}/seats/init`, { method: 'POST' })
  return response.json()
}

// Mock para fallback
export const getMockSeats = (): Seat[] => [
  { id: 'seat-A1', status: 'available' },
  { id: 'seat-A2', status: 'reserved' },
  { id: 'seat-A3', status: 'available' },
  { id: 'seat-B1', status: 'reserved' },
  { id: 'seat-B2', status: 'available' },
  { id: 'seat-B3', status: 'available' },
  { id: 'seat-B4', status: 'reserved' },
]
