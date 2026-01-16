import { FastifyInstance } from 'fastify'
import Seat, { ISeat } from '../models/Seat'

export default async function seatRoutes(fastify: FastifyInstance) {
  // Obtener todos los asientos
  fastify.get('/seats', async (request, reply) => {
    try {
      const seats = await Seat.find()
      return seats
    } catch (error) {
      console.error('Error fetching seats:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Reservar un asiento
  fastify.post('/seats/reserve', async (request, reply) => {
    try {
      const { seatId } = request.body as { seatId: string }
      const seat = await Seat.findOne({ id: seatId })
      if (!seat || seat.status !== 'available') {
        return reply.code(400).send({ error: 'Seat not available' })
      }
      seat.status = 'reserved'
      await seat.save()
      return seat
    } catch (error) {
      console.error('Error reserving seat:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Liberar un asiento
  fastify.post('/seats/release', async (request, reply) => {
    try {
      const { seatId } = request.body as { seatId: string }
      console.log('Release request for seatId=', seatId)
      const seat = await Seat.findOne({ id: seatId })
      if (!seat) {
        console.log('Seat not found:', seatId)
        return reply.code(404).send({ error: 'Seat not found' })
      }
      if (seat.status !== 'reserved') {
        console.log('Seat not reserved:', seatId, 'status=', seat.status)
        return reply.code(400).send({ error: 'Seat not reserved' })
      }
      seat.status = 'available'
      await seat.save()
      console.log('Seat released:', seatId)
      return seat
    } catch (error) {
      console.error('Error releasing seat:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Seed asientos (para desarrollo)
  fastify.post('/seats/seed', async (request, reply) => {
    try {
      const mockSeats = [
        { id: 'seat-A1', status: 'available' },
        { id: 'seat-A2', status: 'reserved' },
        { id: 'seat-A3', status: 'available' },
        { id: 'seat-B1', status: 'reserved' },
        { id: 'seat-B2', status: 'available' },
        { id: 'seat-B3', status: 'available' },
        { id: 'seat-B4', status: 'reserved' },
      ]
      await Seat.insertMany(mockSeats)
      return { message: 'Seats seeded' }
    } catch (error) {
      console.error('Error seeding seats:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })
}