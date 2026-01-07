'use client'

import { useEffect, useRef } from 'react'
import { Seat } from '@/types/seat'

type Props = {
  seats: Seat[]
  onSelect: (id: string) => void
}

export default function SeatMap({ seats, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    seats.forEach(seat => {
      const path = containerRef.current!.querySelector<SVGPathElement>(
        `#${seat.id}`
      )

      if (!path) return

      // 🎨 COLOR
      path.style.fill =
        seat.status === 'available'
          ? '#4ade80'
          : seat.status === 'selected'
          ? '#facc15'
          : '#f87171'

      // 🖱️ CURSOR
      path.style.cursor =
        seat.status === 'reserved' ? 'not-allowed' : 'pointer'

      // 🧠 CLICK
      path.onclick = () => {
        if (seat.status !== 'reserved') {
          onSelect(seat.id)
        }
      }
    })
  }, [seats, onSelect])

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{
        __html: `
          <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
            <g id="zone-vip">
              <path id="seat-A1" d="M10 10 H60 V60 H10 Z" />
              <path id="seat-A2" d="M80 10 H130 V60 H80 Z" />
              <path id="seat-A3" d="M150 10 H200 V60 H150 Z" />
            </g>
          </svg>
        `,
      }}
    />
  )
}
