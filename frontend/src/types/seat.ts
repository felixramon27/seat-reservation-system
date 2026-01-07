export type SeatStatus = 'available' | 'selected' | 'reserved'

export type Seat = {
  id: string
  status: SeatStatus
}
