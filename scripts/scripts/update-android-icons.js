const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '../assets/icon.png');
const ANDROID_RES = path.join(__dirname, '../android/app/src/main/res');

const ICON_SIZES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

const FOREGROUND_SIZES = {
  'mdpi': 108,
  'hdpi': 162,
  'xhdpi': 216,
  'xxhdpi': 324,
  'xxxhdpi': 432
};

const SPLASH_SIZES = {
  'mdpi': 100,
  'hdpi': 150,
  'xhdpi': 200,
  'xxhdpi': 300,
  'xxxhdpi': 400
};

async function generateIcons() {
  console.log('Starting icon generation from:', SOURCE);
  
  // Generate ic_launcher and ic_launcher_round
  for (const [density, size] of Object.entries(ICON_SIZES)) {
    const mipmapDir = path.join(ANDROID_RES, `mipmap-${density}`);
    
    // ic_launcher.webp
    await sharp(SOURCE)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(path.join(mipmapDir, 'ic_launcher.webp'));
    console.log(`Created mipmap-${density}/ic_launcher.webp (${size}x${size})`);
    
    // ic_launcher_round.webp
    await sharp(SOURCE)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(path.join(mipmapDir, 'ic_launcher_round.webp'));
    console.log(`Created mipmap-${density}/ic_launcher_round.webp (${size}x${size})`);
  }
  
  // Generate ic_launcher_foreground (larger for adaptive icons)
  for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
    const mipmapDir = path.join(ANDROID_RES, `mipmap-${density}`);
    
    await sharp(SOURCE)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(path.join(mipmapDir, 'ic_launcher_foreground.webp'));
    console.log(`Created mipmap-${density}/ic_launcher_foreground.webp (${size}x${size})`);
  }
  
  // Generate splashscreen_logo PNG files
  for (const [density, size] of Object.entries(SPLASH_SIZES)) {
    const drawableDir = path.join(ANDROID_RES, `drawable-${density}`);
    
    if (fs.existsSync(drawableDir)) {
      await sharp(SOURCE)
        .resize(size, size)
        .png()
        .toFile(path.join(drawableDir, 'splashscreen_logo.png'));
      console.log(`Created drawable-${density}/splashscreen_logo.png (${size}x${size})`);
    }
  }
  
  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
