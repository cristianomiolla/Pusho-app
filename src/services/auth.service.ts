import { supabase } from '../config/supabase';
import i18n from '../i18n';

// Helper to get translation
const t = (key: string) => i18n.t(key);

// Validation helpers
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return t('auth.validation.emailRequired');
  }
  if (!emailRegex.test(email)) {
    return t('auth.validation.emailInvalid');
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return t('auth.validation.passwordRequired');
  }
  if (password.length < 8) {
    return t('auth.validation.passwordMinLength');
  }
  if (!/[A-Z]/.test(password)) {
    return t('auth.validation.passwordUppercase');
  }
  if (!/[a-z]/.test(password)) {
    return t('auth.validation.passwordLowercase');
  }
  if (!/[0-9]/.test(password)) {
    return t('auth.validation.passwordNumber');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return t('auth.validation.passwordSpecial');
  }
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return t('auth.validation.passwordRequired');
  }
  if (password !== confirmPassword) {
    return t('auth.validation.passwordsNoMatch');
  }
  return null;
};

export const validateNickname = (nickname: string): string | null => {
  if (!nickname) {
    return t('auth.validation.nicknameRequired');
  }
  if (nickname.length < 3) {
    return t('auth.validation.nicknameMinLength');
  }
  if (nickname.length > 20) {
    return t('auth.validation.nicknameMaxLength');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return t('auth.validation.nicknameInvalidChars');
  }
  return null;
};

// Check if email exists in auth.users
export const checkEmailExists = async (email: string): Promise<{
  exists: boolean;
  error: Error | null;
}> => {
  try {
    const { data, error } = await supabase.rpc('check_email_exists', {
      check_email: email.toLowerCase(),
    });

    if (error) {
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    return { exists: false, error: error as Error };
  }
};

// Check if nickname is available
export const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
  const { data } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('nickname', nickname)
    .single();

  return !data;
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'pusho://reset-password',
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Translate Supabase auth errors
export const translateAuthError = (error: Error): string => {
  const message = error.message.toLowerCase();

  // Nickname già in uso (errore custom da AuthContext)
  if (message.includes('nickname è già in uso') || message.includes('nickname is already taken')) {
    return t('auth.validation.nicknameTaken');
  }
  if (message.includes('invalid login credentials')) {
    return t('auth.errors.invalidCredentials');
  }
  if (message.includes('email not confirmed')) {
    return t('auth.errors.emailNotConfirmed');
  }
  if (message.includes('user already registered')) {
    return t('auth.errors.emailAlreadyUsed');
  }
  if (message.includes('database error saving new user')) {
    return t('auth.errors.databaseError');
  }
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return t('auth.errors.duplicateError');
  }
  if (message.includes('password')) {
    return t('auth.errors.invalidPassword');
  }
  if (message.includes('email')) {
    return t('auth.validation.emailInvalid');
  }
  if (message.includes('network')) {
    return t('auth.errors.networkError');
  }
  if (message.includes('too many requests')) {
    return t('auth.errors.tooManyRequests');
  }

  return t('auth.errors.genericError');
};
