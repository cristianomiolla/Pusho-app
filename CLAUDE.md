# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pusho is a React Native (Expo) mobile app for counting push-ups using real-time pose detection with MediaPipe. The app uses the device's front camera to detect body posture and automatically count push-up repetitions with anti-cheat validation.

## Development Commands

```bash
# Start development server (Expo)
npm start

# Run on specific platforms
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run web        # expo start --web

# Build with EAS
eas build --profile development  # Development build with dev client
eas build --profile preview      # Internal distribution APK
eas build --profile production   # Production build
```

**Note:** This app uses native modules (MediaPipe) and requires a development build (`expo-dev-client`), not Expo Go.

## Architecture

### Core Technology Stack
- **Framework:** React Native 0.81 + Expo SDK 54 (New Architecture enabled)
- **Navigation:** React Navigation v7 (bottom tabs + native stack)
- **Backend:** Supabase (auth, database)
- **Pose Detection:** MediaPipe Pose Landmarker via native module
- **Camera:** react-native-vision-camera with frame processors
- **Animations:** react-native-reanimated
- **i18n:** i18next (Italian/English, auto-detected)

### Native Modules

Custom Android native module in `native-modules/android/mediapipe/`:
- `MediaPipePoseModule.kt` - React Native bridge for MediaPipe
- `DetectPosePlugin.kt` - VisionCamera frame processor plugin
- `pose_landmarker_full.task` - MediaPipe model file

The module uses a "Fire & Poll" pattern: the frame processor sends frames to native code asynchronously, and JS polls for results at ~30Hz.

### Key Data Flow

1. **Pose Detection Pipeline:**
   - `usePoseDetection` hook initializes MediaPipe and sets up frame processor
   - VisionCamera frame processor calls native `detectPose` plugin
   - JS polls `MediaPipePose.getLastResult()` for pose data
   - `usePoseSmoothing` filters noise from raw pose data
   - `usePushupCounter` analyzes elbow angles to count reps

2. **Push-up Counting Logic (`usePushupCounter.ts`):**
   - Validates frontal pose and horizontal body position (anti-cheat)
   - Requires hips visible to confirm push-up position
   - Tracks elbow angle transitions: UP (>150°) → DOWN (<135°) → UP
   - Calculates quality score based on depth (70%) and tempo (30%)

3. **Workout Flow:**
   - Free mode: Count indefinitely, save when done
   - Guided mode: Follow workout cards with sets/reps/rest timers
   - Sessions saved to Supabase with stats

### Source Structure

```
src/
├── components/         # UI components (workout cards, overlays, modals)
├── contexts/           # React contexts (AuthContext, WorkoutContext)
├── hooks/              # Custom hooks (pose detection, push-up counting)
├── modules/            # Native module TypeScript interfaces
├── navigation/         # React Navigation setup
├── screens/            # Main app screens
├── services/           # Supabase API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (geometry, coordinate transforms)
└── i18n/               # Translations (it.json, en.json)
```

### Database Schema (Supabase)

- `profiles` - User profiles linked to auth.users
- `user_stats` - Aggregated user statistics
- `workout_cards` - Custom and preset workout templates
- `workout_sessions` - Completed workout records

Migrations in `supabase/migrations/`. Row Level Security enabled on all tables.

### Important Configuration

- **Babel:** `react-native-worklets-core/plugin` must come BEFORE `react-native-reanimated/plugin`
- **Environment:** Requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- **Deep linking:** Uses `pusho://` scheme for auth callbacks
- **Custom fonts:** Agdasima-Regular, Agdasima-Bold loaded from `assets/fonts/`

### UI Conventions

- Primary accent color: `#BDEEE7` (mint/cyan)
- Dark theme: Background `#1a1a1a`, cards `rgba(0,0,0,0.3)`
- Font family for headings: `Agdasima-Bold`
