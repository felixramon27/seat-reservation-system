import { Seat } from '@/types/seat'

export const getMockSeats = (): Seat[] => [
  { id: 'seat-A1', status: 'available' },
  { id: 'seat-A2', status: 'reserved' },
  { id: 'seat-A3', status: 'available' },
  { id: 'seat-B1', status: 'reserved' },
  { id: 'seat-B2', status: 'available' },
  { id: 'seat-B3', status: 'available' },
  { id: 'seat-B4', status: 'reserved' },
]
