# Piano Analytics Pusho

## Obiettivo
Capire il funnel utente e la retention per ottimizzare l'app.

---

## Dati disponibili

### Attivazione & Retention
| Metrica | VIEW | Dati |
|---------|------|------|
| Iscritti | `analytics_iscritti` | iscritti per settimana |
| Attivazione | `analytics_attivazione_retention` | % iscritti che hanno fatto almeno 1 workout |
| Retention 7gg | `analytics_attivazione_retention` | % attivati che tornano entro 7gg |
| Retention 30gg | `analytics_attivazione_retention` | % attivati che tornano entro 30gg |

### Engagement Allenamenti
| Metrica | VIEW | Dati |
|---------|------|------|
| Workout totali | `analytics_engagement` | totale_workout |
| Utenti attivi | `analytics_engagement` | utenti_attivi |
| Workout per utente | `analytics_engagement` | workout_per_utente |
| Durata media | `analytics_engagement` | durata_media_sec |
| Pushup medi | `analytics_engagement` | pushup_medi |
| Qualità media | `analytics_engagement` | qualita_media |
| Free vs Guided | `analytics_engagement` | workout_free, workout_guided |
| Preset vs Custom | `analytics_engagement` | workout_preset, workout_custom |

### Comportamento Temporale
| Metrica | VIEW | Dati |
|---------|------|------|
| Distribuzione oraria | `analytics_comportamento_orario` | workout per ora |
| Distribuzione giorni | `analytics_comportamento_giorni` | workout per giorno settimana |

---

## Dati NON disponibili (mancano fonti)

| Metrica | Perché manca |
|---------|--------------|
| Installazioni | Dato dagli store, non in Supabase |
| Abbandono onboarding | Serve analytics_events per tracciare step |
| Workout iniziati ma non completati | Salviamo solo workout completati |

---

## Architettura

### Flusso dati
```
[Tabelle esistenti] ──→ [VIEW SQL] ──→ [Dashboard Next.js]
   profiles                            Legge come tabelle
   workout_sessions                    Filtra per periodo
   workout_cards                       Calcola percentuali
```

### VIEW Supabase
| VIEW | Scopo |
|------|-------|
| `analytics_iscritti` | Iscritti per settimana |
| `analytics_attivazione_retention` | Funnel e retention |
| `analytics_engagement` | Metriche allenamenti |
| `analytics_comportamento_orario` | Quando si allenano (ora) |
| `analytics_comportamento_giorni` | Quando si allenano (giorno) |

### File di riferimento
- `ANALYTICS_QUERIES.md` - SQL per creare le VIEW + esempi uso

---

## Dati non disponibili (serve analytics_events)

Se in futuro vogliamo capire il funnel pre-registrazione (a quale step abbandonano l'onboarding), dovremo implementare `analytics_events`.
