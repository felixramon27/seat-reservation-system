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
  const [svgPrefix, setSvgPrefix] = useState<string>('');
  const svgOriginalIdsRef = useRef<Set<string>>(new Set())

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
          .then((text) => {
            // create a short unique prefix for this SVG instance
            const prefix = 'map' + Date.now()
            setSvgPrefix(prefix)

            try {
              // Parse the SVG text into a DOM, so we safely update id attributes
              const parser = new DOMParser()
              const doc = parser.parseFromString(text, 'image/svg+xml')
              const svgEl = doc.documentElement
              if (svgEl) {
                svgOriginalIdsRef.current = new Set()
                // find all elements with an id attribute
                const nodes = svgEl.querySelectorAll('[id]')
                nodes.forEach((n) => {
                  const original = n.getAttribute('id')
                  if (original) {
                    svgOriginalIdsRef.current.add(original)
                    n.setAttribute('data-original-id', original)
                    n.setAttribute('id', `${prefix}-${original}`)
                  }
                })

                // Heuristic: if seats are represented by a label (text) but the shape has no id,
                // try to map text content like 'A4' or 'B12' to a nearby shape in the same group.
                const textNodes = svgEl.querySelectorAll('text')
                textNodes.forEach(t => {
                  const label = (t.textContent || '').trim()
                  if (!label) return
                  // accept labels like A1, B12, etc.
                  if (!/^([A-Z]{1}\d{1,2})$/.test(label)) return
                  const seatId = `seat-${label}`
                  // if we already found this id, skip
                  if (svgOriginalIdsRef.current.has(seatId)) return
                  // try to find a sibling shape inside the same parent <g>
                  const parent = t.parentElement
                  if (!parent) return
                  const shape = Array.from(parent.children).find(ch => /^(rect|circle|path|ellipse)$/i.test(ch.tagName) && !ch.getAttribute('id')) as Element | undefined
                  if (shape) {
                    svgOriginalIdsRef.current.add(seatId)
                    shape.setAttribute('data-original-id', seatId)
                    shape.setAttribute('id', `${prefix}-${seatId}`)
                  }
                })
                // ensure the root svg isn't malformed
                const serializer = new XMLSerializer()
                const transformed = serializer.serializeToString(svgEl)
                setFetchedSvg(transformed)
                return
              }
            } catch (e) {
              // fallback to original text if parsing fails
              console.warn('SeatMap: DOMParser failed, falling back to raw text', e)
              // try to extract ids with a regex as a best-effort fallback
              try {
                const ids: string[] = []
                const idRegex = /\sid=["']?([a-zA-Z0-9_-]+)["']?/g
                let m: RegExpExecArray | null
                while ((m = idRegex.exec(text)) !== null) {
                  if (m[1]) ids.push(m[1])
                }
                svgOriginalIdsRef.current = new Set(ids)
              } catch (err) {
                svgOriginalIdsRef.current = new Set()
              }
            }
            // fallback
            setFetchedSvg(text)
          })
        .catch(() => setFetchedSvg(getDefaultSVG()));
    }
  }, [svgUrl]);

  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    // Debug lists
    const found: string[] = []
    const missing: string[] = []

    // If no ids were detected for this SVG, skip processing to avoid updating other maps
    if (svgOriginalIdsRef.current.size === 0) {
      console.log(`SeatMap: svgUrl=${svgUrl} - no element ids detected for this SVG, skipping seat updates.`)
      return
    }

    seats.forEach((seat) => {
      // If we have a list of original ids for this SVG, skip seats not belonging to it
      if (svgOriginalIdsRef.current.size > 0 && !svgOriginalIdsRef.current.has(seat.id)) {
        missing.push(seat.id)
        return
      }
      // try with prefixed id first (when SVG was transformed), otherwise fallback to raw id
      const prefixedId = svgPrefix ? `#${svgPrefix}-${seat.id}` : null
      let el: SVGElement | null = null
      if (prefixedId) el = containerRef.current!.querySelector<SVGElement>(prefixedId)
      if (!el) el = containerRef.current!.querySelector<SVGElement>(`#${seat.id}`)

      if (!el) {
        missing.push(seat.id)
        return;
      }
      found.push(seat.id)

      // 🎨 COLOR (use setAttribute + inline style). Mapping: available=black, selected=green, reserved=grey
      let color = '#9ca3af' // grey reserved
      if (seat.status === 'available') color = '#000000'
      if (mode === 'client' && selectedSeats.includes(seat.id)) color = '#22c55e'

      try {
        el.setAttribute('fill', color)
      } catch (e) {
        /* ignore */
      }
      // also set inline style to ensure CSS rules don't override
      try {
        el.style.setProperty('fill', color, 'important')
        el.style.fill = color
      } catch (e) {
        /* ignore */
      }

      // 🖱️ CURSOR
      const isClickable = mode === 'admin' || seat.status === 'available' || (mode === 'client' && selectedSeats.includes(seat.id))
      try { el.style.cursor = isClickable ? 'pointer' : 'not-allowed' } catch {}

      // 🧠 CLICK
      el.onclick = isClickable ? () => onSelect(seat.id) : null
    })

    // diagnostics for developer (always log for easier debugging)
    console.log(`SeatMap: svgUrl=${svgUrl} seats total=${seats.length}, found=${found.length}, missing=${missing.length}`)
    if (missing.length) console.log('SeatMap: missing ids sample:', missing.slice(0, 10))
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
