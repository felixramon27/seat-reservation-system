'use client'

import SeatMap from '@/components/svg/SeatMap'
import { useSeatSelection } from '@/hooks/useSeatSelection'
import { getMockSeats } from '@/services/seat.service'

export default function Home() {
  const { seats, selectSeat } = useSeatSelection(getMockSeats())

  return (
    <main style={{ padding: 40 }}>
      <h1>Seat Reservation</h1>
      <SeatMap seats={seats} onSelect={selectSeat} />
    </main>
  )
}
