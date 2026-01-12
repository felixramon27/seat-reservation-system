import { FastifyInstance } from 'fastify'
import Seat from '../models/Seat'

export default async function seatRoutes(fastify: FastifyInstance) {
  // Obtener todos los asientos
  fastify.get('/seats', async (request, reply) => {
    try {
      const seats = await Seat.find()
      return seats
    } catch (error) {
      reply.code(500).send({ error: 'Error fetching seats' })
    }
  })

  // Reservar un asiento
  fastify.post('/seats/reserve', async (request, reply) => {
    const { seatId } = request.body as { seatId: string }
    try {
      const seat = await Seat.findOneAndUpdate(
        { id: seatId, status: 'available' },
        { status: 'reserved' },
        { new: true }
      )
      if (!seat) {
        return reply.code(400).send({ error: 'Seat not available' })
      }
      return seat
    } catch (error) {
      reply.code(500).send({ error: 'Error reserving seat' })
    }
  })

  // Liberar un asiento
  fastify.post('/seats/release', async (request, reply) => {
    const { seatId } = request.body as { seatId: string }
    try {
      const seat = await Seat.findOneAndUpdate(
        { id: seatId, status: 'reserved' },
        { status: 'available' },
        { new: true }
      )
      if (!seat) {
        return reply.code(400).send({ error: 'Seat not reserved' })
      }
      return seat
    } catch (error) {
      reply.code(500).send({ error: 'Error releasing seat' })
    }
  })

  // Inicializar asientos
  fastify.post('/seats/init', async (request, reply) => {
    const mockSeats = [
      { id: 'seat-A1', status: 'available' },
      { id: 'seat-A2', status: 'reserved' },
      { id: 'seat-A3', status: 'available' },
      { id: 'seat-B1', status: 'reserved' },
      { id: 'seat-B2', status: 'available' },
      { id: 'seat-B3', status: 'available' },
      { id: 'seat-B4', status: 'reserved' },
    ]
    try {
      await Seat.insertMany(mockSeats)
      return { message: 'Seats initialized' }
    } catch (error) {
      reply.code(500).send({ error: 'Error initializing seats' })
    }
  })
}