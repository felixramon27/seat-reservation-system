'use client'

import { useState } from 'react'
import SeatMap from '@/components/svg/SeatMap'
import SvgSelector from '@/components/SvgSelector'
import { useSeatSelection } from '@/hooks/useSeatSelection'

export default function Home() {
  // Load the exported seatmap by default from public/svg
  const [selectedSvg, setSelectedSvg] = useState<string>()
  // Extract filename and strip query string to match backend 'map' stored names
  const mapFile = selectedSvg ? (selectedSvg.split('/').pop() || '').split('?')[0] : ''
  const { seats, selectSeat, mode, setMode, selectedSeats, confirmSelection, confirmBooking, heldSeats, loading } = useSeatSelection(mapFile)

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
        <div style={{ marginBottom: 20, padding: '10px', borderRadius: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            Reservar (5 min)
          </button>
        </div>
      )}

      {/* Botón para Confirmar Compra Definitiva */}
      {heldSeats.length > 0 && mode === 'client' && (
        <div style={{ marginBottom: 20, padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '5px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
            Tienes <b>{heldSeats.length}</b> asientos reservados temporalmente. ¡Confirma tu compra antes de que expire el tiempo!
          </p>
          <button 
            onClick={confirmBooking}
            style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Confirmar Compra Definitiva
          </button>
        </div>
      )}

      <SeatMap seats={seats} onSelect={selectSeat} mode={mode} selectedSeats={selectedSeats} svgUrl={selectedSvg} />
    </main>
  )
}
