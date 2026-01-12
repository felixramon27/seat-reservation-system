import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'

const svgDir = path.resolve(__dirname, '../../svgs')
console.log('SVG Dir:', svgDir)
if (!fs.existsSync(svgDir)) {
  fs.mkdirSync(svgDir, { recursive: true })
  console.log('Created SVG dir')
}

export default async function svgRoutes(fastify: FastifyInstance) {
  // Subir SVG (guardar localmente)
  fastify.post('/svg/upload', async (request, reply) => {
    const { fileName, svgContent } = request.body as { fileName: string, svgContent: string }
    console.log('Uploading:', fileName, svgContent.substring(0, 50))
    try {
      const filePath = path.join(svgDir, fileName)
      fs.writeFileSync(filePath, svgContent)
      console.log('Saved to:', filePath)
      const url = `http://localhost:3002/svg/${fileName}`
      return { url }
    } catch (error) {
      console.error('Error:', error)
      reply.code(500).send({ error: 'Error uploading SVG' })
    }
  })

  // Obtener SVG
  fastify.get('/svg/:fileName', async (request, reply) => {
    const { fileName } = request.params as { fileName: string }
    try {
      const filePath = path.join(svgDir, fileName)
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'SVG not found' })
      }
      const svg = fs.readFileSync(filePath, 'utf-8')
      reply.type('image/svg+xml').send(svg)
    } catch (error) {
      reply.code(500).send({ error: 'Error fetching SVG' })
    }
  })
}