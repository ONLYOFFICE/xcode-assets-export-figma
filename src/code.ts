import contentsJsonTemplate from 'raw-loader!./contents.template';
import { exportColorAssetsForXcode } from './colors';
import { exportIconsAssetsForXcode, exportIconsAssetsForAndroid } from './icons'; 

let command = figma.command;
let currentPage = figma.currentPage;
let selectionFrame: SceneNode = currentPage.selection[0];

const StringFormat = (str: string, ...args: string[]) =>
  str.replace(/{(\d+)}/g, (match, index) => args[index] || '')

if (command === 'export-to-xcode') {
  if (!selectionFrame || selectionFrame.type != 'FRAME') {
    figma.closePlugin('Please select an frame to export.');
  } else {
    let assets: any[] = [];

  // Read node structure to assets
  function traverse(node, paths: String[]) {
    let localPaths = [...paths];
    if ("children" in node && node.type !== "INSTANCE") {
      localPaths.push(node.name)
      for (const child of node.children) {
        traverse(child, localPaths)
      }
    } else {
      localPaths[0] = localPaths[0] + '.xcassets'
      let lastComponent = localPaths[localPaths.length - 1];
      if (lastComponent.includes('.')) { // like .light or .dark
        let lastComponentName = localPaths.pop().replace(/\./g, '')
        localPaths.push(node.name + '.imageset')
        localPaths.push(node.name + '-' + lastComponentName + '.pdf')
      } else {
        localPaths.push(node.name + '.imageset')
        localPaths.push(node.name + '.pdf')
      }

      assets.push({
        pathComponents: localPaths,
        dir: localPaths.reduce((path, item, index) => index == localPaths.length - 1 ? path = path : path += item + '/', ''),
        file: localPaths[localPaths.length - 1],
        layer: node
      })
    }
  }
  traverse(selectionFrame, [])

  // Create list of Contents files
  let contents = assets
    .map((item, _, array) => array.filter(asset => asset.dir === item.dir)) // grupped
    .reduce((previous, current) => previous.findIndex(assets => assets[0].dir == current[0].dir) < 0 ? [...previous, current] : previous, []) // remove duplicate
    .map(assets => ({
      path: assets[0].dir + 'Contents.json',
      data: StringFormat(contentsJsonTemplate, assets[0].file, assets[1] ? assets[1].file : '')
    })) // transform data

  Promise.all(assets.map(asset => getExportImagesFromLayer(asset)))
    .then(exportAssets => {
      figma.showUI(__html__, { width: 256, height: 140 })
      figma.ui.postMessage({
        type: 'export-assets',
        outputName: selectionFrame.name + '.xcassets',
        exportAssets: exportAssets,
        exportContents: contents
      })
    })
    .catch(error => {
      console.log(error)
      figma.closePlugin('Error exporting layers.')
    });
  }
} else if (command === 'export-colors-to-xcode') {
  exportColorAssetsForXcode();
} else if (command === 'export-icons-to-xcode') {
  (async function() {
    await exportIconsAssetsForXcode();
  })();
} else if (command === 'export-icons-to-android') {
  (async function() {
    await exportIconsAssetsForAndroid();
  })();
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
