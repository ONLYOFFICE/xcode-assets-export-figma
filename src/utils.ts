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

  // Extract path data from SVG
  const pathRegex = /<path[^>]*d=["']([^"']*)["'][^>]*>/g;
  const fillRegex = /<path[^>]*fill=["']([^"']*)["'][^>]*>/g;
  const strokeRegex = /<path[^>]*stroke=["']([^"']*)["'][^>]*>/g;
  const strokeWidthRegex = /<path[^>]*stroke-width=["']([^"']*)["'][^>]*>/g;
  
  const paths = [];
  let match;
  
  // Extract all path elements
  while ((match = pathRegex.exec(svgString)) !== null) {
    const pathData = match[1];
    const fullPathElement = match[0];
    
    // Extract attributes for this path
    const fillMatch = fullPathElement.match(/fill=["']([^"']*)["']/);
    const fill = fillMatch ? normalizeColor(fillMatch[1]) : "#000000";

    const strokeMatch = fullPathElement.match(/stroke=["']([^"']*)["']/);
    const stroke = strokeMatch ? normalizeColor(strokeMatch[1]) : null;
    
    const strokeWidthMatch = fullPathElement.match(/stroke-width=["']([^"']*)["']/);
    const strokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : null;
    
    const opacityMatch = fullPathElement.match(/opacity=["']([^"']*)["']/);
    const opacity = opacityMatch ? opacityMatch[1] : "1";
    
    paths.push({
      pathData,
      fill: fill !== "none" ? fill : null,
      stroke,
      strokeWidth,
      opacity: opacity !== "1" ? opacity : null
    });
  }
  
  // Create VectorDrawable XML
  let vectorDrawable = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${options.width}dp"
    android:height="${options.height}dp"
    android:viewportWidth="${width}"
    android:viewportHeight="${height}"${options.isRTL ? '\n    android:autoMirrored="true"' : ''}>
`;

  // Add paths
  for (const path of paths) {
    vectorDrawable += `    <path\n`;
    vectorDrawable += `        android:pathData="${path.pathData}"\n`;
    
    if (path.fill) {
      vectorDrawable += `        android:fillColor="${path.fill}"\n`;
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
