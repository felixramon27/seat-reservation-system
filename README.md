# Seat Reservation System

Proyecto simple para reservar asientos con un frontend en Next.js.

**Estado**: prototipo / demo

## Descripción

- Aplicación para mostrar un mapa de asientos (SVG) y permitir seleccionar asientos disponibles.
- Frontend construido con Next.js + TypeScript. Los datos de ejemplo están en `frontend/src/services/seat.service.ts`.

## Tecnologías

- Frontend: Next.js, React, TypeScript

## Requisitos

- Node.js 16+ y npm (o pnpm/yarn)

## Instrucciones (frontend)

1. Abrir terminal y situarse en la carpeta `frontend`:

```bash
cd frontend
```

1. Instalar dependencias:

```bash
npm install
```

1. Ejecutar en modo desarrollo:

```bash
npm run dev
```

1. Construir para producción:

```bash
npm run build
npm run start
```

## Backend

- Hay una carpeta `backend/` en el repositorio. Revisa `backend/README.md` (si existe) para instrucciones específicas del backend.

## Estructura relevante

- `frontend/src/components/svg/SeatMap.tsx`: componente que renderiza el SVG del mapa y aplica colores/handlers.
- `frontend/src/services/seat.service.ts`: datos de ejemplo (IDs y estados de asientos).
- `frontend/src/hooks/useSeatSelection.ts`: lógica de selección de asientos.

### Notas

- Si cambias el SVG (IDs o tipos de elementos), asegúrate de que los IDs en los datos coincidan o que `SeatMap` sea compatible con los nuevos elementos.

#### Contribuir

- Haz fork, crea una rama y abre un PR con los cambios. Añade una breve descripción de lo que modificas.
