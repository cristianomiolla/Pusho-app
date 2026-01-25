const https = require('https');
const fs = require('fs');
const path = require('path');

// URL del modello MediaPipe Pose Landmarker
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const ASSETS_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
const MODEL_PATH = path.join(ASSETS_DIR, 'pose_landmarker_full.task');

console.log('📥 Downloading MediaPipe Pose Landmarker model...');
console.log('   URL:', MODEL_URL);
console.log('   Destination:', MODEL_PATH);

// Crea la cartella assets se non esiste
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log('✅ Created assets directory');
}

// Scarica il modello
const file = fs.createWriteStream(MODEL_PATH);
https.get(MODEL_URL, (response) => {
  const totalSize = parseInt(response.headers['content-length'], 10);
  let downloadedSize = 0;

  response.on('data', (chunk) => {
    downloadedSize += chunk.length;
    const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
    process.stdout.write(`\r📦 Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✅ Model downloaded successfully!');
    console.log(`   Size: ${(fs.statSync(MODEL_PATH).size / 1024 / 1024).toFixed(2)}MB`);
    console.log('   Ready to use MediaPipe Pose Detection 🚀');
  });
}).on('error', (err) => {
  fs.unlink(MODEL_PATH, () => {});
  console.error('❌ Error downloading model:', err.message);
  process.exit(1);
});

file.on('error', (err) => {
  fs.unlink(MODEL_PATH, () => {});
  console.error('❌ Error writing file:', err.message);
  process.exit(1);
});
