package {{PACKAGE_NAME}}.mediapipe

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.media.Image
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Frame Processor Plugin per pose detection in tempo reale.
 *
 * Pattern: Fire & Poll + Async Processing
 * - Riceve frame dalla camera via Vision Camera
 * - Copia il bitmap e processa su thread separato (non blocca la camera)
 * - Salva il risultato in MediaPipePoseModule.latestResult
 * - Il JS thread fa polling con getLastResult()
 */
class DetectPosePlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

    companion object {
        private const val TAG = "DetectPosePlugin"
        private const val MIN_INTERVAL_MS = 66L // Max 15 FPS per ridurre carico
        private const val MAX_DIMENSION = 360 // Ridotto per velocità
        private const val LOG_EVERY_N_FRAMES = 60
        private var instanceCount = 0
    }

    // Thread pool dedicato per il processing MediaPipe
    private val executor = Executors.newSingleThreadExecutor()

    // Flag atomico per evitare accumulo di task
    private val isProcessingAsync = AtomicBoolean(false)

    private var lastProcessTime = 0L
    private var frameCount = 0L
    private var successCount = 0L
    private var failCount = 0L

    init {
        instanceCount++
        if (instanceCount == 1) {
            android.util.Log.d(TAG, "✅ DetectPosePlugin inizializzato (async mode)")
        }
    }

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        frameCount++

        // 1. Throttling
        val now = System.currentTimeMillis()
        if (now - lastProcessTime < MIN_INTERVAL_MS) {
            return null
        }

        // 2. Skip se già in elaborazione asincrona
        if (isProcessingAsync.get()) {
            return null
        }

        // 3. Verifica MediaPipe pronto
        val landmarker = MediaPipePoseModule.sharedLandmarker
        if (landmarker == null || !MediaPipePoseModule.isLandmarkerReady) {
            return null
        }

        lastProcessTime = now

        // 4. Converti frame in Bitmap (operazione veloce ~10-20ms)
        val bitmap = convertFrameToBitmap(frame)
        if (bitmap == null) {
            failCount++
            return null
        }

        // 5. Crea una COPIA del bitmap per processare in background
        // Il frame originale verrà rilasciato dopo il return
        val bitmapCopy = bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false)
        bitmap.recycle()

        if (bitmapCopy == null) {
            return null
        }

        successCount++

        // 6. Processa in background (NON blocca il frame processor)
        isProcessingAsync.set(true)

        executor.execute {
            try {
                processFrameAsync(bitmapCopy, landmarker, now)
            } finally {
                isProcessingAsync.set(false)
            }
        }

        // Ritorna SUBITO - il frame processor non è bloccato
        return null
    }

    /**
     * Processa il frame su thread separato.
     * Non blocca la camera.
     */
    private fun processFrameAsync(bitmap: Bitmap, landmarker: com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker, timestamp: Long) {
        try {
            // Gestisci orientamento
            var processedBitmap = bitmap
            val originalWidth: Int
            val originalHeight: Int

            if (bitmap.width > bitmap.height) {
                // Frame landscape: ruota 90° e flippa entrambi gli assi
                val matrix = Matrix()
                matrix.postRotate(90f)
                matrix.postScale(-1f, -1f) // Flip orizzontale + verticale
                processedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                if (processedBitmap != bitmap) {
                    bitmap.recycle()
                }
            } else {
                // Frame già portrait: flippa entrambi gli assi
                val matrix = Matrix()
                matrix.postScale(-1f, -1f) // Flip orizzontale + verticale
                processedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                if (processedBitmap != bitmap) {
                    bitmap.recycle()
                }
            }
            originalWidth = processedBitmap.width
            originalHeight = processedBitmap.height

            // Resize per performance
            if (processedBitmap.width > MAX_DIMENSION || processedBitmap.height > MAX_DIMENSION) {
                val scale = minOf(
                    MAX_DIMENSION.toFloat() / processedBitmap.width,
                    MAX_DIMENSION.toFloat() / processedBitmap.height
                )
                val newWidth = (processedBitmap.width * scale).toInt()
                val newHeight = (processedBitmap.height * scale).toInt()
                val resizedBitmap = Bitmap.createScaledBitmap(processedBitmap, newWidth, newHeight, true)
                if (resizedBitmap != processedBitmap) {
                    processedBitmap.recycle()
                }
                processedBitmap = resizedBitmap
            }

            // Esegui MediaPipe
            val startTime = System.currentTimeMillis()
            val mpImage = BitmapImageBuilder(processedBitmap).build()
            val result = landmarker.detect(mpImage)
            val processingTime = System.currentTimeMillis() - startTime

            // Salva risultato
            val resultMap = convertResult(result, originalWidth, originalHeight, processingTime)
            MediaPipePoseModule.latestResult = resultMap
            MediaPipePoseModule.lastResultTimestamp = timestamp

            if (frameCount % LOG_EVERY_N_FRAMES == 0L) {
                val landmarkCount = if (result.landmarks().isNotEmpty()) result.landmarks()[0].size else 0
                android.util.Log.d(TAG, "✅ Frame #$frameCount: $landmarkCount landmarks (${processingTime}ms) [async]")
            }

            processedBitmap.recycle()

        } catch (e: Exception) {
            android.util.Log.e(TAG, "❌ Errore async: ${e.message}")
        }
    }

    /**
     * Converte Frame in Bitmap usando l'ImageProxy interno.
     * Supporta YUV_420_888 (il formato più comune per le camera Android).
     */
    private fun convertFrameToBitmap(frame: Frame): Bitmap? {
        try {
            val frameClass = frame.javaClass

            // Prova 1: getImageProxy (metodo principale)
            try {
                val getImageProxyMethod = frameClass.getMethod("getImageProxy")
                val imageProxy = getImageProxyMethod.invoke(frame)

                if (imageProxy != null) {
                    val imageProxyClass = imageProxy.javaClass
                    val getImageMethod = imageProxyClass.getMethod("getImage")
                    val image = getImageMethod.invoke(imageProxy) as? Image

                    if (image != null) {
                        return imageToRgbBitmap(image)
                    }
                }
            } catch (e: Exception) {
                // Fallback al metodo successivo
            }

            // Prova 2: toArrayBuffer (fallback)
            try {
                val toArrayBufferMethod = frameClass.getMethod("toArrayBuffer")
                val buffer = toArrayBufferMethod.invoke(frame) as? ByteBuffer

                if (buffer != null) {
                    val bitmap = Bitmap.createBitmap(frame.width, frame.height, Bitmap.Config.ARGB_8888)
                    buffer.rewind()
                    bitmap.copyPixelsFromBuffer(buffer)
                    return bitmap
                }
            } catch (e: Exception) {
                // Nessun metodo disponibile
            }

            if (frameCount % LOG_EVERY_N_FRAMES == 0L) {
                android.util.Log.e(TAG, "❌ Conversione frame fallita")
            }
            return null

        } catch (e: Exception) {
            android.util.Log.e(TAG, "❌ Errore critico: ${e.message}")
            return null
        }
    }

    /**
     * Converte un android.media.Image (formato YUV_420_888) in Bitmap RGB.
     */
    private fun imageToRgbBitmap(image: Image): Bitmap? {
        try {
            val width = image.width
            val height = image.height
            val format = image.format

            if (frameCount % LOG_EVERY_N_FRAMES == 0L) {
                android.util.Log.d(TAG, "📷 Image: ${width}x${height}, format=$format (YUV_420_888=${ImageFormat.YUV_420_888})")
            }

            // Gestisci YUV_420_888
            if (format == ImageFormat.YUV_420_888) {
                return yuvImageToBitmap(image)
            }

            // Fallback per altri formati: prova NV21
            val planes = image.planes
            if (planes.size >= 3) {
                return yuvPlanesToBitmap(planes, width, height)
            }

            android.util.Log.w(TAG, "⚠️ Formato immagine non supportato: $format")
            return null

        } catch (e: Exception) {
            android.util.Log.e(TAG, "❌ Errore conversione Image: ${e.message}")
            return null
        }
    }

    /**
     * Converte YUV_420_888 Image in Bitmap usando YuvImage di Android.
     */
    private fun yuvImageToBitmap(image: Image): Bitmap? {
        try {
            val width = image.width
            val height = image.height
            val planes = image.planes

            // Ottieni i buffer Y, U, V
            val yBuffer = planes[0].buffer
            val uBuffer = planes[1].buffer
            val vBuffer = planes[2].buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            // Crea array NV21 (Y + VU interleaved)
            val nv21 = ByteArray(ySize + uSize + vSize)

            // Copia Y
            yBuffer.get(nv21, 0, ySize)

            // Per NV21, V viene prima di U
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)

            // Usa YuvImage per convertire in JPEG, poi in Bitmap
            val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
            val out = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, width, height), 90, out)
            val jpegBytes = out.toByteArray()

            return android.graphics.BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)

        } catch (e: Exception) {
            android.util.Log.e(TAG, "❌ Errore yuvImageToBitmap: ${e.message}")
            return null
        }
    }

    /**
     * Fallback: converte planes YUV direttamente.
     */
    private fun yuvPlanesToBitmap(planes: Array<Image.Plane>, width: Int, height: Int): Bitmap? {
        try {
            val yBuffer = planes[0].buffer
            val uBuffer = planes[1].buffer
            val vBuffer = planes[2].buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            val nv21 = ByteArray(ySize + uSize + vSize)
            yBuffer.get(nv21, 0, ySize)
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)

            val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
            val out = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, width, height), 90, out)
            val jpegBytes = out.toByteArray()

            return android.graphics.BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)

        } catch (e: Exception) {
            android.util.Log.e(TAG, "❌ Errore yuvPlanesToBitmap: ${e.message}")
            return null
        }
    }

    /**
     * Converte risultato MediaPipe in WritableMap.
     */
    private fun convertResult(
        result: com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult,
        originalWidth: Int,
        originalHeight: Int,
        processingTime: Long
    ): WritableMap {
        val response = Arguments.createMap()
        val landmarksArray = WritableNativeArray()

        if (result.landmarks().isEmpty()) {
            response.putArray("landmarks", landmarksArray)
            response.putInt("imageWidth", originalWidth)
            response.putInt("imageHeight", originalHeight)
            response.putDouble("processingTime", processingTime.toDouble())
            return response
        }

        val poseLandmarks = result.landmarks()[0]
        for (landmark in poseLandmarks) {
            val landmarkMap = WritableNativeMap()
            landmarkMap.putDouble("x", landmark.x().toDouble())
            landmarkMap.putDouble("y", landmark.y().toDouble())
            landmarkMap.putDouble("z", landmark.z().toDouble())
            landmarkMap.putDouble("inFrameLikelihood", landmark.visibility().orElse(0.0f).toDouble())
            landmarksArray.pushMap(landmarkMap)
        }

        response.putArray("landmarks", landmarksArray)
        response.putInt("imageWidth", originalWidth)
        response.putInt("imageHeight", originalHeight)
        response.putDouble("processingTime", processingTime.toDouble())

        return response
    }
}
