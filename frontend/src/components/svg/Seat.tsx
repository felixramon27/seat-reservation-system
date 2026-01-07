import { Seat as SeatType } from '@/types/seat'

type Props = {
  seat: SeatType
  onSelect: (id: string) => void
}

export default function Seat({ seat, onSelect }: Props) {
  const getColor = () => {
    switch (seat.status) {
      case 'available':
        return '#4ade80'
      case 'selected':
        return '#facc15'
      case 'reserved':
        return '#f87171'
    }
  }

  return (
    <path
      id={seat.id}
    //   d={seat.path}
      fill={getColor()}
      onClick={() => onSelect(seat.id)}
      style={{ cursor: seat.status === 'reserved' ? 'not-allowed' : 'pointer' }}
    />
  )
}
