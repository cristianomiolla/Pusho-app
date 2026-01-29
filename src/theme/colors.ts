/**
 * Pusho Color Palette
 *
 * Questo file centralizza tutti i colori dell'app.
 * Usare SEMPRE queste costanti invece di valori hardcoded.
 */

export const colors = {
  // ============================================
  // PRIMARY BRAND COLORS
  // ============================================
  primary: '#BDEEE7', // Mint/Cyan - Colore principale dell'app
  primaryDark: '#5BBFB3', // Teal scuro per gradienti e testi su sfondi chiari

  // ============================================
  // NEUTRAL COLORS
  // ============================================
  black: '#181818',
  white: '#FFFFFF',

  // Grigi scuri (per testi e sfondi dark)
  gray900: '#181818', // Quasi nero - sfondo dark, testi principali
  gray800: '#2C2C2E', // Tab bar background, card scure
  gray700: '#444444', // Testi scuri, icone settings
  gray500: '#666666', // Testi secondari, icone
  gray400: '#999999', // Testi terziari, placeholder, icone disabled

  // Grigi chiari (per sfondi e bordi)
  gray200: '#E5E5EA', // Bordi, divider lines
  gray100: '#F5F5F7', // Sfondi chip/card light, contenitori

  // Alias semantici
  background: '#F2F2F7', // Sfondo principale app (alias di gray100)

  // ============================================
  // SEMANTIC COLORS - Quality/Feedback (iOS style)
  // ============================================
  success: '#34C759', // Verde iOS - qualità alta
  warning: '#FF9500', // Arancione iOS - qualità media
  error: '#FF3B30', // Rosso iOS - errori, stop, delete
  errorText: '#D32F2F', // Rosso scuro per testi errore

  // Special
  gold: '#FFD700', // Oro - stelle, trofei, premium

  // ============================================
  // TRANSPARENT COLORS
  // ============================================
  transparent: {
    // Nero con trasparenza
    black10: 'rgba(0, 0, 0, 0.1)',
    black30: 'rgba(0, 0, 0, 0.3)',
    black50: 'rgba(0, 0, 0, 0.5)', // Overlay modal
    black60: 'rgba(0, 0, 0, 0.6)',
    black80: 'rgba(0, 0, 0, 0.8)',

    // Bianco con trasparenza
    white05: 'rgba(255, 255, 255, 0.05)',
    white08: 'rgba(255, 255, 255, 0.08)',
    white50: 'rgba(255, 255, 255, 0.5)',
    white60: 'rgba(255, 255, 255, 0.6)',
    white70: 'rgba(255, 255, 255, 0.7)',
    white80: 'rgba(255, 255, 255, 0.8)',
    white90: 'rgba(255, 255, 255, 0.9)',

    // Primary (Mint) con trasparenza
    primary05: 'rgba(189, 238, 231, 0.05)',
    primary08: 'rgba(189, 238, 231, 0.08)',
    primary10: 'rgba(189, 238, 231, 0.1)',
    primary15: 'rgba(189, 238, 231, 0.15)',
    primary20: 'rgba(189, 238, 231, 0.2)',
    primary30: 'rgba(189, 238, 231, 0.3)',
    primary50: 'rgba(189, 238, 231, 0.5)',
    primary60: 'rgba(189, 238, 231, 0.6)',

    // Rosso con trasparenza
    error10: 'rgba(255, 59, 48, 0.1)',
    error15: 'rgba(255, 59, 48, 0.15)',
    error20: 'rgba(255, 59, 48, 0.2)',
    error40: 'rgba(255, 59, 48, 0.4)',
    error90: 'rgba(255, 59, 48, 0.9)',

    // Oro con trasparenza
    gold15: 'rgba(255, 215, 0, 0.15)',

    // Warning con trasparenza
    warning10: 'rgba(255, 184, 0, 0.1)',
    warning30: 'rgba(255, 184, 0, 0.3)',

    // Success con trasparenza
    success15: 'rgba(52, 199, 89, 0.15)',
  },

  // ============================================
  // LIGHT ACCENT COLORS
  // ============================================
  primaryLight: '#E6F9F7', // Mint molto chiaro per highlight
  goldLight: '#FFF4CC', // Giallo chiaro per posizione oro
  bronzeLight: '#F0DCC8', // Bronzo chiaro
  errorLight: '#FFEBEE', // Rosso chiaro per sfondi errore
};

// ============================================
// GRADIENTS
// ============================================
export const gradients = {
  primaryLight: ['#BDEEE7', '#E6F9F7'] as const, // Mint to Light Cyan
};

// ============================================
// QUALITY COLOR HELPER
// ============================================
export const getQualityColor = (quality: number): string => {
  if (quality >= 70) return colors.success;
  if (quality >= 40) return colors.warning;
  return colors.error;
};


export default colors;
