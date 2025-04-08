export function exportColorAssets() {
    const nodes = figma.currentPage.findAll(node => node.name === 'color-preview');
    let contents = [];

    for (const node of nodes) {
        if ('children' in node) {
            const titleNode = node.findOne(n => n.name === '$title' && 'characters' in n) as TextNode;
            const lightNode = node.findOne(n => n.name === 'light' && 'fills' in n) as FrameNode;
            const darkNode = node.findOne(n => n.name === 'dark' && 'fills' in n) as FrameNode;

            if (titleNode && lightNode && darkNode) {
                const colorName = titleNode.characters.trim();
                const lightColor = getSolidFill(lightNode);
                const darkColor = getSolidFill(darkNode);

                if (lightColor && darkColor) {
                    const contentsJSON = {
                    info: { version: 1, author: "xcode" },
                    colors: [
                        {
                        idiom: "universal",
                        appearances: [{ appearance: "luminosity", value: "light" }],
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
                        path: `${figma.currentPage.name}/Colors/${colorName}.colorset/Contents.json`,
                        data: JSON.stringify(contentsJSON, null, 2)
                    })
                }
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
    return {
      "color-space": "srgb",
      components: {
        red: color.r.toFixed(3),
        green: color.g.toFixed(3),
        blue: color.b.toFixed(3),
        alpha: color.a.toFixed(3)
      }
    };
  }