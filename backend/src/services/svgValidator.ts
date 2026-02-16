import { DOMParser } from "@xmldom/xmldom";

// ────────── Types ──────────

export interface SvgValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: string;
  dimensions?: {
    width: number | null;
    height: number | null;
    viewBox: string | null;
  };
}

const MAX_SVG_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// ────────── Helpers ──────────

/** Attributes that could run JS */
const DANGEROUS_ATTRS = [
  "onload",
  "onclick",
  "onmouseover",
  "onmouseout",
  "onmousedown",
  "onmouseup",
  "onfocus",
  "onblur",
  "onerror",
  "onabort",
  "oninput",
  "onchange",
  "onsubmit",
  "onkeydown",
  "onkeyup",
  "onkeypress",
];

/** Remove <script> tags and on* handler attributes from an element tree */
function sanitizeElement(el: Element): void {
  // Remove dangerous attributes
  for (const attr of DANGEROUS_ATTRS) {
    if (el.hasAttribute(attr)) {
      el.removeAttribute(attr);
    }
  }
  // Recurse into children
  const children = el.childNodes;
  const toRemove: Node[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) {
      const childEl = child as Element;
      if (childEl.tagName === "script") {
        toRemove.push(child);
      } else {
        sanitizeElement(childEl);
      }
    }
  }
  for (const node of toRemove) {
    el.removeChild(node);
  }
}

// ────────── Main validator ──────────

/**
 * Validate and sanitize SVG content.
 * Returns { valid, errors, sanitized, dimensions }.
 */
export function validateAndSanitizeSvg(
  svgContent: string,
): SvgValidationResult {
  const errors: string[] = [];

  // 1. Size check
  const sizeBytes = Buffer.byteLength(svgContent, "utf-8");
  if (sizeBytes > MAX_SVG_SIZE_BYTES) {
    errors.push(
      `SVG excede el tamaño máximo (${(sizeBytes / 1024 / 1024).toFixed(1)} MB > 2 MB)`,
    );
    return { valid: false, errors };
  }

  // 2. XML parse
  const parseErrors: string[] = [];
  const errorHandler = {
    warning: () => {},
    error: (msg: string) => parseErrors.push(msg),
    fatalError: (msg: string) => parseErrors.push(msg),
  };

  let doc: Document;
  try {
    doc = new DOMParser({ errorHandler }).parseFromString(
      svgContent,
      "image/svg+xml",
    );
  } catch {
    errors.push("No se pudo parsear como XML válido");
    return { valid: false, errors };
  }

  if (parseErrors.length > 0) {
    errors.push(`XML inválido: ${parseErrors[0]}`);
    return { valid: false, errors };
  }

  // 3. Check root tag is <svg>
  const root = doc.documentElement;
  if (!root || root.tagName !== "svg") {
    errors.push("El documento no contiene un elemento <svg> raíz");
    return { valid: false, errors };
  }

  // 4. Sanitize
  sanitizeElement(root);

  // 5. Extract dimensions
  const width = root.getAttribute("width")
    ? parseFloat(root.getAttribute("width")!)
    : null;
  const height = root.getAttribute("height")
    ? parseFloat(root.getAttribute("height")!)
    : null;
  const viewBox = root.getAttribute("viewBox") || null;

  // 6. Serialize back
  const serializer = new (require("@xmldom/xmldom").XMLSerializer)();
  const sanitized = serializer.serializeToString(doc);

  return {
    valid: true,
    errors: [],
    sanitized,
    dimensions: { width, height, viewBox },
  };
}
