import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { Profile } from '../types/database';

const SUPABASE_AUTH_TOKEN_KEY = 'sb-ykkurwsutpujavfjtvra-auth-token';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  pendingPasswordReset: boolean;
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  clearPasswordReset: () => void;
  deleteAccount: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);

  // Fetch user profile from database, create if missing
  const fetchProfile = async (userId: string, userMetadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Se il profilo non esiste (PGRST116), prova a crearlo
        if (error.code === 'PGRST116') {
          const nickname = (userMetadata?.nickname as string) || `user_${userId.substring(0, 8)}`;

          const { error: createError } = await supabase
            .from('profiles')
            .insert({ id: userId, nickname });

          if (createError) {
            // Se l'errore è foreign key (23503), l'utente auth non esiste
            if (createError.code === '23503') {
              return null;
            }
            // Se è un duplicate key, il profilo esiste già - riprova a leggerlo
            if (createError.code === '23505') {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              return existingProfile;
            }
            return null;
          }

          // Crea anche le stats se non esistono
          await supabase
            .from('user_stats')
            .insert({ user_id: userId });

          // Ricarica il profilo appena creato
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          return newProfile;
        }

        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  };

  // Decodifica il JWT per ottenere le info dell'utente
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Handle deep link URL for email confirmation or password recovery
  // Returns true if a valid deep link was processed
  const processDeepLink = async (url: string): Promise<boolean> => {
    if (!url) return false;

    const hashParams = url.split('#')[1];
    const queryParams = url.split('?')[1];
    const params = hashParams || queryParams;

    if (!params) return false;

    const urlParams = new URLSearchParams(params);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');

    if (!accessToken || !refreshToken) return false;

    const tokenData = parseJwt(accessToken);
    if (!tokenData) return false;

    const expiresAt = urlParams.get('expires_at');
    const sessionData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? parseInt(expiresAt) : Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: tokenData.sub,
        email: tokenData.email,
        user_metadata: tokenData.user_metadata || {},
        app_metadata: tokenData.app_metadata || {},
        aud: tokenData.aud,
        role: tokenData.role,
        created_at: '',
        updated_at: '',
      },
    };

    await AsyncStorage.setItem(
      SUPABASE_AUTH_TOKEN_KEY,
      JSON.stringify(sessionData)
    );

    const session = sessionData as unknown as Session;
    setSession(session);
    setUser(session.user);

    if (type === 'recovery') {
      setPendingPasswordReset(true);
    } else {
      const userProfile = await fetchProfile(session.user.id, session.user.user_metadata);
      setProfile(userProfile);
    }

    return true;
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl) {
          const handled = await processDeepLink(initialUrl);
          if (handled) {
            if (isMounted) {
              setIsLoading(false);
            }
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id, session.user.user_metadata);
            if (isMounted) {
              setProfile(userProfile);
            }
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id, session.user.user_metadata);
          if (isMounted) {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
      }
    );

    // Listen for deep links while app is open
    const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
      setIsLoading(true);
      try {
        await processDeepLink(url);
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      // Check if nickname is already taken
      const { data: existingProfiles, error: nicknameError } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('nickname', nickname);

      // If there's an error checking nickname (other than no results), return it
      if (nicknameError) {
        return { error: nicknameError };
      }

      // If nickname already exists, return error
      if (existingProfiles && existingProfiles.length > 0) {
        return { error: new Error('Questo nickname è già in uso') };
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Se l'utente è stato creato, crea manualmente il profilo e le stats
      if (data.user) {
        // Crea il profilo
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            nickname: nickname,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Non blocchiamo la registrazione, il profilo può essere creato dopo
        }

        // Crea le stats iniziali
        const { error: statsError } = await supabase
          .from('user_stats')
          .insert({
            user_id: data.user.id,
          });

        if (statsError) {
          console.error('Error creating user stats:', statsError);
          // Non blocchiamo la registrazione
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Clear password reset state after successful reset
  const clearPasswordReset = async () => {
    setPendingPasswordReset(false);
    // Fetch profile after password reset
    if (user) {
      const userProfile = await fetchProfile(user.id, user.user_metadata);
      setProfile(userProfile);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('Non autenticato') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Delete account with password confirmation
  const deleteAccount = async (password: string) => {
    if (!user || !user.email) {
      return { error: new Error('Non autenticato') };
    }

    try {
      // Re-authenticate user to verify password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        return { error: new Error('Password non corretta') };
      }

      // Call the RPC function to delete user and all related data
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) {
        return { error: new Error('Errore durante l\'eliminazione dell\'account') };
      }

      // Clear local state
      setProfile(null);
      setUser(null);
      setSession(null);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        pendingPasswordReset,
        signUp,
        signIn,
        signOut,
        updateProfile,
        clearPasswordReset,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
