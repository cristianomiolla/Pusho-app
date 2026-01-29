# Guida Setup Mac Remoto Scaleway per Pusho

## 1. Installa Xcode Command Line Tools

```bash
xcode-select --install
```

## 2. Installa Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Dopo l'installazione, esegui i comandi mostrati per aggiungere Homebrew al PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verifica:
```bash
brew --version
```

## 3. Installa Node.js

```bash
brew install node
```

Verifica:
```bash
node -v
npm -v
```

## 4. Installa Ruby (versione aggiornata)

La versione di Ruby di sistema è troppo vecchia per CocoaPods. Installa una versione recente:

```bash
brew install ruby
```

Aggiungi Ruby e i gem al PATH:

```bash
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verifica:
```bash
ruby -v
```

## 5. Installa CocoaPods

```bash
gem install cocoapods
```

Verifica:
```bash
pod --version
```

## 6. Configura Xcode e Simulatore

Apri Xcode:
```bash
open -a Xcode
```

1. Accetta la licenza se richiesto
2. Vai su **Xcode → Settings → Platforms**
3. Scarica un **iOS Simulator** (es. iOS 17 o 18)

Oppure da terminale:
```bash
xcodebuild -downloadPlatform iOS
```

Configura xcode-select:
```bash
sudo xcode-select -s /Applications/Xcode.app
```

## 7. Clona il Repository

```bash
cd ~
git clone https://github.com/cristianomiolla/Pusho-app.git Pusho

```

## 8. Installa Dipendenze

**IMPORTANTE: Entra nella cartella corretta (doppia Pusho)**

```bash
cd ~/Pusho
npm install
```

## 9. Crea il file .env

Il file `.env` contiene le credenziali Supabase e non viene sincronizzato da git. Crealo manualmente:

```bash
echo 'EXPO_PUBLIC_SUPABASE_URL=https://ykkurwsutpujavfjtvra.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra3Vyd3N1dHB1amF2Zmp0dnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTQyODIsImV4cCI6MjA4NDE3MDI4Mn0.lXfpvLHwUEVTfCTks0KJ7K3Q8y2LX_BJjj5-DuhabCM' > .env
```

Verifica che sia stato creato:
```bash
cat .env
```

## 10. Installa React Native CLI

```bash
npm install @react-native-community/cli --save-dev
```

## 11. Genera il Progetto iOS (Expo Prebuild)

```bash
npx expo prebuild --platform ios
```

## 12. Installa Pod iOS

```bash
cd ios
pod install
cd ..
```

## 13. Avvia il Simulatore iOS

```bash
npx expo run:ios
```

---

## Troubleshooting

### Git pull con "divergent branches"

Se `git pull` fallisce con "Need to specify how to reconcile divergent branches":

```bash
# Opzione 1: Reset completo al remote (scarta modifiche locali)
git fetch origin
git reset --hard origin/master

# Opzione 2: Rebase (mantiene commit locali sopra quelli remoti)
git pull --rebase
```

### Errori build dopo git pull (ExpoModulesProvider.swift)

Se il build fallisce con errori su `ExpoModulesProvider.swift` o altri file Pods:

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

Poi riprova `npx expo run:ios`.

### "supabaseUrl is required" / Credenziali Supabase mancanti

Il file `.env` non esiste o è vuoto. Crealo seguendo il passo 9.

### "command not found: npm"
Node.js non è installato. Torna al passo 3.

### "command not found: brew"
Homebrew non è installato. Torna al passo 2.

### "Could not read package.json" / "ENOENT"
Sei nella cartella sbagliata. Assicurati di essere in `~/Pusho/Pusho` (dove c'è il file `package.json`).

Verifica con:
```bash
ls package.json
pwd
```

### "command not found: pod"
CocoaPods non è nel PATH. Aggiungi il percorso dei gem:
```bash
echo 'export PATH="/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Errore Ruby/ffi versione troppo vecchia
La versione di Ruby di sistema (2.6) è troppo vecchia. Installa Ruby con Homebrew (passo 4).

### "Could not automatically select an Xcode project"
Il progetto iOS non esiste ancora. Esegui `npx expo prebuild --platform ios` (passo 10).

### "yarn add -D @react-native-community/cli"
Installa il pacchetto mancante:
```bash
npm install @react-native-community/cli --save-dev
```

### "Can't determine id of Simulator app"
Il simulatore iOS non è installato o Xcode non è configurato:
1. Configura xcode-select: `sudo xcode-select -s /Applications/Xcode.app`
2. Installa il simulatore iOS da Xcode → Settings → Platforms

### Errori con pod install
Prova:
```bash
cd ios
pod deintegrate
pod install
```

---

## Struttura Cartelle

```
~/Pusho/                  <-- root del repository
  └── Pusho/              <-- QUI devi fare npm install e npx expo run:ios
      ├── package.json
      ├── src/
      ├── ios/            <-- generata da expo prebuild
      └── android/
```

---

## Riepilogo Comandi Rapido

Se hai già tutto installato e devi solo ripartire:

```bash
cd ~/Pusho/Pusho
git fetch origin && git reset --hard origin/master   # allinea al remote
npm install
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios
```

Se il `.env` non esiste, crealo prima di avviare (vedi passo 9).
