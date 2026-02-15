"use client";

import { useEffect, useRef, useState } from "react";
import { Seat } from "@/types/seat";

type Props = {
  seats: Seat[];
  onSelect: (id: string) => void;
  mode?: "client" | "admin"; // Nueva prop para modo
  selectedSeats?: string[]; // Nueva prop para asientos seleccionados en modo cliente
  svgUrl?: string;
};

const Loader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "400px",
      fontFamily: "Arial",
      color: "#666",
    }}
  >
    Cargando mapa...
  </div>
);

const NoMapPlaceholder = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "400px",
      border: "2px dashed #ccc",
      borderRadius: "8px",
      color: "#666",
      fontFamily: "Arial",
      textAlign: "center",
      padding: "20px",
    }}
  >
    <p>
      No hay ningún mapa seleccionado para mostrar.
      <br />
      Por favor, selecciona un mapa de la lista.
    </p>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "400px",
      border: "2px solid #f5c6cb",
      borderRadius: "8px",
      color: "#721c24",
      backgroundColor: "#f8d7da",
      fontFamily: "Arial",
      textAlign: "center",
      padding: "20px",
    }}
  >
    <p>
      <b>Error:</b> {message}
    </p>
  </div>
);

export default function SeatMap({
  seats,
  onSelect,
  mode = "client",
  selectedSeats = [],
  svgUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fetchedSvg, setFetchedSvg] = useState<string>("");
  const [svgPrefix, setSvgPrefix] = useState<string>("");
  const svgOriginalIdsRef = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (svgUrl) {
      setIsLoading(true);
      setError(null);
      setFetchedSvg("");
      svgOriginalIdsRef.current = new Set();

      const isRemote = svgUrl.startsWith("http");
      const urlToFetch = isRemote
        ? `/api/proxy?url=${encodeURIComponent(svgUrl)}`
        : svgUrl;

      fetch(urlToFetch, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404)
              throw new Error(
                `El mapa no fue encontrado en la URL especificada.`,
              );
            throw new Error(
              `Error al cargar el SVG: ${res.status} ${res.statusText}`,
            );
          }
          return res.text();
        })
        .then((text) => {
          // create a short unique prefix for this SVG instance
          const prefix = "map" + Date.now();
          setSvgPrefix(prefix);

          try {
            // Parse the SVG text into a DOM, so we safely update id attributes
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "image/svg+xml");
            const svgEl = doc.documentElement;
            if (
              svgEl.tagName.toLowerCase() !== "svg" ||
              doc.getElementsByTagName("parsererror").length > 0
            ) {
              // This happens if the fetched content is not a valid SVG, e.g., an error message from the proxy
              throw new Error(
                "El recurso obtenido no es un archivo SVG válido.",
              );
            }
            if (svgEl) {
              svgOriginalIdsRef.current = new Set();
              // find all elements with an id attribute
              const nodes = svgEl.querySelectorAll("[id]");
              nodes.forEach((n) => {
                const original = n.getAttribute("id");
                if (original) {
                  svgOriginalIdsRef.current.add(original);
                  n.setAttribute("data-original-id", original);
                  n.setAttribute("id", `${prefix}-${original}`);
                }
              });

              // Heuristic: if seats are represented by a label (text) but the shape has no id,
              // try to map text content like 'A4' or 'B12' to a nearby shape in the same group.
              const textNodes = svgEl.querySelectorAll("text");
              textNodes.forEach((t) => {
                const label = (t.textContent || "").trim();
                if (!label) return;
                // accept labels like A1, B12, etc.
                if (!/^([A-Z]{1}\d{1,2})$/.test(label)) return;
                const seatId = `seat-${label}`;
                // if we already found this id, skip
                if (svgOriginalIdsRef.current.has(seatId)) return;
                // try to find a sibling shape inside the same parent <g>
                const parent = t.parentElement;
                if (!parent) return;
                const shape = Array.from(parent.children).find(
                  (ch) =>
                    /^(rect|circle|path|ellipse)$/i.test(ch.tagName) &&
                    !ch.getAttribute("id"),
                ) as Element | undefined;
                if (shape) {
                  svgOriginalIdsRef.current.add(seatId);
                  shape.setAttribute("data-original-id", seatId);
                  shape.setAttribute("id", `${prefix}-${seatId}`);
                }
              });

              // Hacer que textos/labels no capturen clicks
              svgEl.querySelectorAll("text, tspan").forEach((t) => {
                (t as HTMLElement).style.pointerEvents = "none";
                (t as HTMLElement).style.userSelect = "none";
              });

              // ensure the root svg isn't malformed
              const serializer = new XMLSerializer();
              const transformed = serializer.serializeToString(svgEl);
              setFetchedSvg(transformed);
              return;
            }
          } catch (e: unknown) {
            console.warn(
              "SeatMap: DOMParser failed, falling back to raw text",
              e,
            );
            const errorMessage =
              e instanceof Error
                ? e.message
                : "Error al procesar el archivo SVG.";
            throw new Error(errorMessage);
          }
        })
        .catch((err: Error) => {
          console.error(
            "Error al cargar o procesar el SVG desde la URL:",
            svgUrl,
            err,
          );
          setError(
            err.message || "Ocurrió un error desconocido al cargar el mapa.",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // No svgUrl provided, reset states
      setIsLoading(false);
      setError(null);
      setFetchedSvg("");
    }
  }, [svgUrl]);

  useEffect(() => {
    if (!containerRef.current || !fetchedSvg) return;
    // Debug lists
    const found: string[] = [];
    const missing: string[] = [];

    // If no ids were detected for this SVG, skip processing to avoid updating other maps
    if (svgOriginalIdsRef.current.size === 0) {
      console.log(
        `SeatMap: svgUrl=${svgUrl} - no element ids detected for this SVG, skipping seat updates.`,
      );
      return;
    }

    seats.forEach((seat) => {
      // If we have a list of original ids for this SVG, skip seats not belonging to it
      if (
        svgOriginalIdsRef.current.size > 0 &&
        !svgOriginalIdsRef.current.has(seat.id)
      ) {
        missing.push(seat.id);
        return;
      }
      // try with prefixed id first (when SVG was transformed), otherwise fallback to raw id
      const prefixedId = svgPrefix ? `#${svgPrefix}-${seat.id}` : null;
      let el: SVGElement | null = null;
      if (prefixedId)
        el = containerRef.current!.querySelector<SVGElement>(prefixedId);
      if (!el)
        el = containerRef.current!.querySelector<SVGElement>(`#${seat.id}`);

      if (!el) {
        missing.push(seat.id);
        return;
      }

      // Solo permitir shapes reales como sillas (ignorar <g>, <text>, <svg>, <defs>, etc.)
      const tag = el.tagName.toLowerCase();
      const seatShapes = [
        "rect",
        "circle",
        "ellipse",
        "path",
        "polygon",
        "polyline",
      ];
      if (!seatShapes.includes(tag)) return;

      found.push(seat.id);

      // 🎨 COLOR (use setAttribute + inline style). Mapping: available=black, selected=green, reserved=grey
      let color = "#9ca3af"; // GRIS por defecto para reservado (Confirmado)
      if (seat.status === "reserved" && seat.expiresAt) color = "#ef4444"; // ROJO si es temporal (Held)
      if (seat.status === "available") color = "#000000";

      if (mode === "client" && selectedSeats.includes(seat.id))
        color = "#22c55e";

      try {
        el.setAttribute("fill", color);
      } catch {
        /* ignore */
      }
      // also set inline style to ensure CSS rules don't override
      try {
        el.style.setProperty("fill", color, "important");
        el.style.fill = color;
      } catch {
        /* ignore */
      }

      // 🖱️ CURSOR
      const isClickable =
        mode === "admin" ||
        seat.status === "available" ||
        (mode === "client" && selectedSeats.includes(seat.id));
      try {
        el.style.cursor = isClickable ? "pointer" : "not-allowed";
      } catch {}

      // 🧠 CLICK
      el.onclick = isClickable
        ? (e) => {
            e.stopPropagation(); // 🛑 IMPORTANTE: Evita que el clic se propague a grupos padres (ej: VIP1_2 -> VIP1)
            onSelect(seat.id);
          }
        : null;

      // 🕒 HOVER (Mostrar tiempo restante si está reservada)
      if (seat.status === "reserved" && seat.expiresAt) {
        // Usamos addEventListener nativo para no depender de React Synthetic Events ni re-renders
        el.addEventListener("mouseenter", () => {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "block";

            // Función para actualizar el texto
            const updateText = () => {
              if (!tooltipRef.current) return;
              const now = new Date().getTime();
              const expire = new Date(seat.expiresAt!).getTime();
              const diff = expire - now;

              if (diff <= 0) {
                tooltipRef.current.innerText = "Expirado";
              } else {
                const minutes = Math.floor(
                  (diff % (1000 * 60 * 60)) / (1000 * 60),
                );
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                tooltipRef.current.innerText = `Libera en: ${minutes}m ${seconds}s`;
              }
            };

            updateText();
            tooltipIntervalRef.current = setInterval(updateText, 1000);
          }
        });

        el.addEventListener("mousemove", (e) => {
          if (tooltipRef.current) {
            tooltipRef.current.style.top = `${e.clientY - 40}px`;
            tooltipRef.current.style.left = `${e.clientX}px`;
          }
        });

        el.addEventListener("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.display = "none";
          if (tooltipIntervalRef.current)
            clearInterval(tooltipIntervalRef.current);
        });
      } else {
        // Limpiar eventos si cambia de estado
        el.onmouseenter = null;
        el.onmousemove = null;
        el.onmouseleave = null;
      }
    });

    // diagnostics for developer (always log for easier debugging)
    console.log(
      `SeatMap: svgUrl=${svgUrl} seats total=${seats.length}, found=${found.length}, missing=${missing.length}`,
    );
    if (missing.length)
      console.log("SeatMap: missing ids sample:", missing.slice(0, 10));
  }, [seats, onSelect, mode, selectedSeats, fetchedSvg, svgPrefix, svgUrl]);

  if (!svgUrl) {
    return <NoMapPlaceholder />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative" }} // Necesario para posicionamiento relativo si usáramos absolute
    >
      <div dangerouslySetInnerHTML={{ __html: fetchedSvg }} />

      {/* Tooltip persistente controlado por Refs (Sin Re-renders) */}
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          pointerEvents: "none",
          zIndex: 1000,
          whiteSpace: "nowrap",
        }}
      />
    </div>
  );
}
