import { useState, useEffect } from 'react'
import { Seat } from '@/types/seat'
import { getSeats, reserveSeat, releaseSeat, getMockSeats } from '@/services/seat.service'

export function useSeatSelection(map?: string) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'client' | 'admin'>('client')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  useEffect(() => {
    type BackendSeat = { id: string; externalId?: string; status: Seat['status'] }

    const fetchSeats = async () => {
      setLoading(true)
      setSelectedSeats([])
      setSeats([])
      try {
        const data = await getSeats(map) as BackendSeat[]
        // backend returns seats with id = `${map}::${externalId}` and externalId
        // transform to frontend Seat shape where id is externalId
        const transformed = data.map((s) => ({ id: s.externalId || s.id, status: s.status }))
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

  // Efecto para manejar la conexión WebSocket en tiempo real
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout
    let isMounted = true

    const connect = () => {
      ws = new WebSocket('ws://localhost:5001')

      ws.onopen = () => {
        console.log('🟢 Conectado al servicio de tiempo real de sillas')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'SEAT_UPDATE' && data.seat) {
            const updatedSeat = data.seat
            console.log('📩 WebSocket Update recibido:', updatedSeat) // Log para ver qué llega exactamente
            
            setSeats((prevSeats) => {
            // Si el asiento actualizado pertenece a otro mapa (si existe esa propiedad), lo ignoramos
            if (map && updatedSeat.map && updatedSeat.map !== map) return prevSeats

            // Intentamos obtener el ID correcto buscando en varias propiedades comunes (_id, id, seatId)
            // Priorizamos externalId porque es el ID que usa el frontend (ej: "seat-A8")
            const targetId = updatedSeat.externalId || updatedSeat.seatId || updatedSeat.id || updatedSeat._id

            return prevSeats.map((seat) => {
              const isMatch = String(seat.id) === String(targetId)
              if (isMatch) console.log(`✅ Silla encontrada y actualizada: ${seat.id}`)
              return isMatch
                ? { ...seat, status: updatedSeat.status } 
                : seat
            })
            })
          }
        } catch (error) {
          console.error('Error procesando mensaje WS:', error)
        }
      }

      ws.onclose = () => {
        if (isMounted) {
          console.log('🔴 Desconectado. Intentando reconectar en 3 segundos...')
          reconnectTimeout = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
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
