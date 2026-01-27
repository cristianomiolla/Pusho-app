import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused, useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { usePushupCounter } from '../hooks/usePushupCounter';
import { useCompletionSound } from '../hooks/useCompletionSound';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { WorkoutCardsModal } from '../components/WorkoutCardsModal';
import { WorkoutConfirmModal } from '../components/WorkoutConfirmModal';
import { FreeWorkoutConfirmModal } from '../components/FreeWorkoutConfirmModal';
import { SlideToStop } from '../components/SlideToStop';
import { RestScreen } from '../components/RestScreen';
import { WorkoutCompletedScreen } from '../components/WorkoutCompletedScreen';
import { useWorkout } from '../contexts/WorkoutContext';
import { useAuth } from '../contexts/AuthContext';
import * as cardsService from '../services/cards.service';
import * as workoutService from '../services/workout.service';
import type { Pose } from '../types/pose';
import type { WorkoutCard, GuidedWorkoutSession } from '../types/workout';
import { colors } from '../theme';

export const PushupDetectionScreen = () => {
  const { t } = useTranslation();
  const { hasPermission, isLoading, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const { setIsGuidedWorkoutActive, setIsFreeWorkoutActive, triggerHomeRefresh, triggerCommunityRefresh } = useWorkout();
  const { user } = useAuth();

  // Mantieni lo schermo acceso durante l'allenamento
  useKeepAwake();

  // Stato base
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<WorkoutCard | null>(null);

  // Stato timer modalità libera
  const [freeWorkoutStartTime, setFreeWorkoutStartTime] = useState<number | null>(null);
  const [freeWorkoutTime, setFreeWorkoutTime] = useState(0);
  const [showFreeWorkoutCompleted, setShowFreeWorkoutCompleted] = useState(false);
  const [freeWorkoutStats, setFreeWorkoutStats] = useState({
    pushups: 0,
    time: 0,
    qualityScore: 0,
    averageDepth: 0,
    averageDownTime: 0,
  });

  // Stato allenamento guidato
  const [guidedSession, setGuidedSession] = useState<GuidedWorkoutSession | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stato per nuovo flusso selezione
  const [isFreeWorkoutMode, setIsFreeWorkoutMode] = useState(false);
  const [showFreeConfirmModal, setShowFreeConfirmModal] = useState(false);
  const [hasUserSelectedMode, setHasUserSelectedMode] = useState(false);

  // Schede da Supabase
  const [workoutCards, setWorkoutCards] = useState<WorkoutCard[]>([]);

  // Carica schede da Supabase
  const loadWorkoutCards = useCallback(async () => {
    if (!user) return;
    try {
      const cards = await cardsService.fetchWorkoutCards(user.id);
      setWorkoutCards(cards);
    } catch (error) {
      console.error('Error loading workout cards:', error);
    }
  }, [user]);

  // Carica schede quando si apre il modal
  useEffect(() => {
    if (showCardsModal) {
      loadWorkoutCards();
    }
  }, [showCardsModal, loadWorkoutCards]);

  const handleToggleFavorite = async (cardId: string) => {
    const card = workoutCards.find(c => c.id === cardId);
    if (!card) return;

    try {
      await cardsService.toggleCardFavorite(cardId, !card.isFavorite);
      setWorkoutCards(cards =>
        cards.map(c =>
          c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Ref per tracciare se c'è un allenamento in corso (senza causare re-render)
  const isWorkoutInProgressRef = useRef(false);
  isWorkoutInProgressRef.current = guidedSession !== null || isFreeWorkoutMode;

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');

      return () => {
        // Cleanup quando si esce dalla schermata: resetta tutto
        // (solo se non c'è un allenamento in corso)
        if (!isWorkoutInProgressRef.current) {
          setHasUserSelectedMode(false);
          setIsFreeWorkoutMode(false);
          setIsFreeWorkoutActive(false);
          // Non resettare showCardsModal qui - verrà gestito dall'effetto auto-show
          setShowFreeConfirmModal(false);
          setFreeWorkoutStartTime(null);
          setFreeWorkoutTime(0);
        }
      };
    }, [])
  );


  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 }
  ]);

  const isPoseDetectionActive = isFocused && !showCardsModal && !showConfirmModal;

  const {
    cameraRef,
    pose,
    isModelLoaded,
    imageDimensions,
    frameProcessor,
  } = usePoseDetection(isPoseDetectionActive);

  const { count, isReady, reset, averageDepth, averageDownTime, qualityScore } = usePushupCounter(pose);
  const { playCompletionSound } = useCompletionSound();

  // ====== AUTO-SHOW MODAL DI SELEZIONE ======

  // Mostra modal automaticamente quando camera e model sono pronti e schermata è focused
  useEffect(() => {
    if (isFocused && hasPermission && isModelLoaded && !hasUserSelectedMode && !guidedSession && !isFreeWorkoutMode) {
      setShowCardsModal(true);
    }
  }, [isFocused, hasPermission, isModelLoaded, hasUserSelectedMode, guidedSession, isFreeWorkoutMode]);

  // ====== GESTIONE ALLENAMENTO LIBERO ======

  const handleSelectFreeWorkout = () => {
    setShowCardsModal(false);
    setShowFreeConfirmModal(true);
  };

  const handleConfirmFreeWorkout = () => {
    setShowFreeConfirmModal(false);
    setIsFreeWorkoutMode(true);
    setHasUserSelectedMode(true);
    setIsFreeWorkoutActive(true); // Nasconde navbar
  };

  const handleCancelFreeWorkout = () => {
    setShowFreeConfirmModal(false);
    setShowCardsModal(true); // Torna alla selezione
  };

  const handleStopFreeWorkout = () => {
    // Mostra popup completamento con i risultati attuali
    setFreeWorkoutStats({
      pushups: count,
      time: freeWorkoutTime,
      qualityScore,
      averageDepth,
      averageDownTime,
    });
    setShowFreeWorkoutCompleted(true);
  };

  // ====== GESTIONE ALLENAMENTO GUIDATO ======

  // STEP 1: Quando utente seleziona scheda, apri modal conferma
  const handleSelectCard = (card: WorkoutCard) => {
    setSelectedCard(card);
    setShowCardsModal(false);
    setShowConfirmModal(true);
  };

  // STEP 1: Conferma avvio allenamento
  const handleConfirmStart = () => {
    if (!selectedCard) return;

    const newSession: GuidedWorkoutSession = {
      card: selectedCard,
      currentSet: 1,
      currentSetPushups: 0,
      totalPushups: 0,
      startTime: Date.now(),
      restTimeRemaining: selectedCard.restTime,
      state: 'active',
    };

    setGuidedSession(newSession);
    setShowConfirmModal(false);
    setHasUserSelectedMode(true); // Impedisce auto-show modal
    reset(); // Reset counter all'avvio
  };

  const handleCancelStart = () => {
    setShowConfirmModal(false);
    setSelectedCard(null);
    setShowCardsModal(true); // Torna alla selezione
  };

  // Effetto: sincronizza stato workout context con sessione guidata
  useEffect(() => {
    setIsGuidedWorkoutActive(guidedSession !== null);
  }, [guidedSession, setIsGuidedWorkoutActive]);

  // Effetto: sincronizza counter con sessione guidata
  useEffect(() => {
    if (!guidedSession || guidedSession.state !== 'active') return;

    // Aggiorna push-up della serie corrente
    setGuidedSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentSetPushups: count,
      };
    });

    // STEP 4: Verifica completamento serie
    if (count >= guidedSession.card.repsPerSet) {
      handleSetCompleted();
    }
  }, [count, guidedSession?.state]);

  // STEP 4: Completamento serie
  const handleSetCompleted = () => {
    if (!guidedSession) return;

    // Riproduci suono di completamento
    playCompletionSound();

    const updatedTotalPushups = guidedSession.totalPushups + guidedSession.card.repsPerSet;

    // Verifica se era l'ultima serie
    if (guidedSession.currentSet >= guidedSession.card.sets) {
      // STEP 8: Allenamento completato
      setGuidedSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalPushups: updatedTotalPushups,
          state: 'completed',
          endTime: Date.now(),
        };
      });
      return;
    }

    // STEP 5: Passa a pausa
    setGuidedSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        totalPushups: updatedTotalPushups,
        state: 'rest',
        restTimeRemaining: prev.card.restTime,
      };
    });

    // Avvia countdown pausa
    startRestTimer();
  };

  // STEP 5: Countdown pausa
  const startRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    restTimerRef.current = setInterval(() => {
      setGuidedSession(prev => {
        if (!prev || prev.state !== 'rest') {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          return prev;
        }

        const newTime = prev.restTimeRemaining - 1;

        if (newTime <= 0) {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          // Reset counter per nuova serie
          reset();
          // STEP 6: Fine pausa -> Riparti direttamente con la serie successiva
          return {
            ...prev,
            state: 'active',
            currentSet: prev.currentSet + 1,
            currentSetPushups: 0,
          };
        }

        return {
          ...prev,
          restTimeRemaining: newTime,
        };
      });
    }, 1000);
  };

  // STEP 5: Salta pausa
  const handleSkipRest = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    reset(); // Reset counter per nuova serie

    // STEP 6: Passa direttamente alla serie successiva
    setGuidedSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        state: 'active',
        currentSet: prev.currentSet + 1,
        currentSetPushups: 0,
      };
    });
  };

  // STEP 2: Stop allenamento
  const handleStopWorkout = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    // Torna allo stato iniziale
    setGuidedSession(null);
    setSelectedCard(null);
    setHasUserSelectedMode(false);
    reset();
    navigation.navigate('Allenamenti' as never); // Torna alla Home
  };

  // STEP 8: Salva e esci (allenamento guidato)
  const handleSaveWorkout = async () => {
    if (!user || !guidedSession) return;

    try {
      const sessionTime = guidedSession.endTime
        ? Math.floor((guidedSession.endTime - guidedSession.startTime) / 1000)
        : Math.floor((Date.now() - guidedSession.startTime) / 1000);

      // Crea una serie con i pushups totali (per il calcolo del max)
      const sets = [{
        pushups: guidedSession.totalPushups,
        quality: qualityScore,
        duration: sessionTime,
      }];

      await workoutService.createWorkoutSession({
        duration: sessionTime,
        totalPushups: guidedSession.totalPushups,
        averageQuality: qualityScore,
        sets,
        workoutCardId: guidedSession.card.id,
        workoutCardName: guidedSession.card.name,
        completedSets: guidedSession.currentSet,
        targetSets: guidedSession.card.sets,
      }, user.id);

      // Segnala alla Home e Community di ricaricare i dati
      triggerHomeRefresh();
      triggerCommunityRefresh();
    } catch (error) {
      console.error('Error saving workout:', error);
    }

    handleStopWorkout();
  };

  // Reset comune per uscire dall'allenamento libero
  const resetFreeWorkoutAndGoHome = () => {
    setShowFreeWorkoutCompleted(false);
    setFreeWorkoutStats({ pushups: 0, time: 0, qualityScore: 0, averageDepth: 0, averageDownTime: 0 });
    reset();
    setFreeWorkoutStartTime(null);
    setFreeWorkoutTime(0);
    setIsFreeWorkoutMode(false);
    setIsFreeWorkoutActive(false);
    setHasUserSelectedMode(false);
    navigation.navigate('Allenamenti' as never);
  };

  // Salva allenamento libero
  const handleSaveFreeWorkout = async () => {
    if (!user) return;

    try {
      const sets = [{
        pushups: freeWorkoutStats.pushups,
        quality: freeWorkoutStats.qualityScore,
        duration: freeWorkoutStats.time,
      }];

      await workoutService.createWorkoutSession({
        duration: freeWorkoutStats.time,
        totalPushups: freeWorkoutStats.pushups,
        averageQuality: freeWorkoutStats.qualityScore,
        sets,
      }, user.id);

      triggerHomeRefresh();
      triggerCommunityRefresh();
    } catch (error) {
      console.error('Error saving free workout:', error);
    }

    resetFreeWorkoutAndGoHome();
  };

  // Esci senza salvare allenamento libero
  const handleExitFreeWorkout = () => {
    resetFreeWorkoutAndGoHome();
  };

  // Effetto: avvia timer modalità libera al primo push-up
  useEffect(() => {
    if (!guidedSession && count > 0 && freeWorkoutStartTime === null) {
      setFreeWorkoutStartTime(Date.now());
    }
  }, [count, guidedSession, freeWorkoutStartTime]);

  // Effetto: aggiorna timer modalità libera ogni secondo
  useEffect(() => {
    if (!freeWorkoutStartTime || guidedSession) return;

    const interval = setInterval(() => {
      setFreeWorkoutTime(Math.floor((Date.now() - freeWorkoutStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [freeWorkoutStartTime, guidedSession]);

  // Reset timer quando si resetta il counter in modalità libera
  const handleFreeReset = () => {
    reset();
    setFreeWorkoutStartTime(null);
    setFreeWorkoutTime(0);
  };

  // Cleanup timer al unmount
  useEffect(() => {
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, []);

  // ====== RENDERING CONDIZIONALE ======

  // Calcola tempo sessione
  const getSessionTime = () => {
    if (!guidedSession) return 0;
    // Se l'allenamento è completato, usa endTime invece di Date.now()
    const endTime = guidedSession.endTime || Date.now();
    return Math.floor((endTime - guidedSession.startTime) / 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Valida pose
  const isPoseValid = (p: Pose | null): boolean => {
    if (!p) return false;

    const essentialKeypoints = [
      p.keypoints.leftShoulder,
      p.keypoints.rightShoulder,
      p.keypoints.leftElbow,
      p.keypoints.rightElbow,
      p.keypoints.leftWrist,
      p.keypoints.rightWrist,
    ];

    const allValid = essentialKeypoints.every(kp => kp.confidence >= 0.5);
    const avgConf = essentialKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / essentialKeypoints.length;

    return allValid && avgConf >= 0.6;
  };

  const shouldShowSkeleton = isPoseValid(pose);

  // ====== LOADING STATES ======

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('workout.loading')}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-outline" size={64} color={colors.primary} />
          <Text style={styles.permissionTitle}>
            {t('workout.cameraPermissionRequired')}
          </Text>
          <Text style={styles.permissionSubtitle}>
            {t('workout.cameraPermissionDescription')}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>
              {t('workout.grantCameraPermission')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('workout.cameraNotAvailable')}</Text>
      </View>
    );
  }

  if (!isModelLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('workout.initializingMediaPipe')}</Text>
      </View>
    );
  }

  // ====== MAIN RENDER ======

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        format={format}
        photo={true}
        video={true}
        outputOrientation="device"
        // Frame Processor per pose detection in tempo reale
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      {/* Skeleton Overlay */}
      {pose && shouldShowSkeleton && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkeletonOverlay
            pose={pose}
            imageWidth={imageDimensions?.width}
            imageHeight={imageDimensions?.height}
            isFrontCamera={true}
          />
        </View>
      )}

      {/* STEP 5: Schermata Pausa */}
      {guidedSession?.state === 'rest' && (
        <RestScreen
          timeRemaining={guidedSession.restTimeRemaining}
          currentSet={guidedSession.currentSet}
          totalSets={guidedSession.card.sets}
          onSkip={handleSkipRest}
        />
      )}

      {/* STEP 8: Schermata Completamento (allenamento guidato) */}
      {guidedSession?.state === 'completed' && (
        <WorkoutCompletedScreen
          totalPushups={guidedSession.totalPushups}
          totalSets={guidedSession.card.sets}
          totalTime={getSessionTime()}
          onSave={handleSaveWorkout}
          onExit={handleStopWorkout}
          qualityScore={qualityScore}
          averageDepth={averageDepth}
          averageDownTime={averageDownTime}
        />
      )}

      {/* Schermata Completamento (allenamento libero) */}
      {showFreeWorkoutCompleted && (
        <WorkoutCompletedScreen
          totalPushups={freeWorkoutStats.pushups}
          totalTime={freeWorkoutStats.time}
          onSave={handleSaveFreeWorkout}
          onExit={handleExitFreeWorkout}
          qualityScore={freeWorkoutStats.qualityScore}
          averageDepth={freeWorkoutStats.averageDepth}
          averageDownTime={freeWorkoutStats.averageDownTime}
        />
      )}

      {/* UI Normale (quando non in stati speciali e utente ha selezionato modalità) */}
      {hasUserSelectedMode &&
        guidedSession?.state !== 'rest' &&
        guidedSession?.state !== 'completed' &&
        !showFreeWorkoutCompleted && (
          <View style={[styles.overlay, isLandscape && styles.overlayLandscape]}>
            {/* Badge modalità in alto */}
            <View style={styles.modeBadgeCard}>
              {guidedSession ? (
                <>
                  <MaterialCommunityIcons name="file-document" size={18} color={colors.primary} />
                  <Text style={styles.modeBadgeText}>{guidedSession.card.name}</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="infinity" size={18} color={colors.primary} />
                  <Text style={styles.modeBadgeText}>{t('workout.freeWorkout')}</Text>
                </>
              )}
            </View>

            {/* Card counter */}
            <View style={[styles.topCard, isLandscape && styles.topCardLandscape]}>
              {guidedSession ? (
                // Modalità guidata: layout orizzontale
                <View style={styles.guidedMainRow}>
                    {/* Counter a sinistra */}
                    <View style={styles.guidedCounterSection}>
                      <Text style={styles.guidedCounterText}>
                        {count}<Text style={styles.guidedCounterGoal}>/{guidedSession.card.repsPerSet}</Text>
                      </Text>
                    </View>

                    {/* Info a destra, impilate verticalmente */}
                    <View style={styles.guidedInfoSection}>
                      <View style={styles.guidedInfoItem}>
                        <MaterialCommunityIcons name="repeat" size={20} color={colors.primary} />
                        <Text style={styles.guidedInfoValue}>
                          {guidedSession.currentSet}/{guidedSession.card.sets}
                        </Text>
                        <Text style={styles.guidedInfoLabel}>{t('workout.sets')}</Text>
                      </View>
                      <View style={styles.guidedInfoItem}>
                        <MaterialCommunityIcons name="timer-outline" size={20} color={colors.primary} />
                        <Text style={styles.guidedInfoValue}>
                          {formatTime(getSessionTime())}
                        </Text>
                      </View>
                    </View>
                  </View>
              ) : (
                // Modalità libera
                <>
                  <View style={styles.freeMainRow}>
                    {/* Counter a sinistra */}
                    <View style={styles.freeCounterSection}>
                      <Text style={[styles.counterText, isLandscape && styles.counterTextLandscape]}>
                        {count}
                      </Text>
                    </View>

                    {/* Info a destra */}
                    <View style={styles.freeInfoSection}>
                      <View style={styles.guidedInfoItem}>
                        <MaterialCommunityIcons name="timer-outline" size={20} color={colors.primary} />
                        <Text style={styles.guidedInfoValue}>
                          {formatTime(freeWorkoutTime)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleFreeReset}
                      >
                        <MaterialCommunityIcons name="refresh" size={20} color={colors.black} />
                        <Text style={styles.resetButtonText}>RESET</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Istruzioni centrali */}
            <View style={styles.centerContent}>
              <Text style={[styles.centerInstruction, isLandscape && styles.centerInstructionLandscape]}>
                {!isModelLoaded
                  ? t('workout.loadingModel')
                  : isReady === 'READY' || isReady === 'ON_GROUND'
                    ? t('workout.doPushup')
                    : isReady === 'FRONTAL'
                      ? t('workout.getDown')
                      : isReady === 'NOT_READY'
                        ? t('workout.getFrontal')
                        : t('workout.getVisible')}
              </Text>
            </View>

            {/* STEP 2: SlideToStop (allenamento guidato o libero) */}
            {(guidedSession || isFreeWorkoutMode) && (
              <SlideToStop onStop={isFreeWorkoutMode ? handleStopFreeWorkout : handleStopWorkout} />
            )}
          </View>
        )}

      {/* STEP 1: Modale selezione schede */}
      <WorkoutCardsModal
        visible={showCardsModal}
        onClose={() => {
          setShowCardsModal(false);
          // Se l'utente non ha ancora scelto una modalità, torna alla Home
          if (!hasUserSelectedMode && !guidedSession && !isFreeWorkoutMode) {
            navigation.navigate('Allenamenti' as never);
          }
        }}
        workoutCards={workoutCards}
        onSelectCard={handleSelectCard}
        onToggleFavorite={handleToggleFavorite}
        onSelectFreeWorkout={handleSelectFreeWorkout}
      />

      {/* Modale conferma avvio allenamento libero */}
      <FreeWorkoutConfirmModal
        visible={showFreeConfirmModal}
        onConfirm={handleConfirmFreeWorkout}
        onCancel={handleCancelFreeWorkout}
      />

      {/* STEP 1: Modale conferma avvio scheda */}
      <WorkoutConfirmModal
        visible={showConfirmModal}
        workoutCard={selectedCard}
        onConfirm={handleConfirmStart}
        onCancel={handleCancelStart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  overlayLandscape: {
    justifyContent: 'flex-start',
    padding: 16,
    paddingTop: 16,
  },
  topCard: {
    backgroundColor: colors.transparent.black30,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.transparent.primary20,
  },
  topCardLandscape: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 200,
  },
  // Badge modalità (comune per libera e guidata)
  modeBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: colors.transparent.primary15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.transparent.primary30,
  },
  modeBadgeText: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Agdasima-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Stili modalità guidata
  guidedMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guidedCounterSection: {
    flex: 1,
    alignItems: 'center',
  },
  guidedCounterText: {
    fontSize: 64,
    fontFamily: 'Agdasima-Bold',
    color: colors.primary,
    lineHeight: 68,
  },
  guidedCounterGoal: {
    fontSize: 36,
    color: colors.transparent.primary50,
  },
  guidedInfoSection: {
    gap: 10,
  },
  guidedInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.transparent.primary10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guidedInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  guidedInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.transparent.primary60,
    marginLeft: -4,
  },
  // Stili modalità libera
  freeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeCounterSection: {
    flex: 1,
    alignItems: 'center',
  },
  freeInfoSection: {
    gap: 10,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  counterText: {
    fontSize: 64,
    color: colors.primary,
    fontFamily: 'Agdasima-Bold',
  },
  counterTextLandscape: {
    fontSize: 48,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInstruction: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: colors.transparent.black80,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  centerInstructionLandscape: {
    fontSize: 24,
    letterSpacing: 1,
  },
  message: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionSubtitle: {
    color: colors.transparent.white70,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
