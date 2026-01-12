import { useState, useEffect } from 'react'
import { Seat } from '@/types/seat'
import { getSeats, reserveSeat, getMockSeats } from '@/services/seat.service'

export function useSeatSelection() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const data = await getSeats()
        setSeats(data)
      } catch (error) {
        console.error('Failed to fetch seats, using mocks:', error)
        setSeats(getMockSeats())
      } finally {
        setLoading(false)
      }
    }
    fetchSeats()
  }, [])

  const selectSeat = async (seatId: string) => {
    try {
      const updatedSeat = await reserveSeat(seatId)
      setSeats(prev => prev.map(seat => seat.id === seatId ? updatedSeat : seat))
    } catch (error) {
      console.error('Failed to reserve seat:', error)
      // Fallback: update local state
      setSeats(prev =>
        prev.map(seat =>
          seat.id === seatId && seat.status === 'available'
            ? { ...seat, status: 'selected' }
            : seat
        )
      )
    }
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
    loading,
  }
}
