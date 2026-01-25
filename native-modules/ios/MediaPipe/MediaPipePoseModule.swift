import Foundation
import UIKit
import MediaPipeTasksVision

@objc(MediaPipePose)
class MediaPipePoseModule: NSObject {

  private var poseLandmarker: PoseLandmarker?
  private var isInitialized = false

  // ============================================
  // FIRE & POLL PATTERN - Shared State
  // ============================================

  /// Ultimo risultato disponibile per il polling JS
  static var latestResult: [String: Any]?

  /// Flag per evitare elaborazioni sovrapposte
  static var isProcessing: Bool = false

  /// Timestamp dell'ultimo risultato (per evitare duplicati)
  static var lastResultTimestamp: Int64 = 0

  /// Riferimento al PoseLandmarker condiviso con il plugin
  static var sharedLandmarker: PoseLandmarker?
  static var isLandmarkerReady: Bool = false

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  /// Inizializza MediaPipe Pose Landmarker
  @objc
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      if isInitialized {
        NSLog("MediaPipePose: ⚠️ Già inizializzato, skip")
        resolve(true)
        return
      }

      NSLog("MediaPipePose: 🚀 Inizializzazione MediaPipe Pose Landmarker...")

      // Debug: elenca tutti i file .task nel bundle
      NSLog("MediaPipePose: 🔍 Cercando file .task nel bundle...")
      if let bundlePath = Bundle.main.resourcePath {
        let fileManager = FileManager.default
        if let files = try? fileManager.contentsOfDirectory(atPath: bundlePath) {
          let taskFiles = files.filter { $0.hasSuffix(".task") }
          NSLog("MediaPipePose:    📂 File .task trovati: \(taskFiles)")
          if taskFiles.isEmpty {
            NSLog("MediaPipePose:    📂 Tutti i file nel bundle root: \(files.prefix(20))...")
          }
        }
      }

      // Ottieni il path del modello dal bundle
      guard let modelPath = Bundle.main.path(forResource: "pose_landmarker_full", ofType: "task") else {
        NSLog("MediaPipePose: ❌ Modello non trovato nel bundle!")
        NSLog("MediaPipePose: ❌ Bundle path: \(Bundle.main.bundlePath)")
        reject("INIT_ERROR", "Model file 'pose_landmarker_full.task' not found in bundle", nil)
        return
      }

      NSLog("MediaPipePose:    📦 Modello: \(modelPath)")

      // Configura BaseOptions con il modello
      let baseOptions = BaseOptions()
      baseOptions.modelAssetPath = modelPath

      // Opzioni bilanciate per detection affidabile (stesso setup di Android)
      let options = PoseLandmarkerOptions()
      options.baseOptions = baseOptions
      options.runningMode = .image // IMAGE mode per snapshot
      options.numPoses = 1 // Rileva max 1 persona
      options.minPoseDetectionConfidence = 0.5 // Soglia ragionevole
      options.minPosePresenceConfidence = 0.5 // Soglia ragionevole
      options.minTrackingConfidence = 0.5 // Soglia ragionevole

      NSLog("MediaPipePose:    ⚙️ RunningMode: IMAGE")
      NSLog("MediaPipePose:    ⚙️ NumPoses: 1")
      NSLog("MediaPipePose:    ⚙️ MinConfidence: 0.5")

      // Crea il landmarker
      poseLandmarker = try PoseLandmarker(options: options)
      isInitialized = true

      // Condividi il landmarker con il Frame Processor Plugin
      MediaPipePoseModule.sharedLandmarker = poseLandmarker
      MediaPipePoseModule.isLandmarkerReady = true

      NSLog("MediaPipePose: ✅ MediaPipe inizializzato con successo!")
      NSLog("MediaPipePose: ✅ Landmarker condiviso con Frame Processor Plugin")
      resolve(true)

    } catch {
      NSLog("MediaPipePose: ❌ ERRORE inizializzazione: \(error.localizedDescription)")
      reject("INIT_ERROR", "Failed to initialize MediaPipe: \(error.localizedDescription)", error)
    }
  }

  /// Rileva pose da file immagine
  @objc
  func detectPoseFromFile(_ filePath: String,
                          timestampMs: Double,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard isInitialized, let poseLandmarker = poseLandmarker else {
        NSLog("MediaPipePose: ❌ Non inizializzato! Chiama initialize() prima.")
        reject("NOT_INITIALIZED", "MediaPipe not initialized. Call initialize() first.", nil)
        return
      }

      // Pulisci path
      let cleanPath = filePath.replacingOccurrences(of: "file://", with: "")
      NSLog("MediaPipePose: 📸 Caricamento immagine: \(cleanPath)")

      // Carica immagine
      guard var image = UIImage(contentsOfFile: cleanPath) else {
        NSLog("MediaPipePose: ❌ Impossibile caricare immagine da: \(cleanPath)")
        reject("DECODE_ERROR", "Failed to load image from: \(cleanPath)", nil)
        return
      }

      NSLog("MediaPipePose:    🖼️ Immagine caricata: \(image.size.width)x\(image.size.height)")

      // Ruota se necessario (camera frontale può generare orientamenti strani)
      if image.size.width > image.size.height {
        NSLog("MediaPipePose:    🔄 Rotazione (landscape → portrait)")
        image = rotateImage(image, by: 90) ?? image
        NSLog("MediaPipePose:    ✓ Dopo rotazione: \(image.size.width)x\(image.size.height)")
      }

      // Salva dimensioni originali
      let originalWidth = Int(image.size.width)
      let originalHeight = Int(image.size.height)

      // Ridimensiona per performance (MediaPipe funziona bene con 480p)
      let maxDimension: CGFloat = 480
      var processedImage = image

      if image.size.width > maxDimension || image.size.height > maxDimension {
        let scale = min(maxDimension / image.size.width, maxDimension / image.size.height)
        let newWidth = image.size.width * scale
        let newHeight = image.size.height * scale

        NSLog("MediaPipePose:    📏 Ridimensionamento: \(image.size.width)x\(image.size.height) → \(newWidth)x\(newHeight)")

        processedImage = resizeImage(image, to: CGSize(width: newWidth, height: newHeight))
      }

      NSLog("MediaPipePose:    🎯 Immagine finale per detection: \(processedImage.size.width)x\(processedImage.size.height)")

      // Converti in MPImage
      guard let mpImage = try? MPImage(uiImage: processedImage) else {
        NSLog("MediaPipePose: ❌ Impossibile creare MPImage")
        reject("IMAGE_ERROR", "Failed to create MPImage from UIImage", nil)
        return
      }

      NSLog("MediaPipePose:    🔍 Esecuzione detection...")

      // Esegui detection (IMAGE mode usa detect, non detectAsync)
      let result = try poseLandmarker.detect(image: mpImage)

      // Log risultato
      if result.landmarks.isEmpty {
        NSLog("MediaPipePose:    ⚠️ Nessuna persona rilevata!")
      } else {
        NSLog("MediaPipePose:    ✅ Persona rilevata! \(result.landmarks.count) pose, \(result.landmarks[0].count) landmarks")

        // Log primi 5 landmarks per debug
        let landmarks = result.landmarks[0]
        if landmarks.count >= 13 {
          let nose = landmarks[0]
          let leftEye = landmarks[2]
          let rightEye = landmarks[5]
          let leftShoulder = landmarks[11]
          let rightShoulder = landmarks[12]

          NSLog("MediaPipePose:    👃 Naso [0]: x=\(nose.x), y=\(nose.y), z=\(nose.z), vis=\(nose.visibility)")
          NSLog("MediaPipePose:    👁️ LeftEye [2]: x=\(leftEye.x), y=\(leftEye.y), vis=\(leftEye.visibility)")
          NSLog("MediaPipePose:    👁️ RightEye [5]: x=\(rightEye.x), y=\(rightEye.y), vis=\(rightEye.visibility)")
          NSLog("MediaPipePose:    💪 LeftShoulder [11]: x=\(leftShoulder.x), y=\(leftShoulder.y), vis=\(leftShoulder.visibility)")
          NSLog("MediaPipePose:    💪 RightShoulder [12]: x=\(rightShoulder.x), y=\(rightShoulder.y), vis=\(rightShoulder.visibility)")
          NSLog("MediaPipePose:    📐 Immagine processata: \(processedImage.size.width)x\(processedImage.size.height)")
          NSLog("MediaPipePose:    📐 Dimensioni originali: \(originalWidth)x\(originalHeight)")
        }
      }

      // Converti risultato
      let response = convertPoseLandmarkerResult(
        result,
        originalWidth: originalWidth,
        originalHeight: originalHeight,
        processedWidth: Int(processedImage.size.width),
        processedHeight: Int(processedImage.size.height)
      )

      resolve(response)

    } catch {
      NSLog("MediaPipePose: ❌ ERRORE detection: \(error.localizedDescription)")
      reject("DETECTION_ERROR", "Pose detection failed: \(error.localizedDescription)", error)
    }
  }

  /// Converte PoseLandmarkerResult nel formato React Native
  private func convertPoseLandmarkerResult(
    _ result: PoseLandmarkerResult,
    originalWidth: Int,
    originalHeight: Int,
    processedWidth: Int,
    processedHeight: Int
  ) -> [String: Any] {

    var landmarksArray: [[String: Any]] = []

    if result.landmarks.isEmpty {
      // Nessuna persona rilevata - restituisci array vuoto
      NSLog("MediaPipePose:    📊 Risposta: 0 landmarks (nessuna persona)")
      return [
        "landmarks": landmarksArray,
        "imageWidth": originalWidth,
        "imageHeight": originalHeight
      ]
    }

    // Prendi prima persona (abbiamo setNumPoses(1))
    let poseLandmarks = result.landmarks[0]

    // MediaPipe ha 33 landmarks, le coordinate sono già normalizzate 0-1
    for landmark in poseLandmarks {
      let landmarkDict: [String: Any] = [
        "x": Double(landmark.x),
        "y": Double(landmark.y),
        "z": Double(landmark.z),
        // Usa visibility come confidence (MediaPipe chiama visibility quello che ML Kit chiama inFrameLikelihood)
        "inFrameLikelihood": Double(truncating: landmark.visibility ?? 0)
      ]
      landmarksArray.append(landmarkDict)
    }

    NSLog("MediaPipePose:    📊 Risposta: \(poseLandmarks.count) landmarks (dimensioni originali: \(originalWidth)x\(originalHeight))")

    // IMPORTANTE: Restituiamo le dimensioni ORIGINALI, non quelle processate
    // Le coordinate di MediaPipe sono normalizzate e valide per qualsiasi dimensione
    return [
      "landmarks": landmarksArray,
      "imageWidth": originalWidth,
      "imageHeight": originalHeight
    ]
  }

  /// Helper: ridimensiona immagine
  private func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage {
    UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
    image.draw(in: CGRect(origin: .zero, size: size))
    let resizedImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
    UIGraphicsEndImageContext()
    return resizedImage
  }

  /// Helper: ruota immagine
  private func rotateImage(_ image: UIImage, by degrees: CGFloat) -> UIImage? {
    let radians = degrees * .pi / 180
    var newSize = CGRect(origin: .zero, size: image.size)
      .applying(CGAffineTransform(rotationAngle: radians))
      .size

    // Trim off the extremely small float value to prevent core graphics from rounding it up
    newSize.width = floor(newSize.width)
    newSize.height = floor(newSize.height)

    UIGraphicsBeginImageContextWithOptions(newSize, false, image.scale)
    guard let context = UIGraphicsGetCurrentContext() else { return nil }

    // Move origin to middle
    context.translateBy(x: newSize.width / 2, y: newSize.height / 2)
    // Rotate around middle
    context.rotate(by: radians)
    // Draw the image at its center
    image.draw(in: CGRect(x: -image.size.width / 2, y: -image.size.height / 2,
                          width: image.size.width, height: image.size.height))

    let rotatedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return rotatedImage
  }

  // ============================================
  // FIRE & POLL PATTERN - Metodi per polling JS
  // ============================================

  /// Restituisce l'ultimo risultato elaborato dal Frame Processor.
  /// Chiamato in polling dal JS thread ogni ~33ms.
  @objc
  func getLastResult(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let result = MediaPipePoseModule.latestResult {
      // Clona il risultato e aggiungi timestamp
      var clonedResult = result
      clonedResult["timestamp"] = Double(MediaPipePoseModule.lastResultTimestamp)
      resolve(clonedResult)
    } else {
      resolve(nil)
    }
  }

  /// Verifica se il Frame Processor è pronto
  @objc
  func isFrameProcessorReady(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    let isReady = MediaPipePoseModule.isLandmarkerReady && MediaPipePoseModule.sharedLandmarker != nil
    resolve(isReady)
  }
}
