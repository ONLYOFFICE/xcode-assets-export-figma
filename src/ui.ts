import './ui.css';
import JSZip from '../node_modules/jszip';

window.onmessage = async (event) => {
    const pluginMessage = event.data.pluginMessage;

    if (!pluginMessage) {
        return;
    }

    // Export PNG
    if (pluginMessage.type === 'export-assets') {
        const output = pluginMessage.outputName
        const assets = []
            .concat(getContentsInfoFromPluginMessage(pluginMessage))
            .concat(getPDFAssetsFromPluginMessage(pluginMessage))

        showMessage('Successfully completed. Click Save to get the result.')
        showDownloadButton(assets, output);
    }

    // Export Colors
    if (pluginMessage.type === 'export-colors') {
        const output = pluginMessage.outputName
        const assets = []
            .concat(getContentsInfoFromPluginMessage(pluginMessage))

        showMessage('Successfully completed. Click Save to get the result.')
        showDownloadButton(assets, output);
    }

    // Export Icons
    if (pluginMessage.type === 'export-assets-2') {
        const output = pluginMessage.outputName
        const assets = []
            .concat(getContentsInfoFromPluginMessage(pluginMessage))
            .concat(getPDFAssetsFromPluginMessage(pluginMessage))

        showMessage('Successfully completed. Click Save to get the result.')
        showDownloadButton(assets, output);
    }
    
    // Export Android Icons
    if (pluginMessage.type === 'export-assets-android') {
        const output = pluginMessage.outputName
        const androidAssets = getAndroidAssetsFromPluginMessage(pluginMessage);
        showMessage('Successfully completed. Click Save to get the result.')
        showDownloadButton(androidAssets, output);
    }

    // Display message
    if (pluginMessage.type === 'show-error') {
        showMessage(pluginMessage.message)
    }
}

function getContentsInfoFromPluginMessage(pluginMessage: any): any[] {
    let assets: any[] = [];
    for (const exportContent of pluginMessage.exportContents) {
        assets.push({
            path: exportContent.path,
            text: exportContent.data
        });
    }
    return assets;
}

function getPDFAssetsFromPluginMessage(pluginMessage: any): any[] {
    let assets: any[] = [];
    for (const exportAsset of pluginMessage.exportAssets) {
        for (const item of exportAsset) {
            assets.push({
                path: item.path,
                blob: item.data
            });
        }
    }
    return assets;
}

function getAndroidAssetsFromPluginMessage(pluginMessage: any): any[] {
    let assets: any[] = [];
    for (const exportAsset of pluginMessage.exportAssets) {
        for (const item of exportAsset) {
            if (item.text) {
                assets.push({
                    path: item.path,
                    text: item.text
                });
            } else if (item.data) {
                assets.push({
                    path: item.path,
                    blob: item.data
                });
            }
        }
    }
    return assets;
}

/**
 * @param  {any[]} assets [{path: string, blob: Blob, text: string}]
 * @param  {string} name
 * @returns Promise
 */
function showDownloadButton(assets: any[], name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let zip = new JSZip();
        for (let file of assets) {
            if (file.blob) {
                zip.file(file.path, file.blob, { binary: true });
            } else if (file.base64) {
                zip.file(file.path, file.base64.replace('data:image/png;base64,', ''), { base64: true });
            } else if (file.text) {
                zip.file(file.path, file.text);
            }
        }
        zip.generateAsync({ type: 'blob' })
            .then((content: Blob) => {
                const blobURL = window.URL.createObjectURL(content);
                const link = document.createElement('a');
                link.className = 'button button--primary';
                link.href = blobURL;
                link.text = 'Save';
                link.setAttribute('download', name + '.zip');
                document.getElementById('footer').appendChild(link);
                resolve();
            })
    });
}

/**
 * @param  {string} message
 */
function showMessage(message: string) {
    const tip = document.createElement('div');
    tip.className = 'onboarding-tip';
    const text = document.createElement('div');
    text.className = 'onboarding-tip__msg';
    text.textContent = message;
    tip.appendChild(text);
    const contentDiv = document.getElementById('content');
    const appDiv = document.getElementById('app');
    contentDiv.appendChild(tip);
    appDiv.className += ' session__message';
}
