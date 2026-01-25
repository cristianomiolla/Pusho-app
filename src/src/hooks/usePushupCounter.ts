import { useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import type { Pose } from '../types/pose';
import { calculateAngle } from '../utils/geometry';

type PushupState = 'UNKNOWN' | 'UP' | 'DOWN';
type ReadyState = 'NOT_VISIBLE' | 'NOT_READY' | 'FRONTAL' | 'ON_GROUND' | 'READY';

const MIN_CONFIDENCE = 0.35; // Soglia bilanciata per modello Lite
const MIN_AVERAGE_CONFIDENCE = 0.4; // Confidence media bilanciata
const ANGLE_DOWN_THRESHOLD = 135; // Angolo gomito < 135° = posizione "down"
const ANGLE_UP_THRESHOLD = 150; // Angolo gomito > 150° = posizione "up"
const DEBOUNCE_MS = 150; // Evita conteggi doppi
const READY_POSITION_FRAMES = 5; // Frame per confermare posizione ready
const MIN_STATE_DURATION_MS = 100; // Tempo minimo per validare uno stato

// Funzione SEMPLIFICATA per validare la pose frontale
const isValidFrontalPose = (pose: Pose): boolean => {
  const { leftShoulder, rightShoulder } = pose.keypoints;

  // In posizione frontale, le spalle devono essere ben separate orizzontalmente
  const shoulderDistance = Math.abs(leftShoulder.x - rightShoulder.x);

  // Distanza minima per confermare posizione frontale (non di profilo)
  // In frontale: circa 0.15-0.4
  return shoulderDistance >= 0.12;
};

// Funzione per verificare se sei sul pavimento (sdraiato) in posizione orizzontale
// ANTI-CHEAT: Verifica che il corpo sia effettivamente orizzontale usando spalle e fianchi
// IMPORTANTE: I fianchi DEVONO essere visibili per confermare posizione push-up
// Restituisce: { isOnGround: boolean, hipsVisible: boolean, shoulderY: number, shoulderHipDiff: number }
const checkGroundPosition = (pose: Pose): { isOnGround: boolean; hipsVisible: boolean; avgShoulderY: number; shoulderWidth: number; shoulderHipDiff: number } => {
  const { leftShoulder, rightShoulder, leftHip, rightHip } = pose.keypoints;

  // Posizione Y media delle spalle (0 = top, 1 = bottom dello schermo)
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

  // Larghezza delle spalle
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

  // Differenza verticale tra le spalle (devono essere circa alla stessa altezza)
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);

  // CRITERI BASE per essere "sul pavimento":
  // 1. Spalle nella metà inferiore dello schermo (Y > 0.4) - quando sei sdraiato
  // 2. Spalle larghe (frontale, non di profilo) - shoulderWidth > 0.12
  // 3. Spalle circa alla stessa altezza (corpo orizzontale) - differenza < 0.15
  const shouldersLowOnScreen = avgShoulderY > 0.4;
  const shouldersWide = shoulderWidth > 0.12;
  const shouldersLevel = shoulderHeightDiff < 0.15;

  const basicCriteria = shouldersLowOnScreen && shouldersWide && shouldersLevel;

  // Verifica se i fianchi sono visibili (richiediamo confidence più alta per anti-cheat)
  const hipsVisible = leftHip.confidence >= 0.4 || rightHip.confidence >= 0.4;

  if (hipsVisible) {
    // ANTI-CHEAT: Se i fianchi sono visibili, verifica che il corpo sia orizzontale
    // Calcola posizione Y media dei fianchi (usa solo quelli visibili)
    let avgHipY = 0;
    let hipCount = 0;
    if (leftHip.confidence >= 0.4) {
      avgHipY += leftHip.y;
      hipCount++;
    }
    if (rightHip.confidence >= 0.4) {
      avgHipY += rightHip.y;
      hipCount++;
    }
    avgHipY = avgHipY / hipCount;

    // Differenza tra spalle e fianchi
    // Sdraiato orizzontale: differenza MOLTO piccola (< 0.15)
    // Seduto: fianchi molto più in basso delle spalle (differenza > 0.2)
    // In piedi: fianchi ancora più in basso (differenza > 0.4)
    const shoulderHipDiff = avgHipY - avgShoulderY;

    // SOGLIA PIÙ STRETTA: Se i fianchi sono più di 0.15 sotto le spalle, probabilmente sei seduto
    // In posizione push-up orizzontale, spalle e fianchi sono quasi allo stesso livello Y
    const bodyIsHorizontal = shoulderHipDiff < 0.15;

    return {
      isOnGround: basicCriteria && bodyIsHorizontal,
      hipsVisible: true,
      avgShoulderY,
      shoulderWidth,
      shoulderHipDiff,
    };
  }

  // Fianchi non visibili - NON possiamo confermare che sei in posizione push-up
  // Restituisci isOnGround: false per richiedere i fianchi visibili
  return {
    isOnGround: false, // CAMBIATO: richiediamo i fianchi per confermare posizione
    hipsVisible: false,
    avgShoulderY,
    shoulderWidth,
    shoulderHipDiff: -1, // Valore sentinella per "non calcolabile"
  };
};

// Tipo per le metriche di ogni singola rep
interface RepMetric {
  angle: number;    // Angolo minimo raggiunto durante la rep
  downTime: number; // Tempo in stato DOWN (ms)
}

export const usePushupCounter = (pose: Pose | null) => {
  const [count, setCount] = useState(0);
  const [currentState, setCurrentState] = useState<PushupState>('UNKNOWN');
  const [isReady, setIsReady] = useState<ReadyState>('NOT_READY');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [repMetrics, setRepMetrics] = useState<RepMetric[]>([]); // Metriche per ogni rep

  const lastTransitionTime = useRef(Date.now());
  const previousState = useRef<PushupState>('UNKNOWN');
  const readyFramesCount = useRef(0);
  const stateStartTime = useRef(Date.now()); // Quando è iniziato lo stato corrente
  const downStateConfirmed = useRef(false); // Flag per confermare che siamo stati davvero in DOWN

  // Refs per tracciare metriche della rep corrente
  const minAngleInCurrentRep = useRef<number>(180); // Angolo minimo durante DOWN
  const currentRepDownStartTime = useRef<number>(0); // Timestamp inizio fase DOWN

  // Listener per cambiamenti di orientamento
  useEffect(() => {
    const updateOrientation = () => {
      const window = Dimensions.get('window');
      const landscape = window.width > window.height;
      setIsLandscape(landscape);
    };

    updateOrientation();

    const subscription = Dimensions.addEventListener('change', () => {
      updateOrientation();
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!pose) {
      readyFramesCount.current = 0;
      setIsReady('NOT_VISIBLE');
      return;
    }

    const {
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
    } = pose.keypoints;

    // Verifica SOLO i keypoints ESSENZIALI per i push up (upper body)
    // NON richiediamo anche/gambe perché in posizione frontale possono essere occluse dal busto
    const essentialKeypoints = [
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
    ];

    // VALIDAZIONE ADATTIVA:
    // - Se sei già READY: validazione MOLTO rilassata (durante i push-up polsi/gomiti sono spesso nascosti)
    // - Se non sei ancora posizionato: requisiti stretti (per evitare falsi positivi)
    const isAlreadyPositioned = isReady === 'READY' || isReady === 'ON_GROUND';

    if (isAlreadyPositioned) {
      // Quando sei già posizionato: richiedi SOLO le SPALLE visibili
      // Durante i push-up è normale che polsi/gomiti siano parzialmente nascosti
      const criticalKeypoints = [leftShoulder, rightShoulder];
      const criticalValid = criticalKeypoints.every(kp => kp.confidence >= MIN_CONFIDENCE); // Soglia standard
      const shouldersAvgConf = (leftShoulder.confidence + rightShoulder.confidence) / 2;

      if (!criticalValid || shouldersAvgConf < MIN_CONFIDENCE) {
        // Solo se le spalle non sono più visibili, resetta
        setCurrentState('UNKNOWN');
        readyFramesCount.current = 0;
        setIsReady('NOT_VISIBLE');
        setDebugInfo(`Spalle non visibili (conf: ${shouldersAvgConf.toFixed(2)})`);
        return;
      }
      // Se le spalle sono visibili, continua anche se polsi/gomiti sono nascosti
    } else {
      // Prima di posizionarti: verifica TUTTI i keypoint essenziali
      const essentialKeypointsValid = essentialKeypoints.every(
        (kp) => kp.confidence >= MIN_CONFIDENCE
      );
      const avgConfidence = essentialKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / essentialKeypoints.length;

      if (!essentialKeypointsValid || avgConfidence < MIN_AVERAGE_CONFIDENCE) {
        // Requisiti stretti per iniziare
        setCurrentState('UNKNOWN');
        readyFramesCount.current = 0;
        setIsReady('NOT_VISIBLE');
        setDebugInfo(`Corpo non rilevato (conf: ${avgConfidence.toFixed(2)})`);
        return;
      }
    }

    // STEP 1: VERIFICA POSIZIONE FRONTALE
    if (!isValidFrontalPose(pose)) {
      setCurrentState('UNKNOWN');
      readyFramesCount.current = 0;
      setIsReady('NOT_READY');
      setDebugInfo('Posizionati frontalmente alla camera');
      return;
    }

    // STEP 2: VERIFICA CHE SEI SUL PAVIMENTO (sdraiato)
    const groundCheck = checkGroundPosition(pose);
    const { isOnGround: onGroundResult, hipsVisible, avgShoulderY, shoulderWidth, shoulderHipDiff } = groundCheck;

    // Logica anti-cheat STRINGENTE:
    // - Prima di READY: RICHIEDI i fianchi visibili E corpo orizzontale
    // - Dopo READY: permetti tracking ma verifica che non sei seduto
    const isAlreadyReady = isReady === 'READY' || isReady === 'ON_GROUND';

    if (!onGroundResult) {
      if (isAlreadyReady) {
        // Sei già in posizione READY: verifica che non ti sei seduto/alzato

        // 1. Ti sei alzato completamente?
        const isStandingUp = avgShoulderY < 0.25;
        if (isStandingUp) {
          setCurrentState('UNKNOWN');
          readyFramesCount.current = 0;
          setIsReady('FRONTAL');
          setDebugInfo(`Ti sei alzato (Y:${avgShoulderY.toFixed(2)})`);
          return;
        }

        // 2. Sei seduto? (fianchi visibili e troppo in basso rispetto alle spalle)
        if (hipsVisible && shoulderHipDiff > 0.18) {
          // Probabilmente sei seduto - resetta stato
          setCurrentState('UNKNOWN');
          readyFramesCount.current = 0;
          setIsReady('FRONTAL');
          setDebugInfo(`Sembra che tu sia seduto (diff:${shoulderHipDiff.toFixed(2)})`);
          return;
        }

        // 3. Fianchi non visibili durante il push-up - permetti continuazione
        //    ma solo se le spalle sono nella zona bassa dello schermo
        if (!hipsVisible && avgShoulderY > 0.35) {
          // OK, probabilmente stai facendo il push-up e i fianchi sono fuori inquadratura
          setDebugInfo(`Pushup (Y:${avgShoulderY.toFixed(2)} SW:${shoulderWidth.toFixed(2)})`);
          // Non fare return - continua con il rilevamento degli angoli
        } else if (!hipsVisible) {
          // Fianchi non visibili e spalle alte - sospetto
          setCurrentState('UNKNOWN');
          readyFramesCount.current = 0;
          setIsReady('FRONTAL');
          setDebugInfo(`Mostra tutto il corpo`);
          return;
        }
      } else {
        // Non sei ancora READY: richiedi posizione corretta CON fianchi visibili
        setCurrentState('UNKNOWN');
        readyFramesCount.current = 0;
        setIsReady('FRONTAL');
        if (!hipsVisible) {
          setDebugInfo(`Inquadra tutto il corpo (anche i fianchi)`);
        } else if (shoulderHipDiff > 0.15) {
          setDebugInfo(`Sdraiati orizzontalmente (diff:${shoulderHipDiff.toFixed(2)})`);
        } else {
          setDebugInfo(`Abbassati sul pavimento (Y:${avgShoulderY.toFixed(2)})`);
        }
        return;
      }
    }

    // STEP 3: Sei sul pavimento in posizione frontale
    // Ora procedi con il rilevamento degli angoli

    // Calcola angolo gomiti, gestendo keypoint parzialmente visibili
    // Usa solo il braccio con migliore confidence se uno è nascosto
    const leftArmConf = Math.min(leftElbow.confidence, leftWrist.confidence);
    const rightArmConf = Math.min(rightElbow.confidence, rightWrist.confidence);

    let avgElbowAngle: number;

    if (leftArmConf >= 0.3 && rightArmConf >= 0.3) {
      // Entrambe le braccia visibili: usa la media
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
    } else if (leftArmConf >= 0.3) {
      // Solo braccio sinistro visibile
      avgElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    } else if (rightArmConf >= 0.3) {
      // Solo braccio destro visibile
      avgElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    } else {
      // Nessun braccio visibile abbastanza: mantieni stato corrente
      avgElbowAngle = currentState === 'UP' ? 180 : (currentState === 'DOWN' ? 45 : 120);
    }

    // Debug: mostra informazioni dettagliate
    setDebugInfo(`Ang:${Math.round(avgElbowAngle)}° St:${currentState} Y:${avgShoulderY.toFixed(2)} Fr:${readyFramesCount.current}`);

    // Determina stato attuale
    let newState: PushupState = currentState;

    if (avgElbowAngle < ANGLE_DOWN_THRESHOLD) {
      newState = 'DOWN';
      // Traccia angolo minimo durante la fase DOWN
      if (avgElbowAngle < minAngleInCurrentRep.current) {
        minAngleInCurrentRep.current = avgElbowAngle;
      }
    } else if (avgElbowAngle > ANGLE_UP_THRESHOLD) {
      newState = 'UP';
    }

    // Verifica se l'utente è in posizione pronta (braccia distese, posizione UP)
    if (newState === 'UP') {
      readyFramesCount.current += 1;
      if (readyFramesCount.current >= READY_POSITION_FRAMES) {
        // Una volta raggiunto READY, resta READY
        setIsReady('READY');
      } else if (isReady !== 'READY') {
        // Se non sei ancora READY, mostri ON_GROUND
        setIsReady('ON_GROUND');
      }
    } else {
      // Sei in DOWN o stato intermedio
      if (readyFramesCount.current < READY_POSITION_FRAMES) {
        readyFramesCount.current = 0;
        if (isReady !== 'READY') {
          setIsReady('ON_GROUND');
        }
      }
      // Se sei già READY, resta READY anche se scendi (per fare il push up)
    }

    const now = Date.now();

    // Aggiorna stato e traccia durata
    if (newState !== currentState) {
      const stateDuration = now - stateStartTime.current;

      // Conferma lo stato DOWN solo se è durato abbastanza a lungo
      if (currentState === 'DOWN' && stateDuration >= MIN_STATE_DURATION_MS) {
        downStateConfirmed.current = true;
      }

      // Quando ENTRIAMO in DOWN: salva timestamp e resetta angolo minimo
      if (newState === 'DOWN' && currentState !== 'DOWN') {
        currentRepDownStartTime.current = now;
        minAngleInCurrentRep.current = 180; // Reset per nuova rep
      }

      previousState.current = currentState;
      setCurrentState(newState);
      stateStartTime.current = now;

      // Reset flag quando usciamo da DOWN
      if (currentState === 'DOWN' && newState !== 'DOWN') {
        // Non resettiamo subito, lo facciamo dopo il conteggio
      }
    }

    // Verifica debounce
    const timeSinceLastCount = now - lastTransitionTime.current;
    if (timeSinceLastCount < DEBOUNCE_MS) {
      return;
    }

    // Conta push-up: transizione DOWN → UP
    // REQUISITI:
    // 1. Utente deve essere READY
    // 2. Stato precedente deve essere DOWN
    // 3. Nuovo stato deve essere UP
    // 4. Lo stato DOWN deve essere stato confermato (durato abbastanza)
    if (
      isReady === 'READY' &&
      previousState.current === 'DOWN' &&
      newState === 'UP' &&
      downStateConfirmed.current
    ) {
      // Calcola durata fase DOWN
      const downDuration = now - currentRepDownStartTime.current;
      // Salva angolo minimo PRIMA del reset (importante per la closure di setRepMetrics)
      const savedMinAngle = minAngleInCurrentRep.current;

      // Salva metriche della rep completata
      setRepMetrics((prev) => [
        ...prev,
        {
          angle: savedMinAngle,
          downTime: downDuration,
        },
      ]);

      setCount((prev) => prev + 1);
      lastTransitionTime.current = now;
      downStateConfirmed.current = false; // Reset flag dopo conteggio

      // Reset metriche per prossima rep
      minAngleInCurrentRep.current = 180;
    }
  }, [pose, currentState, isReady]);

  const reset = () => {
    setCount(0);
    setCurrentState('UNKNOWN');
    previousState.current = 'UNKNOWN';
    setIsReady('NOT_VISIBLE');
    readyFramesCount.current = 0;
    downStateConfirmed.current = false;
    stateStartTime.current = Date.now();
    // Reset metriche qualità
    setRepMetrics([]);
    minAngleInCurrentRep.current = 180;
    currentRepDownStartTime.current = 0;
  };

  // Calcola profondità media (angolo medio minimo)
  const averageDepth = repMetrics.length > 0
    ? repMetrics.reduce((sum, rep) => sum + rep.angle, 0) / repMetrics.length
    : 0;

  // Calcola tempo medio in fase DOWN
  const averageDownTime = repMetrics.length > 0
    ? repMetrics.reduce((sum, rep) => sum + rep.downTime, 0) / repMetrics.length
    : 0;

  // Calcola quality score (0-100) basato su profondità (70%) + tempo DOWN (30%)
  const calculateQualityScore = (): number => {
    if (repMetrics.length === 0) return 0;

    // Score profondità (basato su angolo medio)
    // ≤ 70° → 100% (eccellente profondità)
    // 70-90° → 70-100% (buona profondità)
    // 90-110° → 40-70% (profondità media)
    // > 110° → 0-40% (profondità insufficiente)
    let depthScore: number;
    if (averageDepth <= 70) {
      depthScore = 100;
    } else if (averageDepth <= 90) {
      // Interpolazione lineare 70-90° → 100-70%
      depthScore = 100 - ((averageDepth - 70) / 20) * 30;
    } else if (averageDepth <= 110) {
      // Interpolazione lineare 90-110° → 70-40%
      depthScore = 70 - ((averageDepth - 90) / 20) * 30;
    } else {
      // > 110° → max 40%, scala fino a 0 a 135°
      depthScore = Math.max(0, 40 - ((averageDepth - 110) / 25) * 40);
    }

    // Score tempo DOWN (controllo)
    // ≥ 1000ms → 100% (ottimo controllo)
    // 600-1000ms → 50-100% (buon controllo)
    // < 600ms → 0-50% (troppo veloce)
    let timeScore: number;
    if (averageDownTime >= 1000) {
      timeScore = 100;
    } else if (averageDownTime >= 600) {
      // Interpolazione lineare 600-1000ms → 50-100%
      timeScore = 50 + ((averageDownTime - 600) / 400) * 50;
    } else {
      // < 600ms → max 50%, scala fino a 0 a 200ms
      timeScore = Math.max(0, (averageDownTime / 600) * 50);
    }

    // Combina: 70% profondità + 30% tempo
    return Math.round(depthScore * 0.7 + timeScore * 0.3);
  };

  const qualityScore = calculateQualityScore();

  return {
    count,
    state: currentState,
    isReady,
    debugInfo,
    reset,
    // Metriche qualità
    averageDepth: Math.round(averageDepth),
    averageDownTime: Math.round(averageDownTime),
    qualityScore,
  };
};
