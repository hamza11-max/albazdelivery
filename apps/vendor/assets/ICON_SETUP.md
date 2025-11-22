# Icon Setup Instructions

## Current Status
✅ Logo image copied: `logo.png`

## Required Icon Formats

For Electron to work properly, you need to convert the logo to different formats:

### Windows (.ico)
- **Required**: `icon.ico`
- **Sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **Location**: `apps/vendor/assets/icon.ico`

### macOS (.icns)
- **Required**: `icon.icns`
- **Location**: `apps/vendor/assets/icon.icns`

### Linux (.png)
- **Required**: `icon.png` (512x512 recommended)
- **Location**: `apps/vendor/assets/icon.png`

## Conversion Tools

### Option 1: Online Converter (Easiest)
1. Visit: https://convertio.co/png-ico/ or https://cloudconvert.com/png-to-ico
2. Upload `logo.png`
3. Download `icon.ico`
4. Place in `apps/vendor/assets/icon.ico`

### Option 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# Mac: brew install imagemagick

# Convert to ICO with multiple sizes
magick convert logo.png -define icon:auto-resize=16,32,48,64,128,256 icon.ico

# Convert to ICNS (Mac only)
magick convert logo.png -resize 512x512 icon.icns
```

### Option 3: GIMP (Free Image Editor)
1. Open `logo.png` in GIMP
2. Export as ICO (File → Export As → icon.ico)
3. Choose multiple sizes when prompted

### Option 4: Electron Icon Generator
```bash
npm install -g electron-icon-maker
cd apps/vendor/assets
electron-icon-maker --input=logo.png --output=.
```

## Quick Setup (Recommended)

Run this command to generate all icon formats:

```bash
cd apps/vendor/assets
npm install -g electron-icon-maker
electron-icon-maker --input=logo.png --output=.
```

Or use the online converter:
1. Go to https://convertio.co/png-ico/
2. Upload `logo.png`
3. Download `icon.ico`
4. Place in `apps/vendor/assets/`

## Verification

After creating icons, verify they exist:
```bash
ls apps/vendor/assets/
# Should show: icon.ico, icon.icns, icon.png, logo.png
```

## Notes
- The logo should be square or will be cropped to square
- Recommended size: 512x512 pixels minimum
- Transparent background works best
- The icon will appear in:
  - Windows taskbar
  - App window title bar
  - Installer
  - Desktop shortcut

