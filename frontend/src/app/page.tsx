'use client'

import SeatMap from '@/components/svg/SeatMap'
import { useSeatSelection } from '@/hooks/useSeatSelection'

export default function Home() {
  const { seats, selectSeat, loading } = useSeatSelection()

  if (loading) return <div>Loading...</div>

  return (
    <main style={{ padding: 40 }}>
      <h1>Seat Reservation</h1>
      <SeatMap seats={seats} onSelect={selectSeat} />
    </main>
  )
}
