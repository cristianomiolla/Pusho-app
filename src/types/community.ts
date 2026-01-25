// Types per la sezione Community

// Badge assegnati agli utenti in base ai loro risultati
export type BadgeType =
  | 'fire'           // 🔥 Utente molto attivo
  | 'brick'          // 🧱 Costruttore (costante)
  | 'trophy'         // 🏆 Campione
  | 'star'           // ⭐ Rising star
  | 'lightning'      // ⚡ Veloce
  | 'target';        // 🎯 Preciso (alta qualità)

// Periodo di visualizzazione statistiche
export type CommunityPeriod = 'today' | 'week' | 'month';

// Raggio geografico per la ricerca
export type LocationRadius =
  | '5km'            // 5 chilometri
  | 'city'           // Tutta la città
  | 'region';        // Regione

// Posizione geografica dell'utente o area selezionata
export interface Location {
  city: string;                    // Nome città (es. "Milano")
  region?: string;                 // Regione (es. "Lombardia")
  country?: string;                // Nazione (es. "Italia")
  coordinates?: {                  // Coordinate GPS (opzionale)
    latitude: number;
    longitude: number;
  };
}

// Utente della community
export interface CommunityUser {
  id: string;
  nickname: string;                // Nome visualizzato
  avatar?: string;                 // URL avatar (opzionale)
  totalPushups: number;            // Push-up totali nel periodo
  mainBadge: BadgeType;            // Badge principale
  location: Location;              // Posizione
  joinDate: Date;                  // Data iscrizione
  sessionsCount?: number;          // Numero sessioni (opzionale)
  averageQuality?: number;         // Qualità media 0-100 (opzionale)
}

// Entry nella leaderboard
export interface LeaderboardEntry {
  position: number;                // Posizione in classifica (1-indexed)
  user: CommunityUser;             // Dati utente
  pushups: number;                 // Push-up nel periodo
  variation?: number;              // Variazione rispetto periodo precedente (opzionale)
  isCurrentUser?: boolean;         // True se è l'utente corrente
}

// Leaderboard completa
export interface Leaderboard {
  period: CommunityPeriod;         // Periodo di riferimento
  location: Location;              // Area geografica
  radius: LocationRadius;          // Raggio di ricerca
  totalUsers: number;              // Totale utenti nell'area
  entries: LeaderboardEntry[];     // Top utenti
  currentUserEntry?: LeaderboardEntry; // Entry utente corrente (se fuori top)
  updatedAt: Date;                 // Ultimo aggiornamento
}

// Ranking personale dell'utente
export interface UserRanking {
  position: number;                // Posizione attuale
  totalUsers: number;              // Totale utenti nell'area
  pushups: number;                 // Push-up nel periodo
  nextPosition?: {                 // Info sulla posizione successiva (opzionale)
    position: number;
    pushupsDifference: number;     // Push-up mancanti
  };
  previousPosition?: {             // Info sulla posizione precedente (opzionale)
    position: number;
    pushupsDifference: number;     // Push-up di vantaggio
  };
  percentile: number;              // Percentile (0-100)
  motivationalMessage?: string;    // Messaggio motivazionale generato
}

// Sfida locale automatica
export interface LocalChallenge {
  id: string;
  title: string;                   // Titolo sfida (es. "Milano - 10.000 push-up in 7 giorni")
  emoji: string;                   // Emoji rappresentativa (es. "🔥")
  location: Location;              // Città/area della sfida
  targetPushups: number;           // Obiettivo collettivo
  currentPushups: number;          // Progresso attuale
  startDate: Date;                 // Data inizio
  endDate: Date;                   // Data fine
  participants: number;            // Numero partecipanti
  isParticipating: boolean;        // True se utente sta partecipando
  userContribution?: number;       // Push-up contribuiti dall'utente (opzionale)
}

// Pusher in spotlight (evidenziato della settimana)
export interface SpotlightUser {
  user: CommunityUser;             // Dati utente
  reason: string;                  // Motivo evidenziazione (es. "Miglior miglioramento")
  highlightStats: {                // Statistiche evidenziate
    label: string;                 // Label (es. "Si allena 4 volte a settimana")
    value?: string | number;       // Valore (opzionale)
  }[];
  period: CommunityPeriod;         // Periodo di riferimento
  achievement?: string;            // Achievement speciale (opzionale)
}

// Dati completi della Community per la schermata
export interface CommunityData {
  location: Location;              // Posizione corrente
  period: CommunityPeriod;         // Periodo selezionato
  radius: LocationRadius;          // Raggio selezionato
  leaderboard: Leaderboard;        // Top pushers
  userRanking: UserRanking;        // Ranking personale
  challenges: LocalChallenge[];    // Sfide locali attive
  spotlight?: SpotlightUser;       // Pusher in evidenza (opzionale)
}
