#!/usr/bin/env node

/**
 * Script di verifica setup iOS
 *
 * Controlla che tutti i file necessari per il build iOS siano presenti
 * e correttamente configurati.
 *
 * Usage: node scripts/verify-ios-setup.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Colori per output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File non trovato: ${filePath}`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(projectRoot, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();

  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Directory non trovata: ${dirPath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description} - File non trovato: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const found = content.includes(searchString);

  if (found) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`⚠️  ${description} - String "${searchString}" non trovata`, 'yellow');
    return false;
  }
}

// Main verification
log('\n🔍 Verifica Setup iOS per Pusho\n', 'blue');

let allChecks = true;

// 1. Check struttura directory iOS
log('📁 Verifica struttura directory...', 'blue');
allChecks &= checkDirectory('ios', 'Directory ios/');
allChecks &= checkDirectory('ios/Pusho', 'Directory ios/Pusho/');
allChecks &= checkDirectory('ios/Pusho/MediaPipe', 'Directory ios/Pusho/MediaPipe/');

// 2. Check moduli nativi MediaPipe
log('\n📦 Verifica moduli nativi MediaPipe...', 'blue');
allChecks &= checkFile('ios/Pusho/MediaPipe/MediaPipePoseModule.swift', 'Modulo Swift MediaPipe');
allChecks &= checkFile('ios/Pusho/MediaPipe/MediaPipePoseModule.m', 'Bridge Objective-C MediaPipe');

// 3. Check configurazione iOS
log('\n⚙️  Verifica configurazione iOS...', 'blue');
allChecks &= checkFile('ios/Podfile', 'Podfile');
allChecks &= checkFile('ios/Podfile.properties.json', 'Podfile.properties.json');
allChecks &= checkFile('ios/Pusho/Info.plist', 'Info.plist');
allChecks &= checkFile('ios/Pusho/Pusho-Bridging-Header.h', 'Bridging header');

// 4. Check modello MediaPipe
log('\n🤖 Verifica modello MediaPipe...', 'blue');
const androidModelPath = 'android/app/src/main/assets/pose_landmarker_full.task';
const iosModelPath = 'ios/Pusho/Resources/pose_landmarker_full.task';

const androidModelExists = checkFile(androidModelPath, 'Modello MediaPipe (Android)');

if (!androidModelExists) {
  log('   ℹ️  Esegui: npm run download-model', 'yellow');
}

// Il modello iOS viene copiato durante expo prebuild, quindi potrebbe non esistere ancora
const fullIosModelPath = path.join(projectRoot, iosModelPath);
if (fs.existsSync(fullIosModelPath)) {
  log(`✅ Modello MediaPipe (iOS)`, 'green');
} else {
  log(`⚠️  Modello MediaPipe (iOS) non ancora copiato - Normale prima di expo prebuild`, 'yellow');
  log(`   ℹ️  Verrà copiato automaticamente durante: npx expo prebuild --platform ios`, 'yellow');
}

// 5. Check dipendenze Podfile
log('\n📚 Verifica dipendenze Podfile...', 'blue');
allChecks &= checkFileContent(
  'ios/Podfile',
  'MediaPipeTasksVision',
  'MediaPipeTasksVision nel Podfile'
);

// 6. Check plugin Expo
log('\n🔌 Verifica plugin Expo...', 'blue');
allChecks &= checkFile('plugins/withMediaPipePreserve.js', 'Plugin Expo withMediaPipePreserve');
allChecks &= checkFileContent(
  'plugins/withMediaPipePreserve.js',
  'ios',
  'Hook iOS nel plugin Expo'
);

// 7. Check app.json
log('\n📄 Verifica app.json...', 'blue');
allChecks &= checkFileContent(
  'app.json',
  'com.pusho.app',
  'Bundle identifier iOS in app.json'
);
allChecks &= checkFileContent(
  'app.json',
  'NSCameraUsageDescription',
  'Permesso camera iOS in app.json'
);

// 8. Check documentazione
log('\n📖 Verifica documentazione...', 'blue');
allChecks &= checkFile('ios/README.md', 'iOS README');
allChecks &= checkFile('IOS_IMPLEMENTATION.md', 'Documentazione implementazione iOS');
allChecks &= checkFile('CHANGELOG_iOS.md', 'Changelog iOS');

// 9. Riepilogo
log('\n' + '='.repeat(60), 'blue');

if (allChecks) {
  log('\n✅ VERIFICA COMPLETATA CON SUCCESSO!\n', 'green');
  log('Tutti i file necessari per il build iOS sono presenti.', 'green');
  log('\nProssimi step:', 'blue');
  log('1. Installa dipendenze: npm install', 'reset');
  log('2. Scarica modello (se non già fatto): npm run download-model', 'reset');
  log('3. Installa pods: cd ios && pod install && cd ..', 'reset');
  log('4. Build iOS: npx expo run:ios\n', 'reset');
} else {
  log('\n⚠️  VERIFICA COMPLETATA CON AVVISI\n', 'yellow');
  log('Alcuni file potrebbero mancare. Controlla gli errori sopra.', 'yellow');
  log('\nSe hai appena clonato il repository:', 'blue');
  log('1. Esegui: npm install', 'reset');
  log('2. Esegui: npm run download-model', 'reset');
  log('3. Esegui: npx expo prebuild --platform ios\n', 'reset');
}

process.exit(allChecks ? 0 : 1);
