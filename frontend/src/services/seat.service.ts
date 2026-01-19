import { Seat } from '@/types/seat'

const API_BASE = 'http://localhost:3002'

export const getSeats = async (map?: string): Promise<Seat[]> => {
  const url = map ? `${API_BASE}/seats?map=${encodeURIComponent(map)}` : `${API_BASE}/seats`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch seats')
  return response.json()
}

export const reserveSeat = async (map: string | undefined, seatId: string): Promise<Seat> => {
  const response = await fetch(`${API_BASE}/seats/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ map, seatId })
  })
  if (!response.ok) {
    let msg = 'Failed to reserve seat'
    try {
      const err = await response.json()
      if (err?.error) msg = err.error
    } catch {}
    throw new Error(msg)
  }
  return response.json()
}

export const releaseSeat = async (map: string | undefined, seatId: string): Promise<Seat> => {
  const response = await fetch(`${API_BASE}/seats/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ map, seatId })
  })
  if (!response.ok) {
    let msg = 'Failed to release seat'
    try {
      const err = await response.json()
      if (err?.error) msg = err.error
    } catch {}
    throw new Error(msg)
  }
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
