export async function exportIconsAssets() {
  const iconsFrame = figma.currentPage.findOne(n => n.type === 'FRAME' && n.name.includes('Icons')) as FrameNode;
  let assets: any[] = [];
  let contents: any[] = [];

  if (iconsFrame) {
    const iconNodes = iconsFrame.findAll(n => n.name === 'icon' && n.type === 'INSTANCE') as InstanceNode[];

    for (const icon of iconNodes) {
      const nameNode = icon.findOne(n => n.name === '$icon-name' && 'characters' in n) as TextNode;
      const groupNode = icon.findOne(n => n.name === '$icon-group' && n.type === 'FRAME') as FrameNode;

      if (!nameNode || !groupNode) continue;

      const iconName = nameNode.characters.trim();
      const iconSetPath = `${figma.currentPage.name}/Icons/${iconName}.imageset`;
      const images: any[] = [];

      // Export PDF with advanced configuration
      async function exportPDF(nodeName: string, locale?: string) {
        const node = groupNode.findOne(n => n.name === nodeName && n.visible !== false);
        if (!node) return;

        const fileName = `${iconName}-${nodeName}.pdf`.replace('$', '');

        const imageEntry: any = {
          idiom: "universal",
          filename: fileName
        };

        // Detect appearance based on layer name
        if (nodeName.includes('dark')) {
          imageEntry.appearances = [{ appearance: "luminosity", value: "dark" }];
        }

        // Set locale if provided
        if (locale) {
          imageEntry.locale = locale;
        }

        // Check if RTL layers exist
        const hasRTL = !!groupNode.findOne(n =>
          n.name === '$rtl-light' || n.name === '$rtl-dark'
        );

        // Configure language direction
        if (nodeName.startsWith('$rtl-')) {
          imageEntry["language-direction"] = "right-to-left";
        } else if (hasRTL) {
          imageEntry["language-direction"] = "left-to-right";
        }

        images.push(imageEntry);
        assets.push({
          dir: iconSetPath + '/',
          file: imageEntry.filename,
          layer: node
        })
      }

      // Common
      await exportPDF('$light');
      await exportPDF('$dark');

      // RTL
      if (groupNode.findOne(n => n.name === '$rtl-light')) {
        await exportPDF('$rtl-light');
      }
      if (groupNode.findOne(n => n.name === '$rtl-dark')) {
        await exportPDF('$rtl-dark');
      }

      // RU
      if (groupNode.findOne(n => n.name === '$ru-light')) {
        await exportPDF('$ru-light', 'ru');
      }
      if (groupNode.findOne(n => n.name === '$ru-dark')) {
        await exportPDF('$ru-dark', 'ru');
      }

      const contentsJSON = {
        images,
        info: { version: 1, author: "xcode" },
        properties: {
          "preserves-vector-representation": true
        }
      };
      
      // Create list of Contents files
      contents.push({
        path: `${iconSetPath}/Contents.json`,
        data: JSON.stringify(contentsJSON, null, 2)
      })
    }

    Promise.all(assets.map(asset => getExportImagesFromLayer(asset)))
    .then(exportAssets => {
      figma.showUI(__html__, { width: 256, height: 140 })
      figma.ui.postMessage({
        type: 'export-assets-2',
        outputName: figma.currentPage.name + '.xcassets',
        exportAssets: exportAssets,
        exportContents: contents
      })
    })
    .catch(error => {
      console.log(error)
      figma.closePlugin('Error exporting layers.')
    });

  }
}

async function getExportImagesFromLayer(asset: any): Promise<any[]> {
  let images = await Promise.all([asset].map(async asset => {
    const exportSetting: ExportSettingsPDF = {
      format: 'PDF'
    }
    const layer = asset.layer
    const imageData = await (<ExportMixin>layer).exportAsync(exportSetting);
    return {
      width: layer.width,
      height: layer.height,
      path: asset.dir + asset.file,
      data: imageData
    };
  }));
  return images;
}
