import { formatJsonWithSpaceBeforeColon } from './utils';

/**
 * Converts Figma RGBA color to HEX format for Android
 */
function figmaRGBToAndroidColor(color: { r: number, g: number, b: number, a: number }): string {
  // Convert RGBA (0-1) to HEX components
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 255);
  
  // Convert to HEX format #AARRGGBB or #RRGGBB if alpha = 255
  const toHex = (value: number): string => {
    const hex = value.toString(16).toUpperCase();
    return hex.length === 1 ? "0" + hex : hex;
  };
  
  if (a < 255) {
    return `#${toHex(a)}${toHex(r)}${toHex(g)}${toHex(b)}`;
  } else {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

function buildFolderPath(node: SceneNode): string {
    const folderParts: string[] = [];
    let currentNode = node.parent;
    
    // Traverse up the hierarchy to find 📁 tagged nodes
    while (currentNode && currentNode.type !== 'PAGE') {
        if (currentNode.name.includes('📁')) {
            const folderName = currentNode.name.replace('📁', '').trim();
            if (folderName) {
                folderParts.unshift(folderName);
            }
        }
        currentNode = currentNode.parent;
    }
    
    return folderParts.length > 0 ? folderParts.join('/') + '/' : '';
}

export function exportColorsAssetsForAndroid() {
    const nodes = figma.currentPage.findAll(node => node.name === 'color-preview');
    
    // Prepare containers for XML files
    let lightColorLines: string[] = [];
    let darkColorLines: string[] = [];
    
    // For checking color name duplicates
    const colorNames = new Set<string>();
    const duplicateColors: string[] = [];

    for (const node of nodes) {
        if ('children' in node) {
            const titleNode = node.findOne(n => n.name === '$title' && 'characters' in n) as TextNode;
            const lightNode = node.findOne(n => n.name === 'light' && 'fills' in n) as FrameNode;
            const darkNode = node.findOne(n => n.name === 'dark' && 'fills' in n) as FrameNode;

            if (titleNode && lightNode && darkNode) {
                const colorName = titleNode.characters.trim();
                const lightColor = getSolidFill(lightNode);
                const darkColor = getSolidFill(darkNode);

                // Check for duplicate color names
                if (colorNames.has(colorName)) {
                    duplicateColors.push(colorName);
                } else {
                    colorNames.add(colorName);
                }

                if (lightColor && darkColor) {
                    // Convert to HEX format for Android
                    const lightHexColor = figmaRGBToAndroidColor(lightColor);
                    const darkHexColor = figmaRGBToAndroidColor(darkColor);

                    // Add lines for light and dark themes
                    lightColorLines.push(`    <color name="${colorName}">${lightHexColor}</color>`);
                    darkColorLines.push(`    <color name="${colorName}">${darkHexColor}</color>`);
                }
            }
        }
    }

    // Generate XML files
    const lightColorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
${lightColorLines.join('\n')}
</resources>`;

    const darkColorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
${darkColorLines.join('\n')}
</resources>`;

    // Create archive content
    const contents = [
        {
            path: `${figma.currentPage.name}/res/values/colors.xml`,
            data: lightColorsXml
        },
        {
            path: `${figma.currentPage.name}/res/values-night/colors.xml`,
            data: darkColorsXml
        }
    ];

    // Check for duplicates and display error if found
    if (duplicateColors.length > 0) {
        figma.closePlugin(`Error: Duplicate color names detected: ${duplicateColors.join(', ')}`);
        return;
    }

    // Send data to UI
    figma.showUI(__html__, { width: 256, height: 140 });
    figma.ui.postMessage({ 
        type: 'export-colors', 
        outputName: figma.currentPage.name,
        exportContents: contents
    });
}

export function exportColorAssetsForXcode() {
    const nodes = figma.currentPage.findAll(node => node.name === 'color-preview');
    let contents = [];
    
    // For checking color name duplicates
    const colorNames = new Set<string>();
    const duplicateColors: string[] = [];

    for (const node of nodes) {
        if ('children' in node) {
            const titleNode = node.findOne(n => n.name === '$title' && 'characters' in n) as TextNode;
            const lightNode = node.findOne(n => n.name === 'light' && 'fills' in n) as FrameNode;
            const darkNode = node.findOne(n => n.name === 'dark' && 'fills' in n) as FrameNode;

            if (titleNode && lightNode && darkNode) {
                const colorName = titleNode.characters.trim();
                const lightColor = getSolidFill(lightNode);
                const darkColor = getSolidFill(darkNode);

                // Check for duplicate color names
                if (colorNames.has(colorName)) {
                    duplicateColors.push(colorName);
                } else {
                    colorNames.add(colorName);
                }

                if (lightColor && darkColor) {
                    const folderPath = buildFolderPath(node);
                    const contentsJSON = {
                    info: { version: 1, author: "xcode" },
                    colors: [
                        {
                        idiom: "universal",
                        color: figmaRGBToXcodeColor(lightColor)
                        },
                        {
                        idiom: "universal",
                        appearances: [{ appearance: "luminosity", value: "dark" }],
                        color: figmaRGBToXcodeColor(darkColor)
                        }
                    ]
                    };

                    contents.push({
                        path: `${figma.currentPage.name}/Colors/${folderPath}${colorName}.colorset/Contents.json`,
                        data: formatJsonWithSpaceBeforeColon(contentsJSON)
                    })
                }
            }

            // Check for duplicates and display error if found
            if (duplicateColors.length > 0) {
                figma.closePlugin(`Error: Duplicate color names detected: ${duplicateColors.join(', ')}`);
                return;
            }
            
            figma.showUI(__html__, { width: 256, height: 140 })
            figma.ui.postMessage({ 
                type: 'export-colors', 
                outputName: figma.currentPage.name + '.xcassets',
                exportContents: contents
            });
        }
    }
}
  
  function getSolidFill(node: SceneNode): { r: number, g: number, b: number, a: number } | null {
    if ('fills' in node) {
        const fills = node.fills;

        if (Array.isArray(fills) && fills.length > 0) {
          const fill = fills[0];
          if (fill.type === 'SOLID') {
            const opacity = fill.opacity !== undefined ? fill.opacity : 1;
            return {
              r: fill.color.r,
              g: fill.color.g,
              b: fill.color.b,
              a: opacity
            };
          }
        }
      }
      return null;
  }
  
  function figmaRGBToXcodeColor(color: { r: number, g: number, b: number, a: number }) {
    // Convert floating point RGB (0-1) to integer (0-255)
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    // Convert to hex with leading zero if needed (uppercase)
    const toHex = (value: number): string => {
      const hex = value.toString(16).toUpperCase();
      return "0x" + (hex.length === 1 ? "0" + hex : hex);
    };
    
    return {
      "color-space": "srgb",
      components: {
        red: toHex(r),
        green: toHex(g),
        blue: toHex(b),
        alpha: color.a.toFixed(3)
      }
    };
  }
