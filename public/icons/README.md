# Icons Folder

This folder should contain all PWA icons for the Q8 Parking app.

## Required Icons

### Standard PWA Icons (Transparent Background)

- `icon-48x48.png`
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-144x144.png`
- `icon-168x168.png`
- `icon-192x192.png` ← **Required minimum**
- `icon-256x256.png`
- `icon-384x384.png`
- `icon-512x512.png` ← **Required minimum**

### Maskable Icons (Solid Background with Safe Zone)

- `maskable-192x192.png` ← **Required for Android adaptive icons**
- `maskable-512x512.png` ← **Required for Android adaptive icons**

### Apple Touch Icons (Solid Background, No Transparency)

- `apple-touch-icon.png` (180x180)
- `apple-touch-icon-152x152.png`
- `apple-touch-icon-167x167.png`
- `apple-touch-icon-180x180.png`

### Favicons

- `favicon-16x16.png`
- `favicon-32x32.png`

### Microsoft Tiles

- `mstile-144x144.png`

### Social Media

- `og-image.png` (1200x630 recommended)

### Shortcuts

- `shortcut-parking.png` (96x96)
- `shortcut-history.png` (96x96)

## How to Generate

### Option 1: PWA Asset Generator (Recommended)

```bash
npm install -g pwa-asset-generator
pwa-asset-generator ../q8-logo.png ./ --background "#003D6B" --maskable true
```

### Option 2: PWA Builder (Web-based)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload q8-logo.png (from parent folder)
3. Download and extract icons here

### Option 3: RealFaviconGenerator

1. Go to https://realfavicongenerator.net/
2. Upload source image
3. Configure colors (#003D6B)
4. Download package

## Design Specs

- **Standard icons**: Transparent background, centered logo
- **Maskable icons**: #003D6B background, 10% safe zone padding, logo in center 80%
- **Apple icons**: White or #003D6B background, no transparency
- **Target size**: Source image should be 1024x1024 or larger

## Testing

After creating icons:

1. Test maskable icons at https://maskable.app/
2. Run Lighthouse PWA audit in Chrome DevTools
3. Install app on real iOS and Android devices
