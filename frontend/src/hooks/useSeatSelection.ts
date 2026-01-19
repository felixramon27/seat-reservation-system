import { useState, useEffect } from 'react'
import { Seat } from '@/types/seat'
import { getSeats, reserveSeat, releaseSeat, getMockSeats } from '@/services/seat.service'

export function useSeatSelection(map?: string) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'client' | 'admin'>('client')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true)
      setSelectedSeats([])
      setSeats([])
      try {
        const data = await getSeats(map)
        // backend returns seats with id = `${map}::${externalId}` and externalId
        // transform to frontend Seat shape where id is externalId
        const transformed = data.map((s: any) => ({ id: s.externalId || s.id, status: s.status }))
        setSeats(transformed)
      } catch (error) {
        console.error('Failed to fetch seats, using mocks:', error)
        setSeats(getMockSeats())
      } finally {
        setLoading(false)
      }
    }
    fetchSeats()
  }, [map])

  const selectSeat = async (seatId: string) => {
    if (mode === 'client') {
      // Toggle selection
      setSelectedSeats(prev =>
        prev.includes(seatId)
          ? prev.filter(id => id !== seatId)
          : [...prev, seatId]
      )
    } else if (mode === 'admin') {
      // Release if reserved
      const seat = seats.find(s => s.id === seatId)
      if (seat?.status === 'reserved') {
        try {
          await releaseSeat(map, seatId)
          setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'available' } : s))
        } catch (error) {
          console.error('Failed to release seat:', error)
          // Fallback: update local state
          setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'available' } : s))
        }
      }
    }
  }

  const confirmSelection = async () => {
    for (const seatId of selectedSeats) {
      try {
        const updatedSeat = await reserveSeat(map, seatId)
        setSeats(prev => prev.map(seat => seat.id === seatId ? { ...seat, status: updatedSeat.status } : seat))
      } catch (error) {
        console.error('Failed to reserve seat:', error)
      }
    }
    setSelectedSeats([])
  }

  const clearSelection = () => {
    setSelectedSeats([])
  }

  return {
    seats,
    selectSeat,
    clearSelection,
    releaseSeat,
    loading,
    mode,
    setMode,
    selectedSeats,
    confirmSelection,
  }
}
