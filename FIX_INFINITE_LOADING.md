# Fix: Infinite Loading When App Resumes from Background

## Problema

Quando l'app viene messa in background e riaperta dopo un po', rimane bloccata sul loading screen infinito (quello senza navbar). L'utente doveva chiudere e riaprire l'app per accedere.

## Causa Root

Race condition in `AuthContext.tsx`:
1. `fetchProfile()` non aveva timeout e poteva bloccarsi indefinitamente
2. Se Supabase era lento o non rispondeva, `setIsLoading(false)` non veniva mai chiamato
3. Nessun listener per AppState (background/foreground transitions)

## Soluzione

### 1. Aggiungere imports e costanti

```tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Linking, AppState, AppStateStatus } from 'react-native';

// Timeout for profile fetch operations (10 seconds)
const PROFILE_FETCH_TIMEOUT = 10000;
```

### 2. Aggiungere ref e helper per timeout

```tsx
const appState = useRef(AppState.currentState);

// Helper function to add timeout to promises
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};
```

### 3. Optimistic Loading dalla cache (nella funzione `initialize`)

Dopo il check del deep link e prima di chiamare `supabase.auth.getSession()`:

```tsx
// First, try to quickly restore session from storage to minimize loading time
// This allows the app to show UI immediately while we validate in background
const storedSession = await AsyncStorage.getItem(SUPABASE_AUTH_TOKEN_KEY);
if (storedSession && isMounted) {
  try {
    const parsedSession = JSON.parse(storedSession);
    // Quick restore - show UI immediately with cached data
    if (parsedSession?.user) {
      setSession(parsedSession as Session);
      setUser(parsedSession.user as User);
      setIsLoading(false); // Stop loading immediately with cached session

      // Now validate and refresh in background (non-blocking)
      // IMPORTANT: Only clear session if we get an explicit "no session" response
      // If validation fails (network error, timeout), keep the cached session
      supabase.auth.getSession().then(async ({ data: { session: freshSession }, error }) => {
        if (!isMounted) return;

        // If there was an error getting session, keep the cached session
        // The user can continue using the app with cached data
        if (error) {
          return;
        }

        if (freshSession?.user) {
          // Session is valid, update with fresh data
          setSession(freshSession);
          setUser(freshSession.user);
          // Fetch profile in background
          try {
            const userProfile = await withTimeout(
              fetchProfile(freshSession.user.id, freshSession.user.user_metadata),
              PROFILE_FETCH_TIMEOUT
            );
            if (isMounted) {
              setProfile(userProfile);
            }
          } catch {
            // Profile fetch failed, continue without it
          }
        }
        // NOTE: We intentionally do NOT clear session if freshSession is null
        // This could happen due to network issues, and we want to keep the cached session
        // The user will be logged out only when an actual API call fails with auth error
      }).catch(() => {
        // Session validation failed (network error, etc.)
        // Keep showing UI with cached data - don't log out the user
      });
      return;
    }
  } catch {
    // Failed to parse stored session, continue with normal flow
  }
}

// No cached session or parsing failed - do normal initialization
```

### 4. Aggiungere timeout a fetchProfile nel flusso normale

```tsx
if (session?.user) {
  try {
    // Add timeout to prevent infinite loading if Supabase is slow
    const userProfile = await withTimeout(
      fetchProfile(session.user.id, session.user.user_metadata),
      PROFILE_FETCH_TIMEOUT
    );
    if (isMounted) {
      setProfile(userProfile);
    }
  } catch {
    // Profile fetch failed or timed out, continue without profile
    // The profile will be fetched on next auth state change
    if (isMounted) {
      setProfile(null);
    }
  }
}
```

### 5. AppState listener per refresh silenzioso

Dopo `initialize()`:

```tsx
// Handle app state changes (background/foreground)
const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  if (
    appState.current.match(/inactive|background/) &&
    nextAppState === 'active'
  ) {
    // App has come to foreground - silently refresh session in background
    // Don't show loading, don't block the UI - user is already logged in
    try {
      // Just trigger a session refresh, Supabase will handle token refresh automatically
      // The onAuthStateChange listener will update state if needed
      await supabase.auth.getSession();
    } catch {
      // Silent failure - user can continue using the app
      // If session is truly invalid, next API call will fail and user can re-login
    }
  }
  appState.current = nextAppState;
};

const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
```

### 6. Aggiungere timeout anche a onAuthStateChange

```tsx
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (!isMounted) return;

    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      try {
        const userProfile = await withTimeout(
          fetchProfile(session.user.id, session.user.user_metadata),
          PROFILE_FETCH_TIMEOUT
        );
        if (isMounted) {
          setProfile(userProfile);
        }
      } catch {
        // Profile fetch failed or timed out
        if (isMounted) {
          setProfile(null);
        }
      }
    } else {
      setProfile(null);
    }
  }
);
```

### 7. Cleanup dell'AppState listener

```tsx
return () => {
  isMounted = false;
  subscription.unsubscribe();
  linkingSubscription.remove();
  appStateSubscription.remove();
};
```

## Comportamento Risultante

| Scenario | Prima | Dopo |
|----------|-------|------|
| App riaperta con rete OK | Loading infinito se Supabase lento | UI immediata, refresh in background |
| App riaperta senza rete | Loading infinito | UI immediata con dati cached |
| Sessione scaduta | Loading infinito | UI con cached data, logout solo su API error |

## Note Importanti

- **Mai disconnettere l'utente** durante la validazione in background
- L'utente viene disconnesso solo quando una vera chiamata API fallisce con errore di autenticazione
- Il timeout di 10 secondi è configurabile tramite `PROFILE_FETCH_TIMEOUT`
