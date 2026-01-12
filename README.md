# Sistema de Reserva de Asientos

Una aplicación full-stack completa para la reserva de asientos en eventos, con modos cliente y administrador, persistencia en MongoDB Atlas y una interfaz intuitiva en español.

**Estado**: Funcional / Listo para producción

## Descripción

Esta aplicación permite visualizar un mapa de asientos interactivo (SVG) y gestionar reservas de manera eficiente. Incluye dos modos de operación:

- **Modo Cliente**: Seleccionar y reservar asientos disponibles
- **Modo Administrador**: Liberar asientos reservados para gestión

Características principales:

- Mapa de asientos visual con colores dinámicos
- Persistencia de datos en MongoDB Atlas
- API REST con Fastify
- Interfaz en español con estilos mejorados
- Manejo de errores y estados offline

## Tecnologías

### Frontend

- **Next.js 16** con App Router
- **React** con hooks personalizados
- **TypeScript** para type safety
- **Tailwind CSS** (estilos inline para simplicidad)

### Backend

- **Fastify** para API REST de alto rendimiento
- **MongoDB Atlas** con Mongoose ODM
- **TypeScript** y validación de datos
- **CORS** habilitado para desarrollo

### Infraestructura

- **MongoDB Atlas** para base de datos en la nube
- **Google Cloud Storage** (planeado para SVGs)
- **Supabase** (integración preparada)

## Requisitos Previos

- Node.js 18+ y npm
- Cuenta en MongoDB Atlas
- (Opcional) Cuenta en Supabase para futuras funcionalidades

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/felixramon27/seat-reservation-system.git
cd seat-reservation-system
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:

```env
MONGODB_URI=mongodb+srv://usuario:password
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
PORT=3001
```

**Nota**: Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas.

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
```

El frontend se conecta al backend en `http://localhost:3001` por defecto.

## Ejecución

### Desarrollo

1. **Backend** (terminal 1):

   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend** (terminal 2):

   ```bash
   cd frontend
   npm run dev
   ```

Accede a `http://localhost:3000` en tu navegador.

### Producción

1. **Backend**:

   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Frontend**:

   ```bash
   cd frontend
   npm run build
   npm start
   ```

## Uso de la Aplicación

### Modo Cliente

1. Haz clic en "Modo Cliente"
2. Selecciona asientos disponibles (se ponen amarillos)
3. Revisa los asientos seleccionados en la lista
4. Haz clic en "Confirmar Reserva" para reservarlos definitivamente

### Modo Administrador

1. Haz clic en "Modo Administrador"
2. Haz clic en asientos reservados (rojos) para liberarlos (vuelven verdes)

### Estados de Asientos

- **Verde**: Disponible
- **Amarillo**: Seleccionado (modo cliente)
- **Rojo**: Reservado
- **Texto negro**: Seleccionado en modo cliente

## Estructura del Proyecto

```bash
seat-reservation-system/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Página principal con modos
│   │   ├── components/
│   │   │   └── svg/
│   │   │       ├── SeatMap.tsx    # Componente del mapa SVG
│   │   │       └── Seat.tsx       # Componente individual (no usado)
│   │   ├── hooks/
│   │   │   └── useSeatSelection.ts # Lógica de selección y API
│   │   ├── services/
│   │   │   └── seat.service.ts    # Cliente API REST
│   │   └── types/
│   │       └── seat.ts            # Tipos TypeScript
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── database.ts            # Conexión MongoDB
│   │   ├── models/
│   │   │   └── Seat.ts            # Modelo Mongoose
│   │   ├── routes/
│   │   │   └── seats.ts           # Endpoints API
│   │   └── index.ts               # Servidor Fastify
│   ├── .env                       # Variables de entorno
│   └── package.json
└── README.md
```

## API Endpoints

### GET /seats

Obtiene todos los asientos con sus estados.

### POST /seats/reserve

Reserva un asiento.

```json
{
  "seatId": "A1"
}
```

### POST /seats/release

Libera un asiento reservado.

```json
{
  "seatId": "A1"
}
```

## Desarrollo y Personalización

### Agregar Nuevos Asientos

1. Actualizar el SVG en `SeatMap.tsx`
2. Asegurar IDs únicos (ej: `seat-C1`)
3. Agregar textos correspondientes con IDs (ej: `text-C1`)

### Personalización

- **Colores**: Modificar en `SeatMap.tsx`
- **Estilos**: Actualizar en `page.tsx`
- **Idioma**: Cambiar textos en componentes

### Testing

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

## Despliegue

### MongoDB Atlas

- Crear cluster gratuito
- Obtener connection string
- Configurar IP whitelist

### Vercel (Frontend)

```bash
npm i -g vercel
vercel --prod
```

### Railway/Heroku (Backend)

```bash
# Configurar variables de entorno
# Desplegar con git push
```

## Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## Licencia

MIT - Ver [LICENSE](LICENSE)

## Soporte

Para preguntas o issues, abre un ticket en GitHub o contacta al maintainer.
