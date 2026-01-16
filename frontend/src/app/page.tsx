'use client'

import { useState } from 'react'
import SeatMap from '@/components/svg/SeatMap'
import SvgSelector from '@/components/SvgSelector'
import { useSeatSelection } from '@/hooks/useSeatSelection'

export default function Home() {
  const { seats, selectSeat, mode, setMode, selectedSeats, confirmSelection, loading } = useSeatSelection()
  const [selectedSvg, setSelectedSvg] = useState<string>('')

  if (loading) return <div>Cargando...</div>

  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>Reserva de Asientos</h1>
      
      <SvgSelector onSelectSvg={setSelectedSvg} selectedSvg={selectedSvg} isAdmin={mode === 'admin'} />
      
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => setMode('client')} 
          disabled={mode === 'client'}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: mode === 'client' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: mode === 'client' ? 'not-allowed' : 'pointer'
          }}
        >
          Modo Cliente
        </button>
        <button 
          onClick={() => setMode('admin')} 
          disabled={mode === 'admin'}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'admin' ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: mode === 'admin' ? 'not-allowed' : 'pointer'
          }}
        >
          Modo Administrador
        </button>
      </div>
      <p>
        {mode === 'client'
          ? 'Haz clic en asientos disponibles para seleccionarlos. Los asientos reservados no son seleccionables.'
          : 'Haz clic en asientos disponibles para reservarlos, haz clic en asientos reservados para liberarlos.'}
      </p>
      {selectedSeats.length > 0 && mode === 'client' && (
        <div style={{ marginBottom: 20, padding: '10px', borderRadius: '5px' }}>
          <p>Asientos seleccionados: {selectedSeats.join(', ')}</p>
          <button 
            onClick={confirmSelection}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Confirmar Reserva
          </button>
        </div>
      )}
      <SeatMap seats={seats} onSelect={selectSeat} mode={mode} selectedSeats={selectedSeats} svgUrl={selectedSvg} />
    </main>
  )
}
