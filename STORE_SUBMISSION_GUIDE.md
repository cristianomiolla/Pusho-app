# Guida alla Pubblicazione sugli Store

Questa guida contiene tutti i passaggi necessari per pubblicare Pusho su Google Play Store e Apple App Store.

---

## Stato Attuale: ~95% Pronto

### ✅ Già Configurato

| Elemento | Stato | Note |
|----------|-------|------|
| Bundle ID iOS | ✅ | `com.pusho.app` |
| Package Android | ✅ | `com.pusho.app` |
| Icone app | ✅ | `/assets/icon.png`, `icon-ios.png`, `adaptive-icon.png` |
| Splash screen | ✅ | `/assets/splash-icon.png` |
| Privacy Policy | ✅ | In-app modal con traduzioni IT/EN |
| Terms of Service | ✅ | `/TERMS_OF_SERVICE.md` + in-app modal |
| Configurazione EAS | ✅ | `/eas.json` |
| Deep linking | ✅ | Schema `pusho://` configurato |
| Permessi camera | ✅ | Dichiarati in Info.plist e AndroidManifest |
| Multilingua | ✅ | Italiano e Inglese (`/src/i18n/`) |
| Privacy Manifest iOS | ✅ | `app.json` - NSPrivacyAccessedAPITypes |
| Versione | ✅ | 1.0.0 |

---

### ✅ 1. Account Developer (COMPLETATO)

- ✅ Google Play Console - Attivo
- ✅ Apple Developer Program - Attivo

---

### ✅ 2. Documenti Legali (COMPLETATI)

#### Terms of Service ✅
- File: `/TERMS_OF_SERVICE.md`
- Traduzioni in-app: `/src/i18n/it.json` e `/src/i18n/en.json`
- Modal accessibile da Profilo > Termini di Servizio
- Ultimo aggiornamento: 22 Gennaio 2026

#### Privacy Policy ✅
- Traduzioni in-app: `/src/i18n/it.json` e `/src/i18n/en.json`
- Modal accessibile da Profilo > Privacy
- Ultimo aggiornamento: 21 Gennaio 2026
- Conforme GDPR

---

### ✅ 3. Configurazione Android (COMPLETATO)

#### 3.1 Keystore di Produzione ✅
- Generato automaticamente da EAS Build
- Salvato sui server Expo (backup automatico)

#### 3.2 Build di Produzione ✅
- Build AAB in corso su EAS Build

---

### 4. Configurazione iOS

#### 4.1 Credenziali Apple ⏳
- Verranno generate al primo build production

#### 4.2 Privacy Manifest (iOS 17+) ✅
- Configurato in `app.json` sotto `expo.ios.privacyManifests`

#### 4.3 App Transport Security ✅
- `NSAllowsArbitraryLoads` impostato a `false` in `ios/Pusho/Info.plist`

#### 4.4 Build di Produzione ⏳
```bash
npx eas build --profile production --platform ios
```

---

### 5. Asset Grafici per gli Store

#### 5.1 Screenshot Richiesti

##### Google Play Store
| Tipo | Dimensioni | Quantità |
|------|------------|----------|
| Phone | 1080x1920 px (o 16:9) | min 2, max 8 |
| Tablet 7" | 1200x1920 px | opzionale |
| Tablet 10" | 1800x2560 px | opzionale |

##### Apple App Store
| Dispositivo | Dimensioni | Quantità |
|-------------|------------|----------|
| iPhone 6.7" | 1290x2796 px | min 1, max 10 |
| iPhone 6.5" | 1284x2778 px | min 1, max 10 |
| iPhone 5.5" | 1242x2208 px | min 1, max 10 |
| iPad Pro 12.9" | 2048x2732 px | se supporti iPad |

#### 5.2 Icona App

| Store | Dimensioni | Formato |
|-------|------------|---------|
| Google Play | 512x512 px | PNG (32-bit) |
| App Store | 1024x1024 px | PNG (no alpha) |

**Nota**: Le icone attuali sono 1323x1302px - ridimensionarle a 1024x1024px

#### 5.3 Feature Graphic (solo Android)
- Dimensioni: 1024x500 px
- Usata come header nel Play Store

#### 5.4 Video Preview (opzionale)
- **App Store**: 15-30 secondi, formato MP4/MOV
- **Play Store**: Link YouTube

---

### 6. Metadata per gli Store

#### 6.1 Informazioni Base

```
Nome App: Pusho
Categoria: Health & Fitness
Classificazione: PEGI 3 / Everyone
```

#### 6.2 Descrizione Breve (max 80 caratteri)

```
Conta i push-up automaticamente con l'AI. Traccia i tuoi progressi ogni giorno.
```

#### 6.3 Descrizione Completa (max 4000 caratteri)

```
Pusho è l'app intelligente che conta automaticamente i tuoi push-up usando la fotocamera del telefono e l'intelligenza artificiale.

🏋️ CONTEGGIO AUTOMATICO
Posiziona il telefono, inizia l'allenamento e Pusho conta ogni ripetizione per te. Niente più conteggi manuali o distrazioni.

📊 TRACCIA I PROGRESSI
Visualizza le tue statistiche giornaliere, settimanali e mensili. Monitora il tuo miglioramento nel tempo con grafici intuitivi.

🔒 PRIVACY AL PRIMO POSTO
Tutto il riconoscimento della postura avviene sul tuo dispositivo. I tuoi video non vengono mai caricati online.

✨ CARATTERISTICHE PRINCIPALI
• Conteggio automatico dei push-up con AI
• Riconoscimento postura in tempo reale
• Statistiche dettagliate e grafici
• Sincronizzazione cloud opzionale
• Modalità scura
• Disponibile in italiano e inglese

💪 INIZIA OGGI
Scarica Pusho e trasforma il tuo allenamento. Nessun abbonamento richiesto.

📧 SUPPORTO
Per domande o feedback: pushoapp@gmail.com
```

#### 6.4 Keywords/Parole Chiave

```
push-up, pushup, flessioni, allenamento, fitness, contatore, AI, workout, esercizi, casa, bodyweight, calisthenics
```

#### 6.5 What's New (Note di rilascio v1.0.0)

```
🎉 Prima versione di Pusho!

• Conteggio automatico push-up con AI
• Tracciamento progressi giornaliero
• Sincronizzazione cloud
• Supporto italiano e inglese
```

---

### 7. Classificazione Contenuti

#### Google Play - Questionario IARC
- Violenza: No
- Contenuti sessuali: No
- Linguaggio volgare: No
- Sostanze controllate: No
- Contenuti generati dagli utenti: No
- Condivisione posizione: No
- Acquisti in-app: No

**Rating atteso**: PEGI 3 / Everyone

#### App Store - Age Rating
- Contenuti per adulti: No
- Violenza: No
- Gioco d'azzardo: No
- Horror: No
- Linguaggio volgare: No
- Contenuti medici: No (è fitness, non medico)

**Rating atteso**: 4+

---

### 8. Comandi per il Build

#### Build di Test (Preview)

```bash
# Android APK per test
npm run build:android-preview
# oppure
eas build --profile preview --platform android

# iOS per simulatore
eas build --profile preview --platform ios
```

#### Build di Produzione

```bash
# Android AAB per Play Store
eas build --profile production --platform android

# iOS per App Store
eas build --profile production --platform ios
```

#### Submit agli Store

```bash
# Submit Android a Play Store
eas submit --platform android --latest

# Submit iOS a App Store
eas submit --platform ios --latest
```

---

### 9. Checklist Pre-Submission

#### Generale
- [ ] Testato su dispositivi reali
- [ ] Tutti i crash risolti
- [x] Privacy Policy accessibile nell'app (modal in Profilo)
- [x] Terms of Service creati e accessibili nell'app (modal in Profilo)
- [x] Link "Lascia una recensione" funzionante (Profilo > Lascia una recensione)
- [x] Link supporto email funzionante (Profilo > Assistenza)
- [x] Versione impostata correttamente (1.0.0)

#### Android
- [ ] Account Google Play Console attivo
- [ ] Keystore di produzione generato e backuppato
- [ ] Build AAB generato con successo
- [ ] Screenshot caricati (min 2)
- [ ] Feature graphic caricata
- [ ] Descrizione compilata
- [ ] Classificazione contenuti completata
- [ ] Privacy Policy URL inserito
- [ ] Testato su Android 8.0+ (SDK 26+)

#### iOS
- [ ] Account Apple Developer attivo
- [ ] Certificati e provisioning configurati
- [ ] Build IPA generato con successo
- [ ] Screenshot caricati per ogni dimensione
- [ ] App Preview video (opzionale)
- [ ] Descrizione compilata
- [ ] Age rating impostato
- [ ] Privacy Policy URL inserito
- [ ] Testato su iOS 13.0+
- [ ] Testato su TestFlight

---

### 10. Timeline Stimata

| Fase | Durata |
|------|--------|
| Setup account developer | 1-2 giorni |
| Preparazione asset grafici | 2-3 giorni |
| Configurazione build produzione | 1 giorno |
| Beta testing (TestFlight/Internal) | 3-5 giorni |
| Review Apple | 1-7 giorni |
| Review Google | 1-3 giorni |
| **Totale stimato** | **1-3 settimane** |

---

### 11. Link Utili

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

---

### 12. Contatti e Supporto

- **Email supporto app**: pushoapp@gmail.com
- **Privacy Policy**: https://pushoapp.com/privacy (da pubblicare)
- **Terms of Service**: https://pushoapp.com/terms (da pubblicare)

---

## Note Finali

Questa guida è aggiornata al 22 Gennaio 2026. Le policy degli store possono cambiare, verifica sempre la documentazione ufficiale prima della submission.

Buona fortuna con la pubblicazione! 🚀
