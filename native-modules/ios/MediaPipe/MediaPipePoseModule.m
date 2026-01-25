#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MediaPipePose, NSObject)

/// Inizializza MediaPipe Pose Landmarker
RCT_EXTERN_METHOD(initialize:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

/// Rileva pose da file immagine
RCT_EXTERN_METHOD(detectPoseFromFile:(NSString *)filePath
                  timestampMs:(double)timestampMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// ============================================
// FIRE & POLL PATTERN - Metodi per Frame Processor
// ============================================

/// Restituisce l'ultimo risultato elaborato dal Frame Processor
RCT_EXTERN_METHOD(getLastResult:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

/// Verifica se il Frame Processor è pronto
RCT_EXTERN_METHOD(isFrameProcessorReady:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
