package {{PACKAGE_NAME}}.mediapipe

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap

class MediaPipePoseModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var poseLandmarker: PoseLandmarker? = null
    private var isInitialized = false

    // ============================================
    // FIRE & POLL PATTERN - Shared State
    // ============================================
    companion object {
        // Ultimo risultato disponibile per il polling JS
        @Volatile var latestResult: WritableMap? = null

        // Flag per evitare elaborazioni sovrapposte
        @Volatile var isProcessing: Boolean = false

        // Timestamp dell'ultimo risultato (per evitare duplicati)
        @Volatile var lastResultTimestamp: Long = 0

        // Riferimento al PoseLandmarker condiviso con il plugin
        @Volatile var sharedLandmarker: PoseLandmarker? = null
        @Volatile var isLandmarkerReady: Boolean = false

        // Riferimento al ReactContext per il plugin
        @Volatile var appReactContext: ReactApplicationContext? = null
    }

    override fun getName(): String = "MediaPipePose"

    /**
     * Inizializza MediaPipe Pose Landmarker
     */
    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            if (isInitialized) {
                android.util.Log.d("MediaPipePose", "⚠️ Già inizializzato, skip")
                promise.resolve(true)
                return
            }

            android.util.Log.d("MediaPipePose", "🚀 Inizializzazione MediaPipe Pose Landmarker...")

            // Configura BaseOptions con il modello dagli assets
            // IMPORTANTE: MediaPipe richiede uno slash nel path, quindi usiamo "./"
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("./pose_landmarker_full.task")
                .build()

            android.util.Log.d("MediaPipePose", "   📦 Modello: pose_landmarker_full.task")

            // Opzioni bilanciate per detection affidabile
            val options = PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.IMAGE) // IMAGE mode per snapshot
                .setNumPoses(1) // Rileva max 1 persona
                .setMinPoseDetectionConfidence(0.5f) // Soglia ragionevole
                .setMinPosePresenceConfidence(0.5f) // Soglia ragionevole
                .setMinTrackingConfidence(0.5f) // Soglia ragionevole
                .build()

            android.util.Log.d("MediaPipePose", "   ⚙️ RunningMode: IMAGE")
            android.util.Log.d("MediaPipePose", "   ⚙️ NumPoses: 1")
            android.util.Log.d("MediaPipePose", "   ⚙️ MinConfidence: 0.5")

            // Crea il landmarker
            poseLandmarker = PoseLandmarker.createFromOptions(reactContext, options)
            isInitialized = true

            // Condividi il landmarker e context con il Frame Processor Plugin
            sharedLandmarker = poseLandmarker
            isLandmarkerReady = true
            appReactContext = reactContext

            android.util.Log.d("MediaPipePose", "✅ MediaPipe inizializzato con successo!")
            android.util.Log.d("MediaPipePose", "✅ Landmarker condiviso con Frame Processor Plugin")
            promise.resolve(true)

        } catch (e: Exception) {
            android.util.Log.e("MediaPipePose", "❌ ERRORE inizializzazione: ${e.message}")
            e.printStackTrace()
            promise.reject("INIT_ERROR", "Failed to initialize MediaPipe: ${e.message}", e)
        }
    }

    /**
     * Rileva pose da file immagine
     */
    @ReactMethod
    fun detectPoseFromFile(filePath: String, timestampMs: Double, promise: Promise) {
        try {
            if (!isInitialized || poseLandmarker == null) {
                android.util.Log.e("MediaPipePose", "❌ Non inizializzato! Chiama initialize() prima.")
                promise.reject("NOT_INITIALIZED", "MediaPipe not initialized. Call initialize() first.")
                return
            }

            // Pulisci path
            val cleanPath = filePath.replace("file://", "")
            android.util.Log.d("MediaPipePose", "📸 Caricamento immagine: $cleanPath")

            // Carica bitmap
            var bitmap = BitmapFactory.decodeFile(cleanPath)
            if (bitmap == null) {
                android.util.Log.e("MediaPipePose", "❌ Impossibile caricare bitmap da: $cleanPath")
                promise.reject("DECODE_ERROR", "Failed to load image from: $cleanPath")
                return
            }

            android.util.Log.d("MediaPipePose", "   🖼️ Bitmap caricato: ${bitmap.width}x${bitmap.height}")

            // Ruota se landscape (camera frontale portrait genera landscape)
            if (bitmap.width > bitmap.height) {
                android.util.Log.d("MediaPipePose", "   🔄 Rotazione 90° (landscape → portrait)")
                val matrix = Matrix()
                matrix.postRotate(90f)
                val rotatedBitmap = Bitmap.createBitmap(
                    bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true
                )
                bitmap.recycle()
                bitmap = rotatedBitmap
                android.util.Log.d("MediaPipePose", "   ✓ Dopo rotazione: ${bitmap.width}x${bitmap.height}")
            }

            // Salva dimensioni originali
            val originalWidth = bitmap.width
            val originalHeight = bitmap.height

            // Ridimensiona per performance (MediaPipe funziona bene con 480p)
            val maxDimension = 480
            var processedBitmap = bitmap

            if (bitmap.width > maxDimension || bitmap.height > maxDimension) {
                val scale = minOf(
                    maxDimension.toFloat() / bitmap.width,
                    maxDimension.toFloat() / bitmap.height
                )

                val newWidth = (bitmap.width * scale).toInt()
                val newHeight = (bitmap.height * scale).toInt()

                android.util.Log.d("MediaPipePose", "   📏 Ridimensionamento: ${bitmap.width}x${bitmap.height} → ${newWidth}x${newHeight}")

                processedBitmap = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
                if (processedBitmap != bitmap) {
                    bitmap.recycle()
                }
            }

            android.util.Log.d("MediaPipePose", "   🎯 Immagine finale per detection: ${processedBitmap.width}x${processedBitmap.height}")

            // Converti in MPImage
            val mpImage = BitmapImageBuilder(processedBitmap).build()

            android.util.Log.d("MediaPipePose", "   🔍 Esecuzione detection...")

            // Esegui detection (IMAGE mode usa detect, non detectForVideo)
            val result = poseLandmarker!!.detect(mpImage)

            // Log risultato
            if (result.landmarks().isEmpty()) {
                android.util.Log.w("MediaPipePose", "   ⚠️ Nessuna persona rilevata!")
            } else {
                android.util.Log.d("MediaPipePose", "   ✅ Persona rilevata! ${result.landmarks().size} pose, ${result.landmarks()[0].size} landmarks")

                // Log primi 5 landmarks per debug
                val nose = result.landmarks()[0][0]
                val leftEye = result.landmarks()[0][2]
                val rightEye = result.landmarks()[0][5]
                val leftShoulder = result.landmarks()[0][11]
                val rightShoulder = result.landmarks()[0][12]

                android.util.Log.d("MediaPipePose", "   👃 Naso [0]: x=${nose.x()}, y=${nose.y()}, z=${nose.z()}, vis=${nose.visibility().orElse(0f)}")
                android.util.Log.d("MediaPipePose", "   👁️ LeftEye [2]: x=${leftEye.x()}, y=${leftEye.y()}, vis=${leftEye.visibility().orElse(0f)}")
                android.util.Log.d("MediaPipePose", "   👁️ RightEye [5]: x=${rightEye.x()}, y=${rightEye.y()}, vis=${rightEye.visibility().orElse(0f)}")
                android.util.Log.d("MediaPipePose", "   💪 LeftShoulder [11]: x=${leftShoulder.x()}, y=${leftShoulder.y()}, vis=${leftShoulder.visibility().orElse(0f)}")
                android.util.Log.d("MediaPipePose", "   💪 RightShoulder [12]: x=${rightShoulder.x()}, y=${rightShoulder.y()}, vis=${rightShoulder.visibility().orElse(0f)}")
                android.util.Log.d("MediaPipePose", "   📐 Bitmap processato: ${processedBitmap.width}x${processedBitmap.height}")
                android.util.Log.d("MediaPipePose", "   📐 Dimensioni originali: ${originalWidth}x${originalHeight}")
            }

            // Converti risultato
            val response = convertPoseLandmarkerResult(
                result,
                originalWidth,
                originalHeight,
                processedBitmap.width,
                processedBitmap.height
            )

            promise.resolve(response)
            processedBitmap.recycle()

        } catch (e: Exception) {
            android.util.Log.e("MediaPipePose", "❌ ERRORE detection: ${e.message}")
            e.printStackTrace()
            promise.reject("DETECTION_ERROR", "Pose detection failed: ${e.message}", e)
        }
    }

    /**
     * Converte PoseLandmarkerResult nel formato React Native
     */
    private fun convertPoseLandmarkerResult(
        result: PoseLandmarkerResult,
        originalWidth: Int,
        originalHeight: Int,
        processedWidth: Int,
        processedHeight: Int
    ): WritableNativeMap {
        val response = WritableNativeMap()
        val landmarksArray = WritableNativeArray()

        if (result.landmarks().isEmpty()) {
            // Nessuna persona rilevata - restituisci array vuoto
            response.putArray("landmarks", landmarksArray)
            response.putInt("imageWidth", originalWidth)
            response.putInt("imageHeight", originalHeight)
            android.util.Log.d("MediaPipePose", "   📊 Risposta: 0 landmarks (nessuna persona)")
            return response
        }

        // Prendi prima persona (abbiamo setNumPoses(1))
        val poseLandmarks = result.landmarks()[0]

        // MediaPipe ha 33 landmarks, le coordinate sono già normalizzate 0-1
        for (landmark in poseLandmarks) {
            val landmarkMap = WritableNativeMap()

            // Coordinate già normalizzate da MediaPipe
            landmarkMap.putDouble("x", landmark.x().toDouble())
            landmarkMap.putDouble("y", landmark.y().toDouble())
            landmarkMap.putDouble("z", landmark.z().toDouble())

            // Usa visibility come confidence (MediaPipe chiama visibility quello che ML Kit chiama inFrameLikelihood)
            val confidence = landmark.visibility().orElse(0.5f).toDouble()
            landmarkMap.putDouble("inFrameLikelihood", confidence)

            landmarksArray.pushMap(landmarkMap)
        }

        response.putArray("landmarks", landmarksArray)
        // ⚠️ IMPORTANTE: Restituiamo le dimensioni ORIGINALI, non quelle processate
        // Le coordinate di MediaPipe sono normalizzate e valide per qualsiasi dimensione
        response.putInt("imageWidth", originalWidth)
        response.putInt("imageHeight", originalHeight)

        android.util.Log.d("MediaPipePose", "   📊 Risposta: ${poseLandmarks.size} landmarks (dimensioni originali: ${originalWidth}x${originalHeight})")

        return response
    }

    // ============================================
    // FIRE & POLL PATTERN - Metodo per polling JS
    // ============================================

    /**
     * Restituisce l'ultimo risultato elaborato dal Frame Processor.
     * Chiamato in polling dal JS thread ogni ~33ms.
     */
    @ReactMethod
    fun getLastResult(promise: Promise) {
        try {
            val result = latestResult
            if (result != null) {
                // Clona il risultato per evitare race condition
                val clonedResult = Arguments.createMap()
                clonedResult.merge(result)
                clonedResult.putDouble("timestamp", lastResultTimestamp.toDouble())
                promise.resolve(clonedResult)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            android.util.Log.e("MediaPipePose", "❌ Errore getLastResult: ${e.message}")
            promise.resolve(null)
        }
    }

    /**
     * Verifica se il Frame Processor è pronto
     */
    @ReactMethod
    fun isFrameProcessorReady(promise: Promise) {
        promise.resolve(isLandmarkerReady && sharedLandmarker != null)
    }

    /**
     * Cleanup
     */
    override fun invalidate() {
        super.invalidate()
        poseLandmarker?.close()
        poseLandmarker = null
        isInitialized = false

        // Pulisci anche lo stato condiviso
        sharedLandmarker = null
        isLandmarkerReady = false
        latestResult = null
        appReactContext = null

        android.util.Log.d("MediaPipePose", "🛑 MediaPipe chiuso")
    }
}