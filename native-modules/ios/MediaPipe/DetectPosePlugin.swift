import Foundation
import UIKit
import MediaPipeTasksVision

/**
 * Frame Processor Plugin per pose detection in tempo reale.
 *
 * Pattern: Fire & Poll + Async Processing
 * - Riceve frame dalla camera via Vision Camera
 * - Processa su thread separato (non blocca la camera)
 * - Salva il risultato in MediaPipePoseModule.latestResult
 * - Il JS thread fa polling con getLastResult()
 */
@objc(DetectPosePlugin)
public class DetectPosePlugin: FrameProcessorPlugin {

  private static let TAG = "DetectPosePlugin"
  private static let MIN_INTERVAL_MS: Int64 = 66 // Max 15 FPS per ridurre carico
  private static let MAX_DIMENSION: CGFloat = 360 // Ridotto per velocità
  private static let LOG_EVERY_N_FRAMES: Int64 = 60

  // Thread per il processing MediaPipe
  private let processingQueue = DispatchQueue(label: "com.pusho.mediapipe.processing", qos: .userInitiated)

  // Flag per evitare accumulo di task
  private var isProcessingAsync = false
  private let processingLock = NSLock()

  private var lastProcessTime: Int64 = 0
  private var frameCount: Int64 = 0
  private var successCount: Int64 = 0
  private var failCount: Int64 = 0

  @objc public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
    NSLog("\(DetectPosePlugin.TAG): ✅ DetectPosePlugin inizializzato (async mode)")
  }

  @objc public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    frameCount += 1

    // 1. Throttling
    let now = Int64(Date().timeIntervalSince1970 * 1000)
    if now - lastProcessTime < DetectPosePlugin.MIN_INTERVAL_MS {
      return nil
    }

    // 2. Skip se già in elaborazione asincrona
    processingLock.lock()
    let alreadyProcessing = isProcessingAsync
    processingLock.unlock()

    if alreadyProcessing {
      return nil
    }

    // 3. Verifica MediaPipe pronto
    guard let landmarker = MediaPipePoseModule.sharedLandmarker,
          MediaPipePoseModule.isLandmarkerReady else {
      return nil
    }

    lastProcessTime = now

    // 4. Ottieni il buffer dell'immagine
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      failCount += 1
      return nil
    }

    // 5. Converti in UIImage
    guard let uiImage = pixelBufferToUIImage(pixelBuffer: pixelBuffer, orientation: frame.orientation) else {
      failCount += 1
      return nil
    }

    successCount += 1

    // 6. Processa in background (NON blocca il frame processor)
    processingLock.lock()
    isProcessingAsync = true
    processingLock.unlock()

    processingQueue.async { [weak self] in
      self?.processFrameAsync(image: uiImage, landmarker: landmarker, timestamp: now)

      self?.processingLock.lock()
      self?.isProcessingAsync = false
      self?.processingLock.unlock()
    }

    // Ritorna SUBITO - il frame processor non è bloccato
    return nil
  }

  /**
   * Processa il frame su thread separato.
   * Non blocca la camera.
   */
  private func processFrameAsync(image: UIImage, landmarker: PoseLandmarker, timestamp: Int64) {
    do {
      var processedImage = image
      let originalWidth: Int
      let originalHeight: Int

      // Gestisci orientamento (camera frontale)
      if image.size.width > image.size.height {
        // Frame landscape: ruota 90° e flippa
        if let rotated = rotateAndFlipImage(image, rotationDegrees: 90, flipHorizontal: true, flipVertical: true) {
          processedImage = rotated
        }
      } else {
        // Frame già portrait: flippa entrambi gli assi (camera frontale)
        if let flipped = rotateAndFlipImage(image, rotationDegrees: 0, flipHorizontal: true, flipVertical: true) {
          processedImage = flipped
        }
      }

      originalWidth = Int(processedImage.size.width)
      originalHeight = Int(processedImage.size.height)

      // Resize per performance
      if processedImage.size.width > DetectPosePlugin.MAX_DIMENSION ||
         processedImage.size.height > DetectPosePlugin.MAX_DIMENSION {
        let scale = min(
          DetectPosePlugin.MAX_DIMENSION / processedImage.size.width,
          DetectPosePlugin.MAX_DIMENSION / processedImage.size.height
        )
        let newWidth = processedImage.size.width * scale
        let newHeight = processedImage.size.height * scale

        if let resized = resizeImage(processedImage, to: CGSize(width: newWidth, height: newHeight)) {
          processedImage = resized
        }
      }

      // Esegui MediaPipe
      let startTime = Date()
      guard let mpImage = try? MPImage(uiImage: processedImage) else {
        NSLog("\(DetectPosePlugin.TAG): ❌ Impossibile creare MPImage")
        return
      }

      let result = try landmarker.detect(image: mpImage)
      let processingTime = Int64(Date().timeIntervalSince(startTime) * 1000)

      // Salva risultato
      let resultDict = convertResult(result: result, originalWidth: originalWidth, originalHeight: originalHeight, processingTime: processingTime)
      MediaPipePoseModule.latestResult = resultDict
      MediaPipePoseModule.lastResultTimestamp = timestamp

      if frameCount % DetectPosePlugin.LOG_EVERY_N_FRAMES == 0 {
        let landmarkCount = result.landmarks.isEmpty ? 0 : result.landmarks[0].count
        NSLog("\(DetectPosePlugin.TAG): ✅ Frame #\(frameCount): \(landmarkCount) landmarks (\(processingTime)ms) [async]")
      }

    } catch {
      NSLog("\(DetectPosePlugin.TAG): ❌ Errore async: \(error.localizedDescription)")
    }
  }

  /**
   * Converte CVPixelBuffer in UIImage.
   */
  private func pixelBufferToUIImage(pixelBuffer: CVPixelBuffer, orientation: UIImage.Orientation) -> UIImage? {
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    let context = CIContext()

    guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
      return nil
    }

    return UIImage(cgImage: cgImage, scale: 1.0, orientation: orientation)
  }

  /**
   * Ruota e flippa un'immagine.
   */
  private func rotateAndFlipImage(_ image: UIImage, rotationDegrees: CGFloat, flipHorizontal: Bool, flipVertical: Bool) -> UIImage? {
    let radians = rotationDegrees * .pi / 180

    var newSize = image.size
    if rotationDegrees == 90 || rotationDegrees == 270 {
      newSize = CGSize(width: image.size.height, height: image.size.width)
    }

    UIGraphicsBeginImageContextWithOptions(newSize, false, image.scale)
    guard let context = UIGraphicsGetCurrentContext() else { return nil }

    // Sposta al centro
    context.translateBy(x: newSize.width / 2, y: newSize.height / 2)

    // Ruota
    if rotationDegrees != 0 {
      context.rotate(by: radians)
    }

    // Flip
    var scaleX: CGFloat = 1.0
    var scaleY: CGFloat = 1.0
    if flipHorizontal { scaleX = -1.0 }
    if flipVertical { scaleY = -1.0 }
    context.scaleBy(x: scaleX, y: scaleY)

    // Disegna
    image.draw(in: CGRect(
      x: -image.size.width / 2,
      y: -image.size.height / 2,
      width: image.size.width,
      height: image.size.height
    ))

    let result = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return result
  }

  /**
   * Ridimensiona un'immagine.
   */
  private func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
    UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
    image.draw(in: CGRect(origin: .zero, size: size))
    let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return resizedImage
  }

  /**
   * Converte risultato MediaPipe in dizionario.
   */
  private func convertResult(result: PoseLandmarkerResult, originalWidth: Int, originalHeight: Int, processingTime: Int64) -> [String: Any] {
    var landmarksArray: [[String: Any]] = []

    if result.landmarks.isEmpty {
      return [
        "landmarks": landmarksArray,
        "imageWidth": originalWidth,
        "imageHeight": originalHeight,
        "processingTime": Double(processingTime)
      ]
    }

    let poseLandmarks = result.landmarks[0]
    for landmark in poseLandmarks {
      let landmarkDict: [String: Any] = [
        "x": Double(landmark.x),
        "y": Double(landmark.y),
        "z": Double(landmark.z),
        "inFrameLikelihood": Double(truncating: landmark.visibility ?? 0)
      ]
      landmarksArray.append(landmarkDict)
    }

    return [
      "landmarks": landmarksArray,
      "imageWidth": originalWidth,
      "imageHeight": originalHeight,
      "processingTime": Double(processingTime)
    ]
  }
}
