import { FastifyInstance } from 'fastify'
import Seat, { ISeat } from '../models/Seat'

export default async function seatRoutes(fastify: FastifyInstance) {
  // Obtener todos los asientos
  fastify.get('/seats', async (request, reply) => {
    try {
      const query = request.query as { map?: string }
      const filter: any = {}
      if (query?.map) filter.map = query.map
      const seats = await Seat.find(filter)
      return seats
    } catch (error) {
      console.error('Error fetching seats:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Reservar un asiento
  fastify.post('/seats/reserve', async (request, reply) => {
    try {
      const { map, seatId } = request.body as { map?: string, seatId: string }
      
      // Construimos el ID único que se usa en la base de datos
      const dbId = map ? `${map}::${seatId}` : seatId

      // Operación Atómica: Busca Y Actualiza solo si el estado es 'available'
      const seat = await Seat.findOneAndUpdate(
        { id: dbId, status: 'available' },
        { 
          status: 'reserved',
          // Establecemos expiración a 5 minutos desde ahora
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
        } as any, // Cast a any por si no has actualizado la interfaz ISeat aún
        { new: true } // Devuelve el documento actualizado
      )

      if (!seat) {
        // Si es null, significa que no existía o que alguien más la ganó por milisegundos
        return reply.code(409).send({ error: 'La silla ya no está disponible.' })
      }
      return seat
    } catch (error) {
      console.error('Error reserving seat:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Confirmar reserva (Hacerla permanente)
  fastify.post('/seats/confirm', async (request, reply) => {
    try {
      const { map, seatId } = request.body as { map?: string, seatId: string }
      const dbId = map ? `${map}::${seatId}` : seatId

      // Busca una silla que esté reservada y actualízala para quitar la expiración
      const seat = await Seat.findOneAndUpdate(
        { id: dbId, status: 'reserved' },
        { 
          $unset: { expiresAt: 1 } // Elimina el campo expiresAt para que no se libere nunca
        },
        { new: true }
      )

      if (!seat) {
        return reply.code(404).send({ error: 'Reserva no encontrada o expirada.' })
      }
      return seat
    } catch (error) {
      console.error('Error confirming seat:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })

  // Liberar un asiento
  fastify.post('/seats/release', async (request, reply) => {
    try {
      const { map, seatId } = request.body as { map?: string, seatId: string }
      console.log('Release request for seatId=', seatId, 'map=', map)
      let seat
      if (map) seat = await Seat.findOne({ id: `${map}::${seatId}` })
      else seat = await Seat.findOne({ id: seatId })
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
      // Generate seats to match SVG: A1..A18 and B1..B25
      const seatsA = Array.from({ length: 18 }, (_, i) => ({ id: `seat-A${i + 1}`, status: 'available' }))
      const seatsB = Array.from({ length: 25 }, (_, i) => ({ id: `seat-B${i + 1}`, status: 'available' }))
      const allSeats = [...seatsA, ...seatsB]
      // Remove existing to avoid duplicates
      await Seat.deleteMany({})
      await Seat.insertMany(allSeats)
      return { message: 'Seats seeded (A1..A18, B1..B25)' }
    } catch (error) {
      console.error('Error seeding seats:', error)
      reply.code(500).send({ error: 'Database error' })
    }
  })
}