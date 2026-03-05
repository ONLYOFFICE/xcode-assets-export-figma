/**
 * Formats JSON with a space before the colon
 * @param obj Object to serialize to JSON
 * @returns JSON string with a space before the colon
 */
export function formatJsonWithSpaceBeforeColon(obj: any): string {
  // First convert the object to JSON with indentation
  const jsonString = JSON.stringify(obj, null, 2);
  
  // Replace all ":" with " :" (add a space before the colon)
  return jsonString.replace(/"([^"]+)":/g, '"$1" :');
}

// CSS color names to hex mapping
const colorNameToHex: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF0000",
  green: "#008000",
  blue: "#0000FF",
  yellow: "#FFFF00",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  gray: "#808080",
  grey: "#808080",
  silver: "#C0C0C0",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00FF00",
  aqua: "#00FFFF",
  teal: "#008080",
  navy: "#000080",
  fuchsia: "#FF00FF",
  transparent: "#00000000"
};

/**
 * Converts color name to hex if needed
 * @param color Color string (name or hex)
 * @returns Hex color string
 */
function normalizeColor(color: string): string {
  const lowerColor = color.toLowerCase();
  return colorNameToHex[lowerColor] || color;
}

/**
 * Converts circle element to path data
 * @param cx Center X coordinate
 * @param cy Center Y coordinate
 * @param r Radius
 * @returns Path data string
 */
function circleToPath(cx: number, cy: number, r: number): string {
  // Circle using two arcs
  return `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
}

/**
 * Converts ellipse element to path data
 * @param cx Center X coordinate
 * @param cy Center Y coordinate
 * @param rx Radius X
 * @param ry Radius Y
 * @returns Path data string
 */
function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
  // Ellipse using two arcs
  return `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 -${rx * 2},0`;
}

/**
 * Converts rect element to path data
 * @param x X coordinate
 * @param y Y coordinate
 * @param width Width
 * @param height Height
 * @param rx Corner radius X (optional)
 * @param ry Corner radius Y (optional)
 * @returns Path data string
 */
function rectToPath(x: number, y: number, width: number, height: number, rx?: number, ry?: number): string {
  if (!rx && !ry) {
    // Simple rectangle without rounded corners
    return `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`;
  }

  // Rectangle with rounded corners
  rx = rx || 0;
  ry = ry || rx;

  // Limit radius to half of width/height
  rx = Math.min(rx, width / 2);
  ry = Math.min(ry, height / 2);

  return `M ${x + rx},${y} L ${x + width - rx},${y} A ${rx},${ry} 0 0,1 ${x + width},${y + ry} L ${x + width},${y + height - ry} A ${rx},${ry} 0 0,1 ${x + width - rx},${y + height} L ${x + rx},${y + height} A ${rx},${ry} 0 0,1 ${x},${y + height - ry} L ${x},${y + ry} A ${rx},${ry} 0 0,1 ${x + rx},${y} Z`;
}

/**
 * Extracts attribute value from element string
 * @param element Element string
 * @param attr Attribute name
 * @returns Attribute value or null
 */
function extractAttribute(element: string, attr: string): string | null {
  // Use word boundary to avoid matching partial attribute names (e.g., "y" in "opacity")
  const match = element.match(new RegExp(`(?:^|\\s)${attr}=["']([^"']*)["']`));
  return match ? match[1] : null;
}

/**
 * Parses transform attribute and returns transformation matrix
 * @param transform Transform string (e.g., "translate(10, 20)" or "matrix(...)")
 * @returns Transformation matrix {a, b, c, d, e, f}
 */
function parseTransform(transform: string | null): { a: number, b: number, c: number, d: number, e: number, f: number } {
  if (!transform) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  // Parse translate(x, y) or translate(x)
  const translateMatch = transform.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const values = translateMatch[1].split(/[\s,]+/).map(v => parseFloat(v.trim()));
    return {
      a: 1, b: 0, c: 0, d: 1,
      e: values[0] || 0,
      f: values[1] || 0
    };
  }

  // Parse matrix(a, b, c, d, e, f)
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const values = matrixMatch[1].split(/[\s,]+/).map(v => parseFloat(v.trim()));
    return {
      a: values[0] || 1,
      b: values[1] || 0,
      c: values[2] || 0,
      d: values[3] || 1,
      e: values[4] || 0,
      f: values[5] || 0
    };
  }

  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

/**
 * Applies transformation matrix to a point
 * @param x X coordinate
 * @param y Y coordinate
 * @param matrix Transformation matrix
 * @returns Transformed coordinates
 */
function applyTransform(x: number, y: number, matrix: { a: number, b: number, c: number, d: number, e: number, f: number }): { x: number, y: number } {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f
  };
}

/**
 * Converts SVG string to VectorDrawable format for Android
 * @param svgString SVG string
 * @param options Additional parameters (width, height, rtl)
 * @returns XML string in VectorDrawable format
 */
export function svgToVectorDrawable(svgString: string, options: {
  width: number,
  height: number,
  isRTL?: boolean
}): string {
  // Get viewBox from SVG
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']*)["']/);
  let viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${options.width} ${options.height}`;
  const [minX, minY, width, height] = viewBox.split(' ').map(parseFloat);

  const paths = [];

  // Process all supported elements in document order
  const elementRegex = /<(path|rect|circle|ellipse)\b[^>]*\/?>/g;
  let match;

  while ((match = elementRegex.exec(svgString)) !== null) {
    const tagName = match[1];
    const fullElement = match[0];

    if (tagName === 'path') {
      const dMatch = fullElement.match(/\bd=["']([^"']*)["']/);
      if (!dMatch) continue;
      const pathData = dMatch[1];

      const fillAttr = extractAttribute(fullElement, 'fill');
      const fill = fillAttr ? normalizeColor(fillAttr) : "#000000";
      const stroke = extractAttribute(fullElement, 'stroke');
      const strokeWidth = extractAttribute(fullElement, 'stroke-width');
      const opacity = extractAttribute(fullElement, 'opacity') || extractAttribute(fullElement, 'fill-opacity');
      const fillRule = extractAttribute(fullElement, 'fill-rule');

      paths.push({
        pathData,
        fill: fill !== "none" ? fill : null,
        stroke: stroke ? normalizeColor(stroke) : null,
        strokeWidth,
        opacity: opacity && opacity !== "1" ? opacity : null,
        fillType: fillRule === 'evenodd' ? 'evenOdd' : null
      });

    } else if (tagName === 'circle') {
      let cx = parseFloat(extractAttribute(fullElement, 'cx') || '0');
      let cy = parseFloat(extractAttribute(fullElement, 'cy') || '0');
      const r = parseFloat(extractAttribute(fullElement, 'r') || '0');

      const transform = extractAttribute(fullElement, 'transform');
      const matrix = parseTransform(transform);
      const transformed = applyTransform(cx, cy, matrix);
      cx = transformed.x;
      cy = transformed.y;

      if (r > 0) {
        const pathData = circleToPath(cx, cy, r);
        const fill = extractAttribute(fullElement, 'fill');
        const stroke = extractAttribute(fullElement, 'stroke');
        const strokeWidth = extractAttribute(fullElement, 'stroke-width');
        const opacity = extractAttribute(fullElement, 'opacity');

        paths.push({
          pathData,
          fill: fill && fill !== "none" ? normalizeColor(fill) : "#000000",
          stroke: stroke ? normalizeColor(stroke) : null,
          strokeWidth,
          opacity: opacity && opacity !== "1" ? opacity : null,
          fillType: null
        });
      }

    } else if (tagName === 'ellipse') {
      let cx = parseFloat(extractAttribute(fullElement, 'cx') || '0');
      let cy = parseFloat(extractAttribute(fullElement, 'cy') || '0');
      const rx = parseFloat(extractAttribute(fullElement, 'rx') || '0');
      const ry = parseFloat(extractAttribute(fullElement, 'ry') || '0');

      const transform = extractAttribute(fullElement, 'transform');
      const matrix = parseTransform(transform);
      const transformed = applyTransform(cx, cy, matrix);
      cx = transformed.x;
      cy = transformed.y;

      if (rx > 0 && ry > 0) {
        const pathData = ellipseToPath(cx, cy, rx, ry);
        const fill = extractAttribute(fullElement, 'fill');
        const stroke = extractAttribute(fullElement, 'stroke');
        const strokeWidth = extractAttribute(fullElement, 'stroke-width');
        const opacity = extractAttribute(fullElement, 'opacity');

        paths.push({
          pathData,
          fill: fill && fill !== "none" ? normalizeColor(fill) : "#000000",
          stroke: stroke ? normalizeColor(stroke) : null,
          strokeWidth,
          opacity: opacity && opacity !== "1" ? opacity : null,
          fillType: null
        });
      }

    } else if (tagName === 'rect') {
      const x = parseFloat(extractAttribute(fullElement, 'x') || '0');
      const y = parseFloat(extractAttribute(fullElement, 'y') || '0');
      const rectWidth = parseFloat(extractAttribute(fullElement, 'width') || '0');
      const rectHeight = parseFloat(extractAttribute(fullElement, 'height') || '0');
      const rx = extractAttribute(fullElement, 'rx');
      const ry = extractAttribute(fullElement, 'ry');

      if (rectWidth > 0 && rectHeight > 0) {
        let pathData: string;

        const transform = extractAttribute(fullElement, 'transform');
        const matrix = parseTransform(transform);

        const isIdentity = matrix.a === 1 && matrix.b === 0 && matrix.c === 0 && matrix.d === 1 && matrix.e === 0 && matrix.f === 0;

        if (isIdentity) {
          pathData = rectToPath(
            x, y, rectWidth, rectHeight,
            rx ? parseFloat(rx) : undefined,
            ry ? parseFloat(ry) : undefined
          );
        } else {
          const topLeft = applyTransform(x, y, matrix);
          const topRight = applyTransform(x + rectWidth, y, matrix);
          const bottomRight = applyTransform(x + rectWidth, y + rectHeight, matrix);
          const bottomLeft = applyTransform(x, y + rectHeight, matrix);

          pathData = `M ${topLeft.x},${topLeft.y} L ${topRight.x},${topRight.y} L ${bottomRight.x},${bottomRight.y} L ${bottomLeft.x},${bottomLeft.y} Z`;
        }

        const fill = extractAttribute(fullElement, 'fill');
        const stroke = extractAttribute(fullElement, 'stroke');
        const strokeWidth = extractAttribute(fullElement, 'stroke-width');
        const opacity = extractAttribute(fullElement, 'opacity');

        paths.push({
          pathData,
          fill: fill && fill !== "none" ? normalizeColor(fill) : "#000000",
          stroke: stroke ? normalizeColor(stroke) : null,
          strokeWidth,
          opacity: opacity && opacity !== "1" ? opacity : null,
          fillType: null
        });
      }
    }
  }

  // Create VectorDrawable XML
  let vectorDrawable = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${options.width}dp"
    android:height="${options.height}dp"
    android:viewportWidth="${width}"
    android:viewportHeight="${height}">
`;

  // Add paths
  for (const path of paths) {
    vectorDrawable += `    <path\n`;
    vectorDrawable += `        android:pathData="${path.pathData}"\n`;
    
    if (path.fill) {
      vectorDrawable += `        android:fillColor="${path.fill}"\n`;
    }

    if (path.fillType) {
      vectorDrawable += `        android:fillType="${path.fillType}"\n`;
    }

    if (path.stroke) {
      vectorDrawable += `        android:strokeColor="${path.stroke}"\n`;
    }
    
    if (path.strokeWidth) {
      vectorDrawable += `        android:strokeWidth="${path.strokeWidth}"\n`;
    }
    
    if (path.opacity) {
      vectorDrawable += `        android:fillAlpha="${path.opacity}"\n`;
    }
    
    vectorDrawable += `    />\n`;
  }
  
  vectorDrawable += `</vector>`;
  
  return vectorDrawable;
}
