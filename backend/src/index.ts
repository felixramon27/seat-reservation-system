import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import connectDB from './database'
import seatRoutes from './routes/seats'
import svgRoutes from './routes/svg'

const fastify = Fastify({ logger: true })

// Log all incoming requests (method + url)
fastify.addHook('onRequest', async (request, reply) => {
  console.log('Incoming:', request.method, request.url)
})

// Registrar CORS
fastify.register(cors, {
  origin: true, // Permitir todas las origines para desarrollo
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflight: true
})

// Registrar rutas
fastify.register(seatRoutes)
fastify.register(svgRoutes)

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await connectDB()
    await fastify.listen({ port: 3002 })
    console.log('Server running on http://localhost:3002')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()