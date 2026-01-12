import 'dotenv/config'
import Fastify from 'fastify'
import seatRoutes from './routes/seats'
import svgRoutes from './routes/svg'

const fastify = Fastify({ logger: true })

// Registrar rutas
fastify.register(seatRoutes)
fastify.register(svgRoutes)

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3002 })
    console.log('Server running on http://localhost:3002')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()