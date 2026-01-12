"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Seat } from "@/types/seat";

type Props = {
  seats: Seat[];
  onSelect: (id: string) => void;
  mode?: 'client' | 'admin'; // Nueva prop para modo
  selectedSeats?: string[]; // Nueva prop para asientos seleccionados en modo cliente
  svgUrl?: string;
};

const getDefaultSVG = () => `
  <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <!-- Estilos para interactividad -->
    <style>
      .asiento { cursor: pointer; transition: 0.2s; }
      .asiento:hover { opacity: 0.7; }
      .zona-vip { stroke: #B8860B; stroke-width: 2; }
      .zona-general { stroke: #808080; stroke-width: 2; }
      .ocupado { fill: #FF4500 !important; cursor: not-allowed; }
      text { pointer-events: none; user-select: none; }
    </style>

    <!-- ESCENARIO -->
    <rect x="200" y="20" width="400" height="60" rx="10" fill="#2F4F4F" />
    <text x="400" y="58" font-family="Arial" font-size="24" text-anchor="middle" fill="white">ESCENARIO</text>

    <!-- ETAPA 1: SECCIÓN VIP -->
    <g id="etapa-vip" class="zona-vip">
      <text x="50" y="130" font-family="Arial" font-weight="bold" font-size="18" fill="#333">ETAPA 1: VIP</text>
      <rect id="seat-A1" class="asiento" x="100" y="160" width="50" height="50" rx="8" />
      <rect id="seat-A2" class="asiento" x="170" y="160" width="50" height="50" rx="8" />
      <rect id="seat-A3" class="asiento" x="240" y="160" width="50" height="50" rx="8" />
      <text id="text-A1" x="125" y="190" font-family="Arial" font-size="12" text-anchor="middle">A1</text>
      <text id="text-A2" x="195" y="190" font-family="Arial" font-size="12" text-anchor="middle">A2</text>
      <text id="text-A3" x="265" y="190" font-family="Arial" font-size="12" text-anchor="middle">A3</text>
    </g>

    <!-- ETAPA 2: SECCIÓN GENERAL -->
    <g id="etapa-general" class="zona-general">
      <text x="50" y="300" font-family="Arial" font-weight="bold" font-size="18" fill="#333">ETAPA 2: GENERAL</text>
      <rect id="seat-B1" class="asiento" x="100" y="330" width="50" height="50" rx="8" />
      <rect id="seat-B2" class="asiento" x="170" y="330" width="50" height="50" rx="8" />
      <rect id="seat-B3" class="asiento" x="240" y="330" width="50" height="50" rx="8" />
      <rect id="seat-B4" class="asiento" x="310" y="330" width="50" height="50" rx="8" />
      <text id="text-B1" x="125" y="360" font-family="Arial" font-size="12" text-anchor="middle">B1</text>
      <text id="text-B2" x="195" y="360" font-family="Arial" font-size="12" text-anchor="middle">B2</text>
      <text id="text-B3" x="265" y="360" font-family="Arial" font-size="12" text-anchor="middle">B3</text>
      <text id="text-B4" x="335" y="360" font-family="Arial" font-size="12" text-anchor="middle">B4</text>
    </g>
  </svg>
`;

export default function SeatMap({ seats, onSelect, mode = 'client', selectedSeats = [], svgUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fetchedSvg, setFetchedSvg] = useState<string>('');

  const svgContent = useMemo(() => {
    if (svgUrl) {
      return fetchedSvg || getDefaultSVG();
    }
    return getDefaultSVG();
  }, [svgUrl, fetchedSvg]);

  useEffect(() => {
    if (svgUrl) {
      fetch(svgUrl)
        .then(res => res.text())
        .then(setFetchedSvg)
        .catch(() => setFetchedSvg(getDefaultSVG()));
    }
  }, [svgUrl]);

  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    seats.forEach((seat) => {
      const el = containerRef.current!.querySelector<SVGElement>(`#${seat.id}`);

      if (!el) return;

      // 🎨 COLOR (use setAttribute to support different SVG element types)
      let color = "#f87171"; // default red for reserved
      if (seat.status === "available") {
        if (mode === 'client' && selectedSeats.includes(seat.id)) {
          color = "#facc15"; // yellow for selected in client
        } else {
          color = "#4ade80"; // green for available
        }
      }

      try {
        el.setAttribute('fill', color);
      } catch {
        // fallback: set style.fill if setAttribute is not effective
        el.style.fill = color;
      }

      // 🖱️ CURSOR
      const isClickable = mode === 'admin' || seat.status === 'available';
      el.style.cursor = isClickable ? "pointer" : "not-allowed";

      // 🧠 CLICK
      // replace any existing handler so selection stays in sync
      el.onclick = isClickable ? () => onSelect(seat.id) : null;
    });
  }, [seats, onSelect, mode, selectedSeats, svgContent]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{
        __html: svgContent,
      }}
    />
  );
}
