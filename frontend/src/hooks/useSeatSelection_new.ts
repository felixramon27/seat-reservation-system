import { useState, useEffect } from 'react'
import { Seat } from '@/types/seat'
import { getSeats, reserveSeat, releaseSeat, getMockSeats } from '@/services/seat.service'

export type Mode = 'client' | 'admin'

export function useSeatSelection(map?: string) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('client')

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const data = await getSeats(map)
        setSeats(data)
      } catch (error) {
        console.error('Failed to fetch seats, using mocks:', error)
        setSeats(getMockSeats())
      } finally {
        setLoading(false)
      }
    }
    fetchSeats()
  }, [map])

  const selectSeat = (seatId: string) => {
    if (mode === 'client') {
      // En cliente: toggle selected si available o selected
      setSeats(prev =>
        prev.map(seat =>
          seat.id === seatId && (seat.status === 'available' || seat.status === 'selected')
            ? { ...seat, status: seat.status === 'available' ? 'selected' : 'available' }
            : seat
        )
      )
    } else if (mode === 'admin') {
      // En admin: liberar si reserved
      const seat = seats.find(s => s.id === seatId)
      if (seat?.status === 'reserved') {
        releaseSeat(map, seatId).then(updatedSeat => {
          setSeats(prev => prev.map(s => s.id === seatId ? updatedSeat : s))
        }).catch(error => {
          console.error('Failed to release seat:', error)
        })
      }
    }
  }

  const confirmSelection = async () => {
    if (mode !== 'client') return
    const selectedSeats = seats.filter(s => s.status === 'selected')
    for (const seat of selectedSeats) {
      try {
        const updatedSeat = await reserveSeat(map, seat.id)
        setSeats(prev => prev.map(s => s.id === seat.id ? updatedSeat : s))
      } catch (error) {
        console.error('Failed to reserve seat:', seat.id, error)
      }
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
    confirmSelection,
    mode,
    setMode,
    loading,
  }
}