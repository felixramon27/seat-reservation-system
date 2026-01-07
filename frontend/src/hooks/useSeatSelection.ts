import { useState } from 'react'
import { Seat} from '@/types/seat'

export function useSeatSelection(initialSeats: Seat[]) {
  const [seats, setSeats] = useState<Seat[]>(initialSeats)

  const selectSeat = (seatId: string) => {
    setSeats(prev =>
      prev.map(seat =>
        seat.id === seatId && seat.status === 'available'
          ? { ...seat, status: 'selected' }
          : seat
      )
    )
  }

  const clearSelection = () => {
    setSeats(prev =>
      prev.map(seat =>
        seat.status === 'selected'
          ? { ...seat, status: 'available' }
          : seat
      )
    )
  }

  return {
    seats,
    selectSeat,
    clearSelection,
  }
}
