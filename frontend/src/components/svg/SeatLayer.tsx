import Seat from './Seat'
import { Seat as SeatType } from '@/types/seat'

type Props = {
  seats: SeatType[]
  onSelect: (id: string) => void
}

export default function SeatLayer({ seats, onSelect }: Props) {
  return (
    <g>
      {seats.map(seat => (
        <Seat key={seat.id} seat={seat} onSelect={onSelect} />
      ))}
    </g>
  )
}
