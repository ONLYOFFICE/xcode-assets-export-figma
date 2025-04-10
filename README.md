# Xcode Assets Export

![](xcode-assets-export-figma.png)

A Figma plugin for exporting resources in Xcode Assets Catalog (.xcassets) format.

## Installation

#### Download the Figma desktop app
Currently, plugin development and testing must be done using the Figma desktop app. This is necessary because Figma needs to read your code saved as a local file. The Figma desktop app can be downloaded here: https://www.figma.com/downloads/.

If you already have the desktop app, please make sure to update to the latest version, as several features have been added specifically to improve the plugin development experience.

#### Log in to your account and open the editor
You can open any existing document or create a new one.

#### Go to Menu > Plugins > Development > New Plugin...
This will bring up the "Create a plugin" modal to load an existing plugin.

#### Choose a manifest.json from the code folder
In the system dialog that appears, select the manifest.json file.

## Features

**Export Icons Assets**

Exports icons in PDF format with support for:
- Light and dark modes
- Language direction (RTL - right to left)
- Localization for different languages (e.g., Russian)

**Export Colors Assets**

Exports colors in .colorset format for use in Xcode:
- Support for light and dark themes
- Structured export in .xcassets format

**Export PDF Assets (Legacy)**

Exports resources in PDF format based on the structure of the parent frame to the Xcode assets directory structure.

## License

MIT
