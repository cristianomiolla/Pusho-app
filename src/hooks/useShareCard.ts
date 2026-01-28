import { useState, useRef, useCallback } from 'react';
import { View, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface UseShareCardReturn {
  imageUri: string | null;
  isLoading: boolean;
  captureCardRef: React.RefObject<View>;
  pickImageFromCamera: () => Promise<void>;
  pickImageFromGallery: () => Promise<void>;
  captureAndShare: () => Promise<void>;
  resetImage: () => void;
}

export const useShareCard = (): UseShareCardReturn => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const captureCardRef = useRef<View>(null);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permesso negato',
        'Abbiamo bisogno del permesso per accedere alla fotocamera.'
      );
      return false;
    }
    return true;
  }, []);

  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permesso negato',
        'Abbiamo bisogno del permesso per accedere alla galleria.'
      );
      return false;
    }
    return true;
  }, []);

  const pickImageFromCamera = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: Platform.OS === 'android',
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Errore', 'Impossibile scattare la foto.');
    } finally {
      setIsLoading(false);
    }
  }, [requestCameraPermission]);

  const pickImageFromGallery = useCallback(async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'android',
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Errore', 'Impossibile selezionare la foto.');
    } finally {
      setIsLoading(false);
    }
  }, [requestGalleryPermission]);

  const captureAndShare = useCallback(async () => {
    if (!captureCardRef.current) {
      Alert.alert('Errore', 'Impossibile catturare la card.');
      return;
    }

    setIsLoading(true);

    try {
      // Cattura la view nascosta ad alta risoluzione (1080x1920)
      const uri = await captureRef(captureCardRef, {
        format: 'png',
        quality: 1,
      });

      // Verifica se la condivisione è disponibile
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Errore', 'La condivisione non è disponibile su questo dispositivo.');
        return;
      }

      // Apri la share sheet nativa
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Condividi il tuo risultato',
      });
    } catch (error) {
      console.error('Error capturing and sharing:', error);
      Alert.alert('Errore', 'Impossibile condividere la card.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetImage = useCallback(() => {
    setImageUri(null);
  }, []);

  return {
    imageUri,
    isLoading,
    captureCardRef,
    pickImageFromCamera,
    pickImageFromGallery,
    captureAndShare,
    resetImage,
  };
};

export default useShareCard;
