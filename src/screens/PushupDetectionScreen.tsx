import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { usePushupCounter } from '../hooks/usePushupCounter';
import { useCompletionSound } from '../hooks/useCompletionSound';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { WorkoutCardsModal } from '../components/WorkoutCardsModal';
import { WorkoutConfirmModal } from '../components/WorkoutConfirmModal';
import { SlideToStop } from '../components/SlideToStop';
import { RestScreen } from '../components/RestScreen';
import { WorkoutCompletedScreen } from '../components/WorkoutCompletedScreen';
import { useWorkout } from '../contexts/WorkoutContext';
import { useAuth } from '../contexts/AuthContext';
import * as cardsService from '../services/cards.service';
import * as workoutService from '../services/workout.service';
import type { Pose } from '../types/pose';
import type { WorkoutCard, GuidedWorkoutSession } from '../types/workout';

export const PushupDetectionScreen = () => {
  const { t } = useTranslation();
  const { hasPermission, isLoading, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isFocused = useIsFocused();
  const { setIsGuidedWorkoutActive, triggerHomeRefresh, triggerCommunityRefresh } = useWorkout();
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

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
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

  const { count, isReady, debugInfo, reset, averageDepth, averageDownTime, qualityScore } = usePushupCounter(pose);
  const { playCompletionSound } = useCompletionSound();

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
    reset(); // Reset counter all'avvio
  };

  const handleCancelStart = () => {
    setShowConfirmModal(false);
    setSelectedCard(null);
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
    reset();
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

  // Mostra schermata completamento allenamento libero
  const handleShowFreeWorkoutCompleted = () => {
    setFreeWorkoutStats({
      pushups: count,
      time: freeWorkoutTime,
      qualityScore,
      averageDepth,
      averageDownTime,
    });
    setShowFreeWorkoutCompleted(true);
  };

  // Salva allenamento libero
  const handleSaveFreeWorkout = async () => {
    if (!user) return;

    try {
      // Crea una serie con i pushups totali (per il calcolo del max)
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

      // Segnala alla Home e Community di ricaricare i dati
      triggerHomeRefresh();
      triggerCommunityRefresh();
    } catch (error) {
      console.error('Error saving free workout:', error);
    }

    handleExitFreeWorkout();
  };

  // Esci senza salvare allenamento libero
  const handleExitFreeWorkout = () => {
    setShowFreeWorkoutCompleted(false);
    setFreeWorkoutStats({
      pushups: 0,
      time: 0,
      qualityScore: 0,
      averageDepth: 0,
      averageDownTime: 0,
    });
    reset();
    setFreeWorkoutStartTime(null);
    setFreeWorkoutTime(0);
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
          <Ionicons name="camera-outline" size={64} color="#BDEEE7" />
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

      {/* UI Normale (quando non in stati speciali) */}
      {guidedSession?.state !== 'rest' &&
        guidedSession?.state !== 'completed' &&
        !showFreeWorkoutCompleted && (
          <View style={[styles.overlay, isLandscape && styles.overlayLandscape]}>
            {/* Badge modalità in alto */}
            <View style={styles.modeBadgeCard}>
              {guidedSession ? (
                <>
                  <Ionicons name="document-text" size={18} color="#BDEEE7" />
                  <Text style={styles.modeBadgeText}>{guidedSession.card.name}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="infinite-outline" size={18} color="#BDEEE7" />
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
                        <Ionicons name="repeat-outline" size={20} color="#BDEEE7" />
                        <Text style={styles.guidedInfoValue}>
                          {guidedSession.currentSet}/{guidedSession.card.sets}
                        </Text>
                        <Text style={styles.guidedInfoLabel}>{t('workout.sets')}</Text>
                      </View>
                      <View style={styles.guidedInfoItem}>
                        <Ionicons name="timer-outline" size={20} color="#BDEEE7" />
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
                        <Ionicons name="timer-outline" size={20} color="#BDEEE7" />
                        <Text style={styles.guidedInfoValue}>
                          {formatTime(freeWorkoutTime)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.resetButtonSmall}
                        onPress={handleFreeReset}
                      >
                        <Text style={styles.resetButtonSmallText}>RESET</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {count >= 2 ? (
                    <TouchableOpacity
                      style={styles.selectCardButtonFull}
                      onPress={handleShowFreeWorkoutCompleted}
                    >
                      <Ionicons name="save-outline" size={18} color="#000" />
                      <Text style={styles.selectCardButtonText}>{t('workout.saveWorkout')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.selectCardButtonFull}
                      onPress={() => setShowCardsModal(true)}
                    >
                      <Ionicons name="document-text-outline" size={18} color="#000" />
                      <Text style={styles.selectCardButtonText}>{t('workout.selectCard')}</Text>
                    </TouchableOpacity>
                  )}
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

            {/* STEP 2: SlideToStop (solo se allenamento guidato attivo) */}
            {guidedSession && (
              <SlideToStop onStop={handleStopWorkout} />
            )}
          </View>
        )}

      {/* STEP 1: Modale selezione schede */}
      <WorkoutCardsModal
        visible={showCardsModal}
        onClose={() => setShowCardsModal(false)}
        workoutCards={workoutCards}
        onSelectCard={handleSelectCard}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* STEP 1: Modale conferma avvio */}
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
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(189, 238, 231, 0.2)',
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
    backgroundColor: 'rgba(189, 238, 231, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(189, 238, 231, 0.3)',
  },
  modeBadgeText: {
    fontSize: 16,
    color: '#BDEEE7',
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
    color: '#BDEEE7',
    lineHeight: 68,
  },
  guidedCounterGoal: {
    fontSize: 36,
    color: 'rgba(189, 238, 231, 0.5)',
  },
  guidedInfoSection: {
    gap: 10,
  },
  guidedInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(189, 238, 231, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guidedInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#BDEEE7',
  },
  guidedInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(189, 238, 231, 0.6)',
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
  counterText: {
    fontSize: 64,
    color: '#BDEEE7',
    fontFamily: 'Agdasima-Bold',
  },
  counterTextLandscape: {
    fontSize: 48,
  },
  resetButtonSmall: {
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonSmallText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  freeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  selectCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectCardButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  selectCardButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
  saveWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveWorkoutButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInstruction: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  centerInstructionLandscape: {
    fontSize: 24,
    letterSpacing: 1,
  },
  centerDebugText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  perfText: {
    fontSize: 11,
    color: 'rgba(189, 238, 231, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  perfTextLandscape: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'left',
  },
  message: {
    color: '#fff',
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
    color: '#BDEEE7',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
