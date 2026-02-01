/**
 * PWA Icon Generator Script
 * 
 * This script generates all required PWA icons from a source image.
 * 
 * Prerequisites:
 *   npm install sharp
 * 
 * Usage:
 *   node scripts/generate-icons.js
 * 
 * Or with custom source:
 *   node scripts/generate-icons.js --source path/to/logo.png
 */

const fs = require('fs');
const path = require('path');

// Try to load sharp, provide helpful message if not installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('\n❌ Error: "sharp" package is not installed.\n');
  console.log('Please install it by running:');
  console.log('  npm install sharp\n');
  console.log('Then run this script again.');
  process.exit(1);
}

// Configuration
const SOURCE_IMAGE = process.argv.includes('--source') 
  ? process.argv[process.argv.indexOf('--source') + 1]
  : path.join(__dirname, '..', 'public', 'q8-logo.png');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const SPLASH_DIR = path.join(__dirname, '..', 'public', 'splash');

// Q8 brand colors
const BRAND_NAVY = '#003D6B';
const WHITE = '#FFFFFF';

// Icon sizes configuration
const STANDARD_ICONS = [
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 168, name: 'icon-168x168.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const MASKABLE_ICONS = [
  { size: 192, name: 'maskable-192x192.png', padding: 0.1 },
  { size: 512, name: 'maskable-512x512.png', padding: 0.1 },
];

const APPLE_ICONS = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
];

const FAVICON_ICONS = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
];

const MS_TILES = [
  { size: 70, name: 'mstile-70x70.png' },
  { size: 144, name: 'mstile-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 310, name: 'mstile-310x310.png' },
  { width: 310, height: 150, name: 'mstile-310x150.png' },
];

const SHORTCUT_ICONS = [
  { size: 96, name: 'shortcut-parking.png' },
  { size: 96, name: 'shortcut-history.png' },
  { size: 96, name: 'shortcut-plates.png' },
];

const SOCIAL_ICONS = [
  { width: 1200, height: 630, name: 'og-image.png' },
  { width: 1200, height: 630, name: 'twitter-card.png' },
];

// Splash screen sizes for iOS
const SPLASH_SCREENS = [
  { width: 1290, height: 2796, name: 'iphone-14-pro-max.png' },
  { width: 1179, height: 2556, name: 'iphone-14-pro.png' },
  { width: 1170, height: 2532, name: 'iphone-14.png' },
  { width: 750, height: 1334, name: 'iphone-se.png' },
  { width: 2048, height: 2732, name: 'ipad-pro-12.9.png' },
];

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

// Generate standard icons (transparent background)
async function generateStandardIcons(sourceBuffer) {
  console.log('\n📦 Generating standard icons...');
  
  for (const icon of STANDARD_ICONS) {
    try {
      await sharp(sourceBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));
      
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${icon.name}:`, error.message);
    }
  }
}

// Generate maskable icons (with background and safe zone)
async function generateMaskableIcons(sourceBuffer) {
  console.log('\n🎭 Generating maskable icons...');
  
  for (const icon of MASKABLE_ICONS) {
    try {
      const innerSize = Math.round(icon.size * (1 - icon.padding * 2));
      
      // Create background
      const background = await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: BRAND_NAVY
        }
      }).png().toBuffer();
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite logo on background
      const padding = Math.round(icon.size * icon.padding);
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));
      
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size} with ${icon.padding * 100}% safe zone)`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${icon.name}:`, error.message);
    }
  }
}

// Generate Apple touch icons (solid background)
async function generateAppleIcons(sourceBuffer) {
  console.log('\n🍎 Generating Apple touch icons...');
  
  for (const icon of APPLE_ICONS) {
    try {
      const innerSize = Math.round(icon.size * 0.8);
      const padding = Math.round((icon.size - innerSize) / 2);
      
      // Create white background
      const background = await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: WHITE
        }
      }).png().toBuffer();
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));
      
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${icon.name}:`, error.message);
    }
  }
}

// Generate favicon icons
async function generateFavicons(sourceBuffer) {
  console.log('\n🔖 Generating favicons...');
  
  for (const icon of FAVICON_ICONS) {
    try {
      await sharp(sourceBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));
      
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${icon.name}:`, error.message);
    }
  }
}

// Generate Microsoft tiles
async function generateMSTiles(sourceBuffer) {
  console.log('\n🪟 Generating Microsoft tiles...');
  
  for (const tile of MS_TILES) {
    try {
      const width = tile.width || tile.size;
      const height = tile.height || tile.size;
      const innerSize = Math.min(width, height) * 0.6;
      
      // Create brand background
      const background = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: BRAND_NAVY
        }
      }).png().toBuffer();
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(Math.round(innerSize), Math.round(innerSize), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite centered
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: Math.round((height - innerSize) / 2),
          left: Math.round((width - innerSize) / 2)
        }])
        .png()
        .toFile(path.join(OUTPUT_DIR, tile.name));
      
      console.log(`  ✅ ${tile.name} (${width}x${height})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${tile.name}:`, error.message);
    }
  }
}

// Generate shortcut icons
async function generateShortcutIcons(sourceBuffer) {
  console.log('\n⚡ Generating shortcut icons...');
  
  for (const icon of SHORTCUT_ICONS) {
    try {
      // Create brand background with padding
      const background = await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: BRAND_NAVY
        }
      }).png().toBuffer();
      
      const innerSize = Math.round(icon.size * 0.6);
      const padding = Math.round((icon.size - innerSize) / 2);
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(OUTPUT_DIR, icon.name));
      
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${icon.name}:`, error.message);
    }
  }
}

// Generate social media images
async function generateSocialImages(sourceBuffer) {
  console.log('\n📱 Generating social media images...');
  
  for (const img of SOCIAL_ICONS) {
    try {
      // Create brand background
      const background = await sharp({
        create: {
          width: img.width,
          height: img.height,
          channels: 4,
          background: BRAND_NAVY
        }
      }).png().toBuffer();
      
      const logoSize = Math.min(img.width, img.height) * 0.4;
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(Math.round(logoSize), Math.round(logoSize), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite centered
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: Math.round((img.height - logoSize) / 2),
          left: Math.round((img.width - logoSize) / 2)
        }])
        .png()
        .toFile(path.join(OUTPUT_DIR, img.name));
      
      console.log(`  ✅ ${img.name} (${img.width}x${img.height})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${img.name}:`, error.message);
    }
  }
}

// Generate splash screens
async function generateSplashScreens(sourceBuffer) {
  console.log('\n💦 Generating iOS splash screens...');
  
  for (const splash of SPLASH_SCREENS) {
    try {
      // Create brand background
      const background = await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: BRAND_NAVY
        }
      }).png().toBuffer();
      
      const logoSize = Math.min(splash.width, splash.height) * 0.3;
      
      // Resize logo
      const resizedLogo = await sharp(sourceBuffer)
        .resize(Math.round(logoSize), Math.round(logoSize), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // Composite centered
      await sharp(background)
        .composite([{
          input: resizedLogo,
          top: Math.round((splash.height - logoSize) / 2),
          left: Math.round((splash.width - logoSize) / 2)
        }])
        .png()
        .toFile(path.join(SPLASH_DIR, splash.name));
      
      console.log(`  ✅ ${splash.name} (${splash.width}x${splash.height})`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${splash.name}:`, error.message);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Q8 Parking PWA Icon Generator\n');
  console.log('━'.repeat(50));
  
  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`\n❌ Source image not found: ${SOURCE_IMAGE}`);
    console.log('\nPlease provide a valid source image.');
    console.log('Usage: node generate-icons.js --source path/to/logo.png');
    process.exit(1);
  }
  
  console.log(`📷 Source image: ${SOURCE_IMAGE}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Ensure directories exist
  ensureDir(OUTPUT_DIR);
  ensureDir(SPLASH_DIR);
  
  // Load source image
  let sourceBuffer;
  try {
    sourceBuffer = await sharp(SOURCE_IMAGE).png().toBuffer();
    const metadata = await sharp(sourceBuffer).metadata();
    console.log(`📐 Source dimensions: ${metadata.width}x${metadata.height}`);
    
    if (metadata.width < 512 || metadata.height < 512) {
      console.warn('\n⚠️  Warning: Source image is smaller than 512x512.');
      console.warn('   For best results, use a source image of at least 1024x1024 pixels.\n');
    }
  } catch (error) {
    console.error(`\n❌ Failed to load source image: ${error.message}`);
    process.exit(1);
  }
  
  // Generate all icons
  await generateStandardIcons(sourceBuffer);
  await generateMaskableIcons(sourceBuffer);
  await generateAppleIcons(sourceBuffer);
  await generateFavicons(sourceBuffer);
  await generateMSTiles(sourceBuffer);
  await generateShortcutIcons(sourceBuffer);
  await generateSocialImages(sourceBuffer);
  await generateSplashScreens(sourceBuffer);
  
  console.log('\n━'.repeat(50));
  console.log('✅ Icon generation complete!\n');
  console.log('Next steps:');
  console.log('1. Verify icons in public/icons/ folder');
  console.log('2. Test maskable icons at https://maskable.app/');
  console.log('3. Run Lighthouse PWA audit');
  console.log('4. Test on real iOS and Android devices');
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
