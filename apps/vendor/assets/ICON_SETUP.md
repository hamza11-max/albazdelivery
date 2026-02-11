# Icon Setup Instructions

## Current Status
- **logo.png** – Main logo (eagle/raptor) used for web, tray, Linux, and as source for .ico
- **logo.ico** – Generated from logo.png (run `npm run setup:icons`) for Windows exe and window icon
- **build/icon.ico** – Copied from assets/logo.ico by `setup:icons`; electron-builder uses this for the **installed** exe, Desktop shortcut, and Start Menu so the icon appears correctly after install

## Required Icon Formats

### Windows (.ico)
- **Required**: `logo.ico` (used by electron-builder and app window)
- **Location**: `apps/vendor/assets/logo.ico`
- **Generate**: `npm install png-to-ico --save-dev && npm run setup:icons`

### macOS (.icns)
- **Required**: `logo.icns`
- **Location**: `apps/vendor/assets/logo.icns`

### Linux (.png)
- **Source**: `logo.png` (same file used for tray and web)
- **Location**: `apps/vendor/assets/logo.png`

## Conversion Tools

### Option 1: Online converter (easiest for logo.ico)
1. Visit https://convertio.co/png-ico/ or https://cloudconvert.com/png-to-ico
2. Upload `assets/logo.png`
3. Download as `logo.ico`
4. Save to `apps/vendor/assets/logo.ico`

### Option 2: ImageMagick
```bash
magick convert logo.png -define icon:auto-resize=16,32,48,64,128,256 logo.ico
```

### Option 3: npm script (if png-to-ico works)
```bash
cd apps/vendor && npm run setup:icons
```

## Verification

```bash
# Windows build needs logo.ico and logo.png
dir apps\vendor\assets\
# Should have: logo.png, logo.ico (and optionally logo.icns for macOS)
```

## Notes
- The logo should be square or will be cropped to square
- Recommended size: 512x512 pixels minimum
- Transparent background works best
- The icon will appear in:
  - Windows taskbar
  - App window title bar
  - Installer
  - Desktop shortcut and Start Menu (when using build/icon.ico via `npm run setup:icons` before build)

