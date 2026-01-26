/* Runtime SVG sanitizer + inliner for React/Next
   - fetches an external SVG file
   - prefixes IDs to avoid collisions
   - removes mask/filter/clip-path attributes (optional)
   - tags candidate seat elements by fill color with `class="seat"` and `data-seat-index`
   - marks large background elements with `class="noninteractive"`
   - returns an SVGElement ready to append into the DOM
*/

export type InlineOptions = {
  seatFills?: string[]; // hex colors to detect seats (case-insensitive)
  removeDefs?: boolean; // remove <defs> entirely
  onSeat?: (el: Element, index: number) => void; // callback for each found seat
};

function uid() {
  return 'svg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function walkAttributesAndReplace(el: Element, map: Record<string, string>) {
  for (const attr of Array.from(el.attributes || [])) {
    let v = attr.value;
    for (const oldId in map) {
      const newId = map[oldId];
      v = v.replace(new RegExp(`url\\(\\#${oldId}\\)`, 'g'), `url(#${newId})`);
      v = v.replace(new RegExp(`\\#${oldId}(?![\\w-])`, 'g'), `#${newId}`);
    }
    if (v !== attr.value) el.setAttribute(attr.name, v);
  }
}

export async function fetchAndInlineSVG(url: string, options: InlineOptions = {}) : Promise<SVGElement> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Failed to fetch SVG: ' + resp.status);
  const text = await resp.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error('No <svg> found in ' + url);

  const prefix = uid();

  // 1) Prefix all ids and build map old->new
  const idMap: Record<string, string> = {};
  for (const el of Array.from(svg.querySelectorAll('[id]'))) {
    const old = el.getAttribute('id')!;
    const neu = `${old}__${prefix}`;
    idMap[old] = neu;
    el.setAttribute('id', neu);
  }

  // 2) Update attributes referencing those ids (href, xlink:href, mask, clip-path, filter, fill="url(#...)"...)
  for (const el of Array.from(svg.querySelectorAll('*'))) {
    walkAttributesAndReplace(el, idMap);
  }

  // 3) Remove or disable masks/filters/clip-paths that commonly intercept pointer events
  for (const el of Array.from(svg.querySelectorAll('[mask],[filter],[clip-path]'))) {
    el.removeAttribute('mask');
    el.removeAttribute('filter');
    el.removeAttribute('clip-path');
  }

  if (options.removeDefs) {
    for (const d of Array.from(svg.querySelectorAll('defs'))) d.remove();
  }

  // 4) Mark huge rectangles / backgrounds as noninteractive
  const viewBoxAttr = svg.getAttribute('viewBox');
  let vbW = 0, vbH = 0;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+|,/).map(Number).filter(n => !Number.isNaN(n));
    if (parts.length >= 4) { vbW = parts[2]; vbH = parts[3]; }
  } else {
    const w = svg.getAttribute('width');
    const h = svg.getAttribute('height');
    vbW = w ? Number(w) : 0; vbH = h ? Number(h) : 0;
  }

  for (const rect of Array.from(svg.querySelectorAll('rect'))) {
    try {
      const w = Number(rect.getAttribute('width') || vbW || '0');
      const h = Number(rect.getAttribute('height') || vbH || '0');
      // If rect covers most of the canvas, make it noninteractive
      if ((vbW && w / vbW > 0.9) || (vbH && h / vbH > 0.9)) {
        rect.classList.add('noninteractive');
        rect.style.pointerEvents = 'none';
      }
    } catch { /* ignore parsing errors */ }
  }

  // 5) Detect seat elements by fill color (default includes #FFD900)
  const seatFills = (options.seatFills || ['#FFD900']).map(s => s.toLowerCase());
  let seatIndex = 0;
  for (const el of Array.from(svg.querySelectorAll<SVGElement>('path, circle, rect, g'))) {
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    if (seatFills.includes(fill)) {
      el.classList.add('seat');
      el.setAttribute('data-seat-index', String(seatIndex));
      el.style.cursor = 'pointer';
      el.style.pointerEvents = 'auto';
      if (options.onSeat) options.onSeat(el, seatIndex);
      seatIndex++;
    }
  }

  // 6) Add small stylesheet inside the svg to enforce pointer-events rules
  const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
  // Add seat state visuals: available (default), selected (highlight), reserved (muted)
  style.textContent = `
    .noninteractive{pointer-events:none}
    .seat{pointer-events:auto;cursor:pointer}
    .seat.available{opacity:1}
    .seat.selected{outline:2px solid #0078D4; filter: none;}
    .seat.selected path, .seat.selected rect, .seat.selected circle{ fill:#00AEEF !important }
    .seat.reserved path, .seat.reserved rect, .seat.reserved circle{ fill:#9E9E9E !important; opacity:0.9 }
  `;
  svg.insertBefore(style, svg.firstChild);

  // Import node into the current document (important in React/Next environments)
  const imported = document.importNode(svg, true) as SVGElement;

  return imported;
}

export default fetchAndInlineSVG;
