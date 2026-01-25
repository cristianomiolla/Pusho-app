#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

// Import del header generato da Swift
#import "Pusho-Swift.h"

// Registra il plugin Swift con il nome "detectPose"
// Questo nome deve corrispondere a quello usato in JS:
// VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})
VISION_EXPORT_SWIFT_FRAME_PROCESSOR(DetectPosePlugin, detectPose)
