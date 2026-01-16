import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'

export default async function svgRoutes(fastify: FastifyInstance) {
  // Subir SVG a Supabase storage
  fastify.post('/svg/upload', async (request, reply) => {
    const { fileName, svgContent } = request.body as { fileName: string, svgContent: string }
    console.log('Uploading:', fileName)
    try {
      // Supabase storage in Node expects a Buffer or stream for upload
      const buffer = Buffer.from(svgContent, 'utf-8')
      const { data, error } = await supabase.storage
        .from('svgs')
        .upload(fileName, buffer, {
          contentType: 'image/svg+xml',
          upsert: true
        })
      if (error) {
        console.error('Supabase upload error:', error)
        const details = typeof error === 'object' ? JSON.stringify(error) : String(error)
        return reply.code(500).send({ error: 'Supabase upload error', details })
      }

      console.log('Upload data:', data)
      const urlRes = supabase.storage.from('svgs').getPublicUrl(fileName)
      const publicUrl = urlRes.data?.publicUrl
      console.log('Public URL:', publicUrl)
      return { url: publicUrl, fileName }
    } catch (error) {
      console.error('Error uploading SVG (catch):', error)
      const details = (error && typeof error === 'object') ? JSON.stringify(error) : String(error)
      reply.code(500).send({ error: 'Error uploading SVG', details })
    }
  })

  // Listar SVGs en Supabase storage
  fastify.get('/svg/list', async (request, reply) => {
    try {
      const { data, error } = await supabase.storage
        .from('svgs')
        .list()
      if (error) throw error
      const svgs = data.map(file => ({
        name: file.name,
        url: supabase.storage.from('svgs').getPublicUrl(file.name).data.publicUrl
      }))
      return svgs
    } catch (error) {
      console.error('Error listing SVGs:', error)
      const details = (error && typeof error === 'object') ? JSON.stringify(error) : String(error)
      reply.code(500).send({ error: 'Error listing SVGs', details })
    }
  })

  // Debug route to check Supabase connection and bucket
  fastify.get('/svg/debug', async (request, reply) => {
    try {
      const { data, error } = await supabase.storage.from('svgs').list()
      if (error) {
        const details = typeof error === 'object' ? JSON.stringify(error) : String(error)
        console.error('Supabase list error:', error)
        return reply.code(500).send({ error: 'Supabase list error', details })
      }
      return { bucket: 'svgs', count: data.length, files: data.map(f => f.name) }
    } catch (err) {
      console.error('Supabase debug error:', err)
      const details = (err && typeof err === 'object') ? JSON.stringify(err) : String(err)
      reply.code(500).send({ error: 'Supabase debug error', details })
    }
  })

  // Obtener SVG (opcional, ruta con prefijo para evitar choque con /svg/debug)
  fastify.get('/svg/file/:fileName', async (request, reply) => {
    const { fileName } = request.params as { fileName: string }
    try {
      const { data, error } = await supabase.storage
        .from('svgs')
        .download(fileName)
      if (error) {
        const details = typeof error === 'object' ? JSON.stringify(error) : String(error)
        console.error('Supabase download error:', error)
        return reply.code(500).send({ error: 'Error downloading SVG', details })
      }
      reply.type('image/svg+xml').send(data)
    } catch (error) {
      const details = (error && typeof error === 'object') ? JSON.stringify(error) : String(error)
      reply.code(500).send({ error: 'Error fetching SVG', details })
    }
  })

  // Eliminar SVG (admin)
  fastify.delete('/svg/:fileName', async (request, reply) => {
    const { fileName } = request.params as { fileName: string }
    try {
      console.log('Delete request for', fileName)
      const { data, error } = await supabase.storage.from('svgs').remove([fileName])
      if (error) {
        const details = typeof error === 'object' ? JSON.stringify(error) : String(error)
        console.error('Supabase remove error:', error)
        return reply.code(500).send({ error: 'Supabase remove error', details })
      }
      return { removed: data }
    } catch (err) {
      console.error('Error removing SVG:', err)
      const details = (err && typeof err === 'object') ? JSON.stringify(err) : String(err)
      reply.code(500).send({ error: 'Error removing SVG', details })
    }
  })
}