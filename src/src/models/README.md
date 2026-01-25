# ML Kit Pose Detection

Questa app ora usa **Google ML Kit** per la pose detection invece di TensorFlow Lite.

## Vantaggi di ML Kit

✅ **Nessun modello da scaricare** - ML Kit funziona out-of-the-box
✅ **Compatibile Android + iOS** - funziona su entrambe le piattaforme
✅ **Più veloce** - ottimizzato per dispositivi mobile
✅ **Nessun buffer locking** - risolve i problemi di Android
✅ **33 landmarks** - più accurato (usiamo 17 per compatibilità)

## Come Funziona

ML Kit è integrato nativamente tramite:
- Android: `com.google.mlkit:pose-detection`
- iOS: `GoogleMLKit/PoseDetection` (via CocoaPods)
- React Native: `@scottjgilroy/react-native-vision-camera-v4-pose-detection`

Il plugin si integra direttamente con `react-native-vision-camera` e processa i frame in real-time senza dover estrarre buffer pixel.

## Documentazione

- [ML Kit Pose Detection](https://developers.google.com/ml-kit/vision/pose-detection)
- [Vision Camera Plugin](https://www.npmjs.com/package/@scottjgilroy/react-native-vision-camera-v4-pose-detection)
