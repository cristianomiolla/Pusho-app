import { useEffect, useState } from 'react';
import { Camera } from 'react-native-vision-camera';

export const useCameraPermission = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const status = await Camera.getCameraPermissionStatus();

    if (status === 'granted') {
      setHasPermission(true);
      setIsLoading(false);
      return;
    }

    if (status === 'not-determined') {
      const newStatus = await Camera.requestCameraPermission();
      setHasPermission(newStatus === 'granted');
    }

    setIsLoading(false);
  };

  const requestPermission = async () => {
    setIsLoading(true);
    const newStatus = await Camera.requestCameraPermission();
    setHasPermission(newStatus === 'granted');
    setIsLoading(false);
    return newStatus === 'granted';
  };

  return { hasPermission, isLoading, requestPermission };
};
