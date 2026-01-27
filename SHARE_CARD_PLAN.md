# Piano: Share Card "Instagrammabile" per Pusho

## Obiettivo
Creare una funzionalità di condivisione visivamente accattivante stile Strava, dove l'utente può:
1. Scattare una foto o selezionarla dalla galleria dopo il workout
2. Vedere la foto con overlay trasparente delle statistiche
3. Condividere l'immagine sui social (Instagram, WhatsApp, ecc.)

## Stats da mostrare
- Push-up totali (numero grande)
- Numero di serie
- Durata
- Qualità media %

---

## Dipendenze da Installare

```bash
npx expo install expo-image-picker react-native-view-shot expo-sharing
```

---

## Nuovi File da Creare

```
src/components/share/
├── ShareCardModal.tsx       # Modal principale con flusso completo
├── ShareCardPreview.tsx     # View catturabile (1080x1350 ratio 4:5)
├── ShareStatsOverlay.tsx    # Overlay stats trasparente
└── ImageSourcePicker.tsx    # Bottom sheet camera/galleria

src/components/
└── SessionDetailModal.tsx   # Popup dettaglio sessione dallo storico (con icona share)

src/hooks/
└── useShareCard.ts          # Hook per picking immagine + capture + share
```

---

## File da Modificare

### 1. `app.json` - Permessi photo library
Aggiungere in `ios.infoPlist`:
```json
"NSPhotoLibraryUsageDescription": "Pusho usa la libreria foto per creare share card personalizzate."
```

Aggiungere in `plugins`:
```json
[
  "expo-image-picker",
  {
    "photosPermission": "Pusho usa le tue foto per creare share card personalizzate."
  }
]
```

### 2. `src/components/WorkoutCompletedScreen.tsx`
- Aggiungere prop `onShare?: () => void`
- Aggiungere icona share in **alto a destra** del popup (non come bottone in basso)
- Icona: `share-variant` da MaterialCommunityIcons, colore `#BDEEE7`

### 3. `src/components/SessionDetailModal.tsx` (NUOVO - DA CREARE)
- Popup che si apre quando l'utente clicca su una sessione nello storico
- Mostra dettagli completi della sessione (push-up, serie, tempo, qualità, data)
- Icona share in **alto a destra**
- Props: `session: WorkoutSession`, `visible: boolean`, `onClose`, `onShare`

### 4. `src/screens/PushupDetectionScreen.tsx`
- Gestire stato `showShareModal`
- Passare `onShare` callback a WorkoutCompletedScreen
- Renderizzare `ShareCardModal` con i dati del workout

### 5. `src/components/HistoryTab.tsx`
- Aggiungere gestione tap su card sessione
- Aprire `SessionDetailModal` con i dati della sessione selezionata

### 6. `src/i18n/it.json` e `src/i18n/en.json`
Aggiungere chiavi:
```json
"share": {
  "title": "Condividi risultato",
  "takePhoto": "Scatta una foto",
  "chooseFromGallery": "Scegli dalla galleria",
  "share": "Condividi",
  "tapToAddPhoto": "Tocca per aggiungere una foto",
  "pushups": "PUSH-UPS",
  "sets": "SERIE",
  "time": "TEMPO",
  "quality": "QUALITÀ"
}
```

---

## Design Share Card (1080x1350px, ratio 4:5)

```
+------------------------------------------+
|                                          |
|          [FOTO UTENTE]                   |
|         (background full bleed)          |
|                                          |
|   +----------------------------------+   |
|   | Gradient overlay nero dal basso  |   |
|   |                                  |   |
|   |           42                     |   | <- Agdasima-Bold 64px
|   |        PUSH-UPS                  |   | <- uppercase 14px
|   |                                  |   |
|   |   [4]      [5:32]     [85%]      |   |
|   |   SERIE    TEMPO      QUALITÀ    |   |
|   |                                  |   |
|   +----------------------------------+   |
|                          [logo Pusho]    | <- 40x40, opacity 0.7
+------------------------------------------+
```

**Stile:**
- Gradient overlay: `rgba(0,0,0,0)` -> `rgba(0,0,0,0.7)` dal centro al basso
- Accent color: `#BDEEE7`
- Font: `Agdasima-Bold` per numeri grandi
- Logo piccolo angolo basso destro

---

## Posizionamento Icona Share

L'icona di condivisione deve essere presente in **due punti**:

### 1. Popup Fine Allenamento (WorkoutCompletedScreen)
- **Posizione:** Angolo in alto a destra del popup
- **Icona:** `share-variant` o `share` (MaterialCommunityIcons)
- **Stile:** Icona sola, senza testo, colore `#BDEEE7`
- **Funziona per:** Allenamento libero E schede guidate

### 2. Popup Dettaglio Sessione dallo Storico (DA CREARE)
- **Posizione:** Angolo in alto a destra del popup dettaglio
- **Icona:** Stessa icona share
- **Nota:** Questo popup di dettaglio sessione deve ancora essere creato. Quando l'utente clicca su una card nello storico, si apre un popup con i dettagli della sessione e l'icona share in alto a destra.

---

## Flusso UX

### Da Fine Allenamento:
1. **Workout completato** → Appare WorkoutCompletedScreen
2. **Tap icona share (alto destra)** → Apre ShareCardModal
3. **Tap area foto** → Appare ImageSourcePicker (camera/galleria)
4. **Seleziona/scatta foto** → Appare preview con overlay stats
5. **Tap "Condividi"** → Cattura immagine + apre share sheet nativo
6. **Condivide su Instagram/WhatsApp/etc**

### Da Storico (futuro):
1. **Tap su card sessione in storico** → Apre popup dettaglio sessione
2. **Tap icona share (alto destra)** → Apre ShareCardModal con dati sessione
3. **Stesso flusso di sopra (foto → preview → share)**

---

## Step di Implementazione

### Fase 1: Setup
1. Installare dipendenze npm
2. Aggiornare app.json con permessi
3. Creare cartella `src/components/share/`

### Fase 2: Componenti Share (core)
4. `ShareStatsOverlay.tsx` - componente stats puro
5. `ShareCardPreview.tsx` - wrapper con Image + overlay + ref per capture
6. `ImageSourcePicker.tsx` - bottom sheet con 2 opzioni
7. `useShareCard.ts` - hook con logica completa

### Fase 3: Modal e Integrazione
8. `ShareCardModal.tsx` - orchestrazione flusso
9. Modificare `WorkoutCompletedScreen.tsx` - aggiungere bottone
10. Modificare `PushupDetectionScreen.tsx` - gestire modal

### Fase 4: Traduzioni
11. Aggiornare `it.json` e `en.json`

### Fase 5: Rebuild
12. Rifare build development (nuovi plugin nativi richiedono rebuild)

---

## Verifica

1. **Build:** `eas build --profile development` (necessario per nuovi plugin)
2. **Test camera:** Verificare che si apra la fotocamera e scatti foto
3. **Test galleria:** Verificare selezione immagine con crop 4:5
4. **Test preview:** Verificare che overlay stats sia ben posizionato
5. **Test share:** Verificare che si apra share sheet e immagine sia corretta
6. **Test Instagram Stories:** Verificare qualità immagine condivisa

---

## Note Tecniche

- `expo-image-picker` usa `allowsEditing: true` con `aspect: [4, 5]` per crop automatico
- `react-native-view-shot` cattura la view con `format: 'png'` e `quality: 1`
- `expo-sharing` apre la share sheet nativa con `mimeType: 'image/png'`
- I permessi camera sono già configurati per `react-native-vision-camera`, ma servono quelli per la photo library
