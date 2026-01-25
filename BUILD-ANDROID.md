# Guida Build Android per Pusho

Guida completa per creare una build Android standalone dell'app Pusho che funziona **senza server**.

## Premessa importante

L'app Pusho utilizza MediaPipe per il rilevamento delle pose **completamente on-device**. NON è necessario alcun server per far funzionare l'app - tutto il processamento avviene localmente sul telefono Android.

## Tipi di Build

### Development Build
- Include Expo Dev Client
- **RICHIEDE** un server Metro in esecuzione (`npx expo start`)
- Utile per sviluppo con hot reload
- **NON funziona standalone**
- ❌ Non usare per testare l'app senza server

### Preview Build (CONSIGLIATA)
- App standalone completa
- **NON richiede** alcun server
- Funziona completamente offline
- ✅ Perfetta per test su dispositivo senza sviluppo attivo

### Production Build
- Simile a preview ma ottimizzata per la pubblicazione
- Richiede keystore di produzione configurato

## Prerequisiti

1. Account Expo (già configurato: `sufficientpick`)
2. EAS CLI installato
3. Progetto EAS inizializzato (ID: `711824b3-7664-482a-8461-ffc00bf7eaaa`)

### Verifica setup
```bash
cd Pusho
npx eas-cli --version
npx eas whoami
```

## Quick Start (TL;DR)

Se hai fretta, esegui questi comandi in sequenza:

```bash
cd Pusho

# 1. Pulisci cache Android
rm -rf android/build android/.gradle android/app/build

# 2. Verifica configurazione (risolvi eventuali errori)
npx expo-doctor

# 3. Avvia build
npx eas build --profile preview --platform android

# 4. Aspetta 15-20 min e scarica APK dal link fornito
```

**Controllo rapido app.json:** Rimuovi `cli.appVersionSource` e `android.minSdkVersion` se presenti.

## Come creare una build Android standalone

### 0. Pre-requisiti e pulizia (IMPORTANTE)

**Prima di avviare una build, esegui sempre questi passaggi:**

1. **Verifica configurazione app.json**

   Assicurati che `app.json` NON contenga questi campi (causano errori di build):
   - ❌ `cli.appVersionSource` - Non supportato, rimuovilo
   - ❌ `android.minSdkVersion` - Gestito da `build.gradle`, rimuovilo da `app.json`

2. **Pulisci cache e build locali Android**

   ```bash
   cd Pusho
   rm -rf android/build android/.gradle android/app/build
   ```

   Questo previene errori di "No matching variant" per le dipendenze native.

3. **Verifica dipendenze con expo-doctor**

   ```bash
   npx expo-doctor
   ```

   Risolvi eventuali errori critici (warnings non bloccanti sono ok).

### 1. Avvia la build preview

```bash
cd Pusho
npm run build:android-preview
```

Oppure direttamente:
```bash
npx eas build --profile preview --platform android
```

### 2. Attendi il completamento

- La build viene eseguita sui server di Expo (cloud build)
- Tempo stimato: 15-20 minuti
- Puoi monitorare i log dal link che appare nel terminale

**Link progetto:** https://expo.dev/accounts/sufficientpick/projects/pusho

### 3. Verifica stato build

```bash
npx eas build:list --limit 1 --platform android --non-interactive
```

Cerca lo status `finished` e l'URL dell'Application Archive.

### 4. Scarica l'APK

Quando la build è completata, scarica l'archivio:

```bash
# Scarica l'archivio .tar.gz dall'URL fornito
curl -L -o build-preview.tar.gz "<URL_FORNITO_DA_EAS>"

# Estrai l'APK
tar -xzf build-preview.tar.gz

# L'APK da installare è: app-release.apk
```

### 5. Installa sul dispositivo Android

**Opzione A - Trasferimento USB:**
1. Collega il telefono al PC via USB
2. Abilita "Trasferimento file" sul telefono
3. Copia `app-release.apk` nella cartella Download
4. Sul telefono, apri il file e installa

**Opzione B - Email/Cloud:**
1. Invia `app-release.apk` via email o caricalo su Drive
2. Scarica sul telefono
3. Apri e installa

**Opzione C - Link diretto (se disponibile):**
- Alcuni build hanno un link diretto all'APK dalla dashboard EAS

### 6. Installazione sul telefono

1. Apri `app-release.apk` sul telefono
2. Android chiederà di abilitare "Installa app da fonti sconosciute"
3. Accetta e procedi con l'installazione
4. L'app sarà installata come qualsiasi altra app

## Script disponibili

Nel `package.json` sono configurati questi script:

```json
"build:android-dev": "eas build --profile development --platform android"
"build:android-preview": "eas build --profile preview --platform android"
```

## Configurazione EAS (eas.json)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "withoutCredentials": true
      }
    }
  }
}
```

**Note importanti:**
- `buildType: "apk"` - Crea un APK invece di AAB (più semplice per test)
- `withoutCredentials: true` - Usa la keystore debug (no firma produzione)
- `gradleCommand: ":app:assembleRelease"` - Build release ottimizzata

## Ottimizzazioni

### Ridurre dimensione upload (.easignore)

Il file `.easignore` esclude file non necessari dall'upload a EAS:

```
# File temporanei
tmpclaude-*
nul

# Cache e build locali
android/build
android/app/build
android/.gradle
node_modules/**/*.map

# File di log e IDE
*.log
.vscode
.idea
```

**IMPORTANTE:** Se l'upload è ancora grande (~400+ MB), pulisci le cache Android prima:
```bash
rm -rf android/build android/.gradle android/app/build
```

Questo riduce l'upload da ~428 MB a ~30 MB.

## Troubleshooting

### Problema: Build fallisce con "No matching variant" per dipendenze native

**Errore completo:**
```
Could not resolve all dependencies for configuration ':app:releaseRuntimeClasspath'.
> Could not resolve project :shopify_react-native-skia.
> Could not resolve project :react-native-reanimated.
> Could not resolve project :react-native-safe-area-context.
> Could not resolve project :react-native-screens.
> Could not resolve project :react-native-vision-camera.
> Could not resolve project :react-native-worklets-core.
> Could not resolve project :react-native-worklets.
  No matching variant of project :<modulo> was found.
```

**Causa:** Cache e build locali Android corrotte o configurazione app.json non valida.

**Soluzione completa (in ordine):**

1. **Rimuovi campi non validi da app.json:**
   ```bash
   # Rimuovi manualmente da app.json:
   # - "cli": { "appVersionSource": "remote" }
   # - "android.minSdkVersion": 26
   ```

2. **Pulisci tutte le cache Android:**
   ```bash
   cd Pusho
   rm -rf android/build android/.gradle android/app/build
   ```

3. **Verifica dipendenze:**
   ```bash
   npx expo-doctor
   # Se manca react-native-worklets:
   npx expo install react-native-worklets
   ```

4. **Riavvia la build:**
   ```bash
   npx eas build --profile preview --platform android
   ```

**Risultato atteso dopo la pulizia:**
- Upload ridotto da ~434 MB a ~30 MB
- Build completa in 15-20 minuti senza errori

### Problema: "Development Build" chiede il server

**Causa:** Hai installato la build `development` invece di `preview`.

**Soluzione:** Crea una nuova build con `npm run build:android-preview` e installa `app-release.apk`.

### Problema: Build fallisce con errore keystore

**Causa:** Il profilo non ha `withoutCredentials: true`.

**Soluzione:** Verifica che `eas.json` abbia la configurazione corretta per il profilo preview (vedi sopra).

### Problema: Errori expo doctor

Errori comuni e soluzioni:

1. **minSdkVersion in app.json**
   - Rimosso da app.json (gestito da build.gradle nativo)

2. **Peer dependency react-native-worklets mancante**
   ```bash
   npx expo install react-native-worklets
   ```

3. **Icone non quadrate**
   - Warning non bloccante
   - Le icone dovrebbero essere 1024x1024 (attualmente 1323x1302)

### Problema: MediaPipe non funziona sull'app

**Causa:** Il modello MediaPipe non è incluso nell'app.

**Verifica:** Il file `android/app/src/main/assets/pose_landmarker_full.task` deve esistere (9 MB).

**Soluzione:** Esegui `npm run download-model` prima della build.

## Dimensioni file

- **Upload progetto a EAS (senza pulizia):** ~428 MB ❌
- **Upload progetto a EAS (con pulizia cache):** ~30 MB ✅
- **APK finale:** ~40-60 MB
- **Modello MediaPipe:** 9 MB (incluso nell'APK)

**Nota:** Esegui sempre `rm -rf android/build android/.gradle android/app/build` prima della build per ridurre l'upload del 93%!

## Note tecniche

### Architettura app
- **Rilevamento pose:** MediaPipe Tasks Vision 0.10.14 (nativo Android)
- **Camera:** react-native-vision-camera
- **Processing:** 100% on-device, nessuna chiamata server
- **Performance:** 8-20 FPS su dispositivi Android moderni

### Permessi richiesti
- `CAMERA` - Per catturare video e rilevare pose

### Build configuration
- **minSdkVersion:** 26 (Android 8.0)
- **targetSdkVersion:** 36
- **SDK Expo:** 54.0.0
- **React Native:** Gestito da Expo SDK

## Comandi utili

```bash
# Verifica login
npx eas whoami

# Lista ultime build
npx eas build:list --platform android --non-interactive

# Visualizza log build specifica
npx eas build:view <BUILD_ID>

# Cancella build vecchie (libera spazio account)
npx eas build:delete <BUILD_ID>
```

## Link utili

- **Dashboard progetto:** https://expo.dev/accounts/sufficientpick/projects/pusho
- **Documentazione EAS Build:** https://docs.expo.dev/build/introduction/
- **Troubleshooting EAS:** https://docs.expo.dev/build-reference/troubleshooting/

## Checklist build Android

**Pre-build (CRITICO):**
- [ ] Verifico che `app.json` NON contenga `cli.appVersionSource`
- [ ] Verifico che `app.json` NON contenga `android.minSdkVersion`
- [ ] Eseguo `rm -rf android/build android/.gradle android/app/build`
- [ ] Eseguo `npx expo-doctor` e risolvo errori critici

**Build:**
- [ ] Verifico di avere le modifiche più recenti nel codice
- [ ] Eseguo `npm run build:android-preview`
- [ ] Verifico che l'upload sia ~30 MB (non 400+ MB)
- [ ] Aspetto 15-20 minuti per il completamento
- [ ] Verifico che lo status sia `finished` (non `errored`)

**Installazione:**
- [ ] Scarico l'archivio dall'URL fornito
- [ ] Estraggo `app-release.apk`
- [ ] Trasferisco l'APK sul telefono
- [ ] Installo l'APK sul telefono

**Testing:**
- [ ] Testo l'app (fotocamera, rilevamento pose, UI)
- [ ] ✅ L'app funziona senza server!

## Versioning

Per aggiornare la versione prima di una build:

1. Modifica `version` in `app.json` (es: "1.0.0" → "1.1.0")
2. Aggiorna `versionCode` in `android/app/build.gradle` per Android (es: 1 → 2)
3. Crea la nuova build

## Conclusione

Questa procedura crea un'app Android completamente standalone che:
- ✅ Funziona offline
- ✅ Non richiede server
- ✅ Rileva pose on-device con MediaPipe
- ✅ Può essere installata su qualsiasi dispositivo Android
- ✅ È pronta per essere distribuita internamente o testata

Per build di produzione da pubblicare su Play Store, sarà necessario configurare una keystore di produzione e usare il profilo `production`.
