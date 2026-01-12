import { FastifyInstance } from 'fastify'
import Seat, { ISeat } from '../models/Seat'

export default async function seatRoutes(fastify: FastifyInstance) {
  // Obtener todos los asientos
  fastify.get('/seats', async (request, reply) => {
    const seats = await Seat.find()
    return seats
  })

  // Reservar un asiento
  fastify.post('/seats/reserve', async (request, reply) => {
    const { seatId } = request.body as { seatId: string }
    const seat = await Seat.findOne({ id: seatId })
    if (!seat || seat.status !== 'available') {
      return reply.code(400).send({ error: 'Seat not available' })
    }
    seat.status = 'reserved'
    await seat.save()
    return seat
  })

  // Liberar un asiento
  fastify.post('/seats/release', async (request, reply) => {
    const { seatId } = request.body as { seatId: string }
    const seat = await Seat.findOne({ id: seatId })
    if (!seat || seat.status !== 'reserved') {
      return reply.code(400).send({ error: 'Seat not reserved' })
    }
    seat.status = 'available'
    await seat.save()
    return seat
  })
}