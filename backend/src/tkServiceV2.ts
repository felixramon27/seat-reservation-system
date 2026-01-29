import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Importamos tu modelo existente (asegúrate que la ruta sea correcta)
import Seat from './models/Seat'; 

dotenv.config();

const start = async () => {
  // ---------------------------------------------------------
  // 1. Servidor HTTP (Puerto 5000) - TKServiceV2
  // ---------------------------------------------------------
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: '*' });

  app.get('/', async () => {
    return { service: 'TKServiceV2', status: 'online', type: 'Microservicio de Tiempo Real' };
  });

  // ---------------------------------------------------------
  // 2. Servidor WebSocket (Puerto 5001)
  // ---------------------------------------------------------
  const wsApp = Fastify({ logger: false }); // Logger false para menos ruido en consola
  await wsApp.register(cors, { origin: '*' });
  await wsApp.register(websocket);

  // Mantenemos un registro de los clientes conectados
  const clients = new Set<any>();

  wsApp.register(async function (fastify) {
    // Usamos 'as any' en las opciones para evitar el error TS2353 y tipamos connection como SocketStream
    fastify.get('/', { websocket: true } as any, (connection: any, req) => {
      console.log('🔌 Cliente conectado al WebSocket (Puerto 5001)');
      // Obtenemos el socket real de forma segura (puede ser connection o connection.socket)
      const socket = connection.socket || connection;

      if (!socket || typeof socket.send !== 'function') {
        return;
      }

      clients.add(socket);

      socket.on('close', () => {
        clients.delete(socket);
        console.log('❌ Cliente desconectado');
      });
      
      // Mensaje de bienvenida
      socket.send(JSON.stringify({ type: 'WELCOME', message: 'Conectado a TKServiceV2 Realtime' }));
    });
  });

  // ---------------------------------------------------------
  // 3. Escuchador de Base de Datos (MongoDB Change Streams)
  // ---------------------------------------------------------
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI no definida');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas para escuchar cambios');

    // Aquí ocurre la magia: .watch() escucha cambios en tiempo real en la colección
    const changeStream = Seat.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
      // Solo nos interesan actualizaciones (reservas) o inserciones
      if (change.operationType === 'update' || change.operationType === 'insert' || change.operationType === 'replace') {
        
        const document = (change as any).fullDocument;
         // Usamos un fallback para el ID en el log para evitar "undefined"
        const docId = document.seatId || document.id || document._id;
        console.log(`🔄 Cambio detectado en silla ${docId}: ${document.status}`);

        // Preparamos el mensaje para enviar a los clientes
        const payload = JSON.stringify({
          type: 'SEAT_UPDATE',
          seat: document // Enviamos la silla actualizada completa
        });

        // Emitir el evento a TODOS los clientes conectados
        clients.forEach((client) => {
          if (client && client.readyState === 1) { // 1 = OPEN
            client.send(payload);
          }
        });
      }
    });

  } catch (err) {
    console.error('Error conectando a Mongo:', err);
    process.exit(1);
  }

  // ---------------------------------------------------------
  // 4. Iniciar Servidores
  // ---------------------------------------------------------
  try {
    await app.listen({ port: 5000, host: '0.0.0.0' });
    console.log('🚀 TKServiceV2 HTTP corriendo en http://localhost:5000');
    
    await wsApp.listen({ port: 5001, host: '0.0.0.0' });
    console.log('📡 TKServiceV2 WebSocket corriendo en ws://localhost:5001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
