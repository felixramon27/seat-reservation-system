"use client"
import React, { useEffect, useRef, useState } from "react";
import fetchAndInlineSVG from "../services/svgSanitizer";
import type { Seat } from "@/types/seat";

type Props = {
  src: string;
  seatFills?: string[];
  removeDefs?: boolean;
  className?: string;
  onSeatClick?: (index: number, el: Element) => void;
  onSvgLoaded?: (svg: SVGElement) => void;
  seats?: Seat[];
};

export default function InlineSvg({ src, seatFills, removeDefs, className, onSeatClick, onSvgLoaded, seats }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seatElsRef = useRef<Element[] | null>(null);

  const onSeatClickRef = useRef(onSeatClick);
  const onSvgLoadedRef = useRef(onSvgLoaded);
  useEffect(() => { onSeatClickRef.current = onSeatClick }, [onSeatClick]);
  useEffect(() => { onSvgLoadedRef.current = onSvgLoaded }, [onSvgLoaded]);

  useEffect(() => {
    let mounted = true;
    let appended: SVGElement | null = null;
    let container: HTMLDivElement | null = null;

    (async () => {
      try {
        const svg = await fetchAndInlineSVG(src, { seatFills, removeDefs, onSeat: () => {} });
        if (!mounted) return;
        appended = svg;
        if (containerRef.current) {
          // capture container for later cleanup
          container = containerRef.current;

          // Clear previous
          container.innerHTML = "";
          container.appendChild(svg);

          // expose svg to caller (stable ref used)
          onSvgLoadedRef.current?.(svg);

          // collect seat elements (once) and keep reference
          seatElsRef.current = Array.from(svg.querySelectorAll('.seat'));

          // Delegate click on seats using stable ref
          const clickHandler = (ev: MouseEvent) => {
            const target = ev.target as Element | null;
            if (!target) return;
            const seat = target.closest('.seat') as Element | null;
            if (seat) {
              const idxAttr = seat.getAttribute('data-seat-index');
              const n = idxAttr ? Number(idxAttr) : NaN;
              onSeatClickRef.current?.(n, seat);
            }
          };

          svg.addEventListener('click', clickHandler as EventListener);

          // store handler on element for cleanup
          (svg as SVGElement & { __inlineSvgCleanup?: () => void }).__inlineSvgCleanup = () => svg.removeEventListener('click', clickHandler as EventListener);
        }
      } catch (e: unknown) {
        console.error('InlineSvg error', e);
        if (mounted) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError(String(e));
          }
        }
      }
    })();

    return () => {
      mounted = false;
      if (appended) {
        try {
          const cleanup = (appended as SVGElement & { __inlineSvgCleanup?: () => void }).__inlineSvgCleanup;
          if (typeof cleanup === 'function') cleanup();
        } catch {}
        if (container && appended.parentNode === container) container.removeChild(appended);
      }
    };
  }, [src, seatFills, removeDefs]);

  // Update seat elements when `seats` prop changes without re-fetching the SVG
  useEffect(() => {
    const seatEls = seatElsRef.current;
    if (!seatEls || !seats || seats.length === 0) return;

    // compute visual order if needed (by bbox) to map seats -> elements
    const withBox = seatEls.map(el => {
      const r = (el as SVGGraphicsElement).getBoundingClientRect();
      return { el, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    });
    withBox.sort((a, b) => (a.cy - b.cy) || (a.cx - b.cx));

    for (let i = 0; i < withBox.length; i++) {
      const el = withBox[i].el;
      const seat = seats[i];
      if (!seat) break;
      el.setAttribute('data-seat-id', seat.id);
      el.setAttribute('data-seat-index', String(i));
      el.classList.remove('available', 'selected', 'reserved');
      el.classList.add(seat.status);
    }
  }, [seats]);

  if (error) return <div className={className}>Error loading SVG: {error}</div>;
  return <div ref={containerRef} className={className} />;
}
