"use client"
import React, { useEffect, useRef, useState } from 'react'
import InlineSvg from '@/components/InlineSvg'
import { useSeatSelection } from '@/hooks/useSeatSelection_new'

export default function SeatDemoPage() {
  const { seats, selectSeat, confirmSelection, clearSelection, loading } = useSeatSelection()
  // InlineSvg now receives `seats` and handles mapping/styling internally.

  const handleSeatClick = (index: number, el: Element) => {
    const seatId = el.getAttribute('data-seat-id')
    if (!seatId) return
    selectSeat(seatId)
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>Seat demo</h2>
        <InlineSvg
          src="/svg/Vector (1).svg"
          seatFills={["#FFD900"]}
          removeDefs={true}
          onSeatClick={handleSeatClick}
          seats={seats}
        />
      </div>

      <aside style={{ width: 300 }}>
        <h3>Seats</h3>
        {loading && <div>Loading seats...</div>}
        {!loading && (
          <ul>
            {seats.map(s => (
              <li key={s.id}>{s.id} — {s.status}</li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 12 }}>
          <button onClick={() => confirmSelection()}>Confirm</button>
          <button onClick={() => clearSelection()} style={{ marginLeft: 8 }}>Clear</button>
        </div>
      </aside>
    </div>
  )
}
