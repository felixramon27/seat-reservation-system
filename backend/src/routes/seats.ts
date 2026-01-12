import { FastifyInstance } from 'fastify'
import { SeatStatus } from '../models/Seat'

// Tipo simple para desarrollo
interface ISeat {
  id: string
  status: SeatStatus
}

// Array en memoria para desarrollo
let seats: ISeat[] = [
  { id: 'seat-A1', status: 'available' },
  { id: 'seat-A2', status: 'reserved' },
  { id: 'seat-A3', status: 'available' },
  { id: 'seat-B1', status: 'reserved' },
  { id: 'seat-B2', status: 'available' },
  { id: 'seat-B3', status: 'available' },
  { id: 'seat-B4', status: 'reserved' },
]

export default async function seatRoutes(fastify: FastifyInstance) {
  // Obtener todos los asientos
  fastify.get('/seats', async (request, reply) => {
    return seats
  })

  // Reservar un asiento
  fastify.post('/seats/reserve', async (request, reply) => {
    const { seatId } = request.body as { seatId: string }
    const seatIndex = seats.findIndex(s => s.id === seatId)
    if (seatIndex === -1 || seats[seatIndex].status !== 'available') {
      return reply.code(400).send({ error: 'Seat not available' })
    }
    seats[seatIndex].status = 'reserved'
    return seats[seatIndex]
  })

  // Inicializar asientos (ya están inicializados)
  fastify.post('/seats/init', async (request, reply) => {
    seats = [
      { id: 'seat-A1', status: 'available' },
      { id: 'seat-A2', status: 'reserved' },
      { id: 'seat-A3', status: 'available' },
      { id: 'seat-B1', status: 'reserved' },
      { id: 'seat-B2', status: 'available' },
      { id: 'seat-B3', status: 'available' },
      { id: 'seat-B4', status: 'reserved' },
    ]
    return { message: 'Seats initialized' }
  })
}