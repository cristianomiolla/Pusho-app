import { useRef, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

// Suono di completamento locale
const COMPLETION_SOUND = require('../../assets/sounds/completion.mp3');

/**
 * Hook per riprodurre un suono di completamento quando l'utente raggiunge l'obiettivo
 */
export const useCompletionSound = () => {
  const soundRef = useRef<Audio.Sound | null>(null);

  // Inizializza la modalità audio e precarica il suono
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Precarica il suono per riproduzione istantanea
        const { sound } = await Audio.Sound.createAsync(COMPLETION_SOUND);
        soundRef.current = sound;
      } catch (error) {
        console.warn('Failed to setup audio:', error);
      }
    };

    setupAudio();

    // Cleanup al unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  /**
   * Riproduce il suono di completamento serie
   */
  const playCompletionSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        // Riporta il suono all'inizio e riproducilo
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      } else {
        // Fallback: crea e riproduci immediatamente se non precaricato
        const { sound } = await Audio.Sound.createAsync(
          COMPLETION_SOUND,
          { shouldPlay: true, volume: 0.8 }
        );

        // Cleanup dopo riproduzione
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (error) {
      console.warn('Failed to play completion sound:', error);
    }
  }, []);

  return { playCompletionSound };
};
