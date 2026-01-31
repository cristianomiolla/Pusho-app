# Query Analytics Pusho

Le VIEW si comportano come tabelle e restituiscono sempre dati aggiornati.
Dalla dashboard puoi filtrarle per periodo con `.gte('week_start', '2026-01-01')`.

---

## VIEW da creare in Supabase

### 1. analytics_iscritti
Iscritti per settimana.

```sql
CREATE VIEW analytics_iscritti AS
SELECT
  DATE_TRUNC('week', created_at)::date as week_start,
  COUNT(*) as iscritti
FROM profiles
GROUP BY DATE_TRUNC('week', created_at);
```

---

### 2. analytics_attivazione_retention
Iscritti, attivati, retention 7gg e 30gg per settimana.

```sql
CREATE VIEW analytics_attivazione_retention AS
WITH primo_workout AS (
  SELECT
    user_id,
    MIN(date) as data_primo
  FROM workout_sessions
  GROUP BY user_id
),
coorti AS (
  SELECT
    DATE_TRUNC('week', p.created_at)::date as week_start,
    p.id as user_id,
    pw.data_primo
  FROM profiles p
  LEFT JOIN primo_workout pw ON pw.user_id = p.id
)
SELECT
  c.week_start,
  COUNT(DISTINCT c.user_id) as iscritti,
  COUNT(DISTINCT c.data_primo) as attivati,
  COUNT(DISTINCT CASE
    WHEN ws7.user_id IS NOT NULL THEN c.user_id
  END) as ritornati_7gg,
  COUNT(DISTINCT CASE
    WHEN ws30.user_id IS NOT NULL THEN c.user_id
  END) as ritornati_30gg
FROM coorti c
LEFT JOIN workout_sessions ws7
  ON ws7.user_id = c.user_id
  AND ws7.date > c.data_primo
  AND ws7.date <= c.data_primo + INTERVAL '7 days'
LEFT JOIN workout_sessions ws30
  ON ws30.user_id = c.user_id
  AND ws30.date > c.data_primo
  AND ws30.date <= c.data_primo + INTERVAL '30 days'
GROUP BY c.week_start;
```

**Calcolo percentuali nella dashboard:**
- Attivazione % = attivati / iscritti * 100
- Retention 7gg % = ritornati_7gg / attivati * 100
- Retention 30gg % = ritornati_30gg / attivati * 100

---

### 3. analytics_engagement
Metriche engagement per settimana.

```sql
CREATE VIEW analytics_engagement AS
SELECT
  DATE_TRUNC('week', ws.date)::date as week_start,
  COUNT(*) as totale_workout,
  COUNT(DISTINCT ws.user_id) as utenti_attivi,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT ws.user_id), 0), 2) as workout_per_utente,
  ROUND(AVG(ws.duration)::numeric, 0) as durata_media_sec,
  ROUND(AVG(ws.total_pushups)::numeric, 1) as pushup_medi,
  ROUND(AVG(ws.average_quality)::numeric, 1) as qualita_media,
  COUNT(*) FILTER (WHERE ws.workout_card_id IS NULL) as workout_free,
  COUNT(*) FILTER (WHERE ws.workout_card_id IS NOT NULL) as workout_guided,
  COUNT(*) FILTER (WHERE wc.is_preset = true) as workout_preset,
  COUNT(*) FILTER (WHERE wc.is_preset = false) as workout_custom
FROM workout_sessions ws
LEFT JOIN workout_cards wc ON wc.id = ws.workout_card_id
GROUP BY DATE_TRUNC('week', ws.date);
```

---

### 4. analytics_comportamento_orario
Distribuzione workout per ora del giorno (globale, filtrabile per periodo).

```sql
CREATE VIEW analytics_comportamento_orario AS
SELECT
  DATE_TRUNC('week', date)::date as week_start,
  EXTRACT(hour FROM date)::integer as ora,
  COUNT(*) as workout
FROM workout_sessions
GROUP BY DATE_TRUNC('week', date), EXTRACT(hour FROM date);
```

---

### 5. analytics_comportamento_giorni
Distribuzione workout per giorno della settimana (globale, filtrabile per periodo).

```sql
CREATE VIEW analytics_comportamento_giorni AS
SELECT
  DATE_TRUNC('week', date)::date as week_start,
  EXTRACT(dow FROM date)::integer as giorno_num,
  CASE EXTRACT(dow FROM date)
    WHEN 0 THEN 'Domenica'
    WHEN 1 THEN 'Lunedi'
    WHEN 2 THEN 'Martedi'
    WHEN 3 THEN 'Mercoledi'
    WHEN 4 THEN 'Giovedi'
    WHEN 5 THEN 'Venerdi'
    WHEN 6 THEN 'Sabato'
  END as giorno,
  COUNT(*) as workout
FROM workout_sessions
GROUP BY DATE_TRUNC('week', date), EXTRACT(dow FROM date);
```

---

## Come usare le VIEW dalla dashboard

```typescript
// Tutti i dati
const { data } = await supabase.from('analytics_engagement').select('*');

// Filtro per periodo
const { data } = await supabase
  .from('analytics_attivazione_retention')
  .select('*')
  .gte('week_start', '2026-01-01')
  .lte('week_start', '2026-01-31')
  .order('week_start', { ascending: false });

// Aggregare un mese intero (somma nella dashboard)
const totaleIscritti = data.reduce((sum, row) => sum + row.iscritti, 0);
const totaleAttivati = data.reduce((sum, row) => sum + row.attivati, 0);
const attivazionePct = (totaleAttivati / totaleIscritti) * 100;
```

---

## Riepilogo VIEW

| VIEW | Dati | Raggruppamento |
|------|------|----------------|
| `analytics_iscritti` | iscritti | per settimana |
| `analytics_attivazione_retention` | iscritti, attivati, ritornati_7gg, ritornati_30gg | per settimana |
| `analytics_engagement` | workout, utenti, durata, pushup, qualità, free/guided | per settimana |
| `analytics_comportamento_orario` | workout per ora | per settimana + ora |
| `analytics_comportamento_giorni` | workout per giorno | per settimana + giorno |
