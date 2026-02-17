import { DOMParser } from "@xmldom/xmldom";

// ────────── Types ──────────

export interface ParsedSeat {
  seatId: string; // e.g. "seat-VIP1", "seat-A3"
  tagName: string; // e.g. "circle", "rect", "g"
  zone: string | null; // zone id from nearest ancestor <g>
  zoneName: string | null; // display name (from <text> label or cleaned id)
  position: { x: number; y: number } | null;
  dataSeat?: string; // data-seat attribute value, if present
}

export interface DetectedZone {
  zoneId: string; // id of the <g> tag
  zoneName: string; // cleaned-up name
  seatCount: number;
  seatIds: string[];
}

export interface SvgDimensions {
  width: number | null;
  height: number | null;
  viewBox: string | null;
}

export interface AnalysisWarning {
  type: "duplicate_id" | "seat_no_zone" | "seat_no_position";
  message: string;
  seatId?: string;
}

export interface SvgAnalysisReport {
  dimensions: SvgDimensions;
  totalSeats: number;
  seats: ParsedSeat[];
  zones: DetectedZone[];
  seatsWithoutZone: string[];
  warnings: AnalysisWarning[];
}

// ────────── Helpers ──────────

/** Check if a node is an Element */
function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

/** Shape tags that can represent seats */
const SHAPE_TAGS = new Set(["circle", "rect", "ellipse", "path", "polygon"]);

/**
 * Walk up the DOM to find the best ancestor <g> for the zone.
 * Prefers the outermost <g> with an ID that is NOT a seat group.
 * This correctly identifies 'zonaA' over 'mesasA'.
 */
function findZoneAncestor(
  el: Element,
): { zoneId: string; zoneName: string } | null {
  let best: { zoneId: string; zoneName: string } | null = null;
  let current: Node | null = el.parentNode;
  while (current) {
    if (isElement(current) && current.tagName === "g") {
      const gId = current.getAttribute("id");
      if (gId && !gId.startsWith("seat-")) {
        // Try to find a <text> label inside this group for a nicer display name
        let label: string | null = null;
        const children = current.childNodes;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (isElement(child) && child.tagName === "text") {
            const text = (child.textContent || "").trim();
            if (text) {
              label = text;
              break;
            }
          }
        }
        best = {
          zoneId: gId,
          zoneName: label || cleanZoneName(gId),
        };
      }
    }
    current = current.parentNode;
  }
  return best;
}

/** Normalize a zone id to a friendlier name */
function cleanZoneName(raw: string): string {
  // "etapa-vip" → "Etapa Vip", "zonaA" → "ZonaA", "Etapa General" → "Etapa General"
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Extract x/y position from an element.
 * Supports: circle(cx,cy) · rect(x,y) · ellipse(cx,cy)
 * For <g> and <path> it tries to read the first child shape inside.
 * Returns null if no position data could be found.
 */
function extractPosition(el: Element): { x: number; y: number } | null {
  const tag = el.tagName;

  if (tag === "circle" || tag === "ellipse") {
    const cx = el.getAttribute("cx");
    const cy = el.getAttribute("cy");
    if (cx !== null || cy !== null) {
      return {
        x: parseFloat(cx || "0"),
        y: parseFloat(cy || "0"),
      };
    }
    return null;
  }

  if (tag === "rect") {
    const rx = el.getAttribute("x");
    const ry = el.getAttribute("y");
    if (rx !== null || ry !== null) {
      return {
        x: parseFloat(rx || "0"),
        y: parseFloat(ry || "0"),
      };
    }
    return null;
  }

  // For <g> or <path>/<polygon> without explicit coords,
  // try to get position from the first shape child
  if (tag === "g" || tag === "path" || tag === "polygon") {
    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (isElement(child) && SHAPE_TAGS.has(child.tagName)) {
        return extractPosition(child);
      }
    }
    // Fallback for <path>: try to parse the d attribute first M command
    if (tag === "path") {
      const d = el.getAttribute("d") || "";
      const match = d.match(/M\s*([\d.]+)\s*[\s,]\s*([\d.]+)/i);
      if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      }
    }
  }

  return null;
}

// ────────── Main parser ──────────

/**
 * Parse an SVG string and extract seats, zones, dimensions, and produce an
 * analysis report with warnings.
 */
export function parseSvg(svgContent: string): SvgAnalysisReport {
  const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  const svgRoot = doc.documentElement;

  // 1. Extract dimensions
  const dimensions: SvgDimensions = {
    width: svgRoot.getAttribute("width")
      ? parseFloat(svgRoot.getAttribute("width")!)
      : null,
    height: svgRoot.getAttribute("height")
      ? parseFloat(svgRoot.getAttribute("height")!)
      : null,
    viewBox: svgRoot.getAttribute("viewBox") || null,
  };

  // 2. Collect all elements with an id starting with "seat-"
  const allElements = doc.getElementsByTagName("*");
  const seatMap = new Map<string, ParsedSeat>();
  const seenIds = new Set<string>();
  const warnings: AnalysisWarning[] = [];

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const id = el.getAttribute("id");
    if (!id || !id.startsWith("seat-")) continue;

    // Skip auxiliary duplicates (Figma exports "seat-VIP1_2", "seat-VIP1_3", etc.)
    if (/_\d+$/.test(id)) continue;

    // Duplicate check
    if (seenIds.has(id)) {
      warnings.push({
        type: "duplicate_id",
        message: `ID duplicado encontrado: ${id}`,
        seatId: id,
      });
      continue;
    }
    seenIds.add(id);

    // Find zone
    const zoneInfo = findZoneAncestor(el);

    // Extract position
    const position = extractPosition(el);

    const seat: ParsedSeat = {
      seatId: id,
      tagName: el.tagName,
      zone: zoneInfo ? zoneInfo.zoneId : null,
      zoneName: zoneInfo ? zoneInfo.zoneName : null,
      position,
      dataSeat: el.getAttribute("data-seat") || undefined,
    };

    seatMap.set(id, seat);
  }

  const seats = Array.from(seatMap.values());

  // 3. Build zone summary
  const zoneAccum = new Map<string, DetectedZone>();
  for (const seat of seats) {
    if (!seat.zone) continue;
    if (!zoneAccum.has(seat.zone)) {
      zoneAccum.set(seat.zone, {
        zoneId: seat.zone,
        zoneName: seat.zoneName || cleanZoneName(seat.zone),
        seatCount: 0,
        seatIds: [],
      });
    }
    const z = zoneAccum.get(seat.zone)!;
    z.seatCount++;
    z.seatIds.push(seat.seatId);
  }
  const zones = Array.from(zoneAccum.values());

  // 4. Seats without zone
  const seatsWithoutZone = seats.filter((s) => !s.zone).map((s) => s.seatId);
  for (const sid of seatsWithoutZone) {
    warnings.push({
      type: "seat_no_zone",
      message: `Asiento sin zona asignada: ${sid}`,
      seatId: sid,
    });
  }

  // 5. Seats without meaningful position
  for (const seat of seats) {
    if (seat.position === null) {
      warnings.push({
        type: "seat_no_position",
        message: `No se pudo determinar posición para: ${seat.seatId}`,
        seatId: seat.seatId,
      });
    }
  }

  return {
    dimensions,
    totalSeats: seats.length,
    seats,
    zones,
    seatsWithoutZone,
    warnings,
  };
}
