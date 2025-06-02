import { formatJsonWithSpaceBeforeColon, svgToVectorDrawable } from './utils';

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

export async function exportIconsAssetsForXcode() {
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
      const folderPath = buildFolderPath(icon);
      const iconSetPath = `${figma.currentPage.name}/Icons/${folderPath}${iconName}.imageset`;
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
        data: formatJsonWithSpaceBeforeColon(contentsJSON)
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

export async function exportIconsAssetsForAndroid() {
  const iconsFrame = figma.currentPage.findOne(n => n.type === 'FRAME' && n.name.includes('Icons')) as FrameNode;
  let assets: any[] = [];
  let contents: any[] = [];

  if (iconsFrame) {
    const iconNodes = iconsFrame.findAll(n => n.name === 'icon' && n.type === 'INSTANCE') as InstanceNode[];

    for (const icon of iconNodes) {
      const nameNode = icon.findOne(n => n.name === '$icon-name' && 'characters' in n) as TextNode;
      const groupNode = icon.findOne(n => n.name === '$icon-group' && n.type === 'FRAME') as FrameNode;

      if (!nameNode || !groupNode) continue;

      const iconName = nameNode.characters.trim().toLowerCase();
      
      // Export in SVG format for subsequent conversion to VectorDrawable
      async function exportSVG(nodeName: string, options: { 
        night?: boolean, 
        locale?: string, 
        rtl?: boolean 
      } = {}) {
        const node = groupNode.findOne(n => n.name === nodeName && n.visible !== false);
        if (!node) return;

        // Determine the correct folder based on theme and localization
        let folderName = 'drawable';
        
        // Add localization
        if (options.locale) {
          folderName += `-${options.locale}`;
        }
        
        // Add night theme
        if (options.night) {
          folderName += `-night`;
        }
        
        const iconSetPath = `${figma.currentPage.name}/res/${folderName}`;
        const fileName = `${iconName}.xml`;

        assets.push({
          dir: iconSetPath + '/',
          file: fileName,
          layer: node,
          format: 'SVG',
          isRTL: options.rtl || false
        });
      }

      // Normal light version (drawable)
      await exportSVG('$light', {});
      
      // Dark version (drawable-night)
      await exportSVG('$dark', { night: true });

      // RTL light (drawable with RTL flag)
      if (groupNode.findOne(n => n.name === '$rtl-light')) {
        await exportSVG('$rtl-light', { rtl: true });
      }
      
      // RTL dark (drawable-night with RTL flag)
      if (groupNode.findOne(n => n.name === '$rtl-dark')) {
        await exportSVG('$rtl-dark', { night: true, rtl: true });
      }

      // RU light (drawable-ru)
      if (groupNode.findOne(n => n.name === '$ru-light')) {
        await exportSVG('$ru-light', { locale: 'ru' });
      }
      
      // RU dark (drawable-ru-night)
      if (groupNode.findOne(n => n.name === '$ru-dark')) {
        await exportSVG('$ru-dark', { locale: 'ru', night: true });
      }
    }

    Promise.all(assets.map(asset => getExportSVGFromLayer(asset)))
    .then(exportAssets => {
      
      // Make sure we have data to export
      if (exportAssets.length === 0) {
        figma.closePlugin('No Android icons found to export.');
        return;
      }
      
      figma.showUI(__html__, { width: 256, height: 140 })
      figma.ui.postMessage({
        type: 'export-assets-android',
        outputName: figma.currentPage.name,
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

async function getExportSVGFromLayer(asset: any): Promise<any[]> {
  try {
    let images = await Promise.all([asset].map(async asset => {
      try {
        // Use SVG format
        const exportSetting: ExportSettingsSVG = {
          format: 'SVG'
        }
        const layer = asset.layer
        
        const svgData = await (<ExportMixin>layer).exportAsync(exportSetting);
        
        // Convert binary SVG data to string
        const bytes = new Uint8Array(svgData);
        let svgString = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          svgString += String.fromCharCode(bytes[i]);
        }
        
        // Convert SVG to VectorDrawable
        const vectorDrawableXml = svgToVectorDrawable(svgString, {
          width: layer.width,
          height: layer.height,
          isRTL: asset.isRTL || false
        });
        
        return {
          width: layer.width,
          height: layer.height,
          path: asset.dir + asset.file,
          text: vectorDrawableXml
        };
      } catch (error) {
        console.error('Error processing asset:', asset.file, error);
        throw error;
      }
    }));
    return images;
  } catch (error) {
    console.error('Error in getExportSVGFromLayer:', error);
    throw error;
  }
}
