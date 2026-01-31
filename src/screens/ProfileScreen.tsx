import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { colors } from '../theme';

interface ProfileScreenProps {
  onClose?: () => void;
}

export const ProfileScreen = ({ onClose }: ProfileScreenProps) => {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut, updateProfile, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showLicensesModal, setShowLicensesModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Store URLs
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pusho.app';
  const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID'; // Da configurare dopo pubblicazione

  // Form state
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Aggiorna form quando profile cambia
  React.useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
    }
  }, [profile]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content');
    }, [])
  );

  const handleSaveProfile = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validazione nickname
    if (!nickname.trim()) {
      setError(t('profile.nicknameRequired'));
      return;
    }

    if (nickname.trim().length < 3) {
      setError(t('profile.nicknameMinLength'));
      return;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await updateProfile({
        nickname: nickname.trim(),
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccessMessage(t('profile.updateSuccess'));
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(t('profile.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Ripristina i valori originali
    setNickname(profile?.nickname || '');
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setShowLogoutDialog(false);
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'it' ? 'it-IT' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleLeaveReview = () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(storeUrl);
  };

  const handleSupport = () => {
    Linking.openURL('mailto:pushoapp@gmail.com?subject=Supporto Pusho');
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async (password: string) => {
    const result = await deleteAccount(password);
    if (!result.error) {
      setShowDeleteAccountModal(false);
    }
    return result;
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header con paddingTop per safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={28} color={colors.gray500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e Nome */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.nickname || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          {!isEditing && (
            <Text style={styles.nicknameDisplay}>{profile?.nickname || t('profile.user')}</Text>
          )}
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Form / Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.information')}</Text>
            {!isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={colors.gray900} />
                <Text style={styles.editButtonText}>{t('common.edit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <>
              {/* Nickname Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile.nickname')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.nicknamePlaceholder')}
                  placeholderTextColor={colors.gray400}
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Success Message */}
              {successMessage && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.gray500} />
                <Text style={styles.infoLabel}>{t('profile.nickname')}</Text>
                <Text style={styles.infoValue}>{profile?.nickname || '-'}</Text>
              </View>

              <View style={[styles.infoRow, styles.lastRow]}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.gray500} />
                <Text style={styles.infoLabel}>{t('profile.registeredOn')}</Text>
                <Text style={styles.infoValue}>
                  {profile?.created_at ? formatDate(profile.created_at) : '-'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Impostazioni */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{t('profile.settings')}</Text>

          <TouchableOpacity style={styles.settingRow} onPress={handleLeaveReview}>
            <MaterialCommunityIcons name="star-outline" size={22} color={colors.gray700} />
            <Text style={styles.settingText}>{t('profile.leaveReview')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowPrivacyModal(true)}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.gray700} />
            <Text style={styles.settingText}>{t('profile.privacy')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowTermsModal(true)}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.gray700} />
            <Text style={styles.settingText}>{t('profile.terms')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleSupport}>
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.gray700} />
            <Text style={styles.settingText}>{t('profile.support')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowLicensesModal(true)}
          >
            <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.gray700} />
            <Text style={styles.settingText}>{t('profile.licenses')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.lastRow]}
            onPress={handleDeleteAccount}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
            <Text style={[styles.settingText, styles.deleteAccountText]}>{t('profile.deleteAccount')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
              <Text style={styles.logoutText}>{t('auth.logout')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Pusho v{Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title={t('profile.logoutConfirmTitle')}
        message={t('profile.logoutConfirmMessage')}
        confirmText={t('auth.logout')}
        cancelText={t('common.cancel')}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
        icon="logout"
        iconColor={colors.error}
        confirmButtonColor={colors.error}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteAccountModal(false)}
      />

      {/* Licenses Modal */}
      <Modal
        visible={showLicensesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLicensesModal(false)}
      >
        <View style={styles.licensesModalContainer}>
          <View style={[styles.licensesHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setShowLicensesModal(false)}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="close" size={28} color={colors.gray500} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.licenses')}</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            style={styles.licensesContent}
            contentContainerStyle={styles.licensesContentContainer}
          >
            <Text style={styles.licensesIntro}>
              {t('profile.licensesIntro')}
            </Text>

            {/* MediaPipe License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>MediaPipe</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.mediapipeDescription')}
              </Text>
              <Text style={styles.licenseType}>Apache License 2.0</Text>
              <Text style={styles.licenseCopyright}>
                Copyright 2019-2024 The MediaPipe Authors
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://www.apache.org/licenses/LICENSE-2.0')}
              >
                <Text style={styles.licenseLink}>
                  https://www.apache.org/licenses/LICENSE-2.0
                </Text>
              </TouchableOpacity>
            </View>

            {/* React Native License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>React Native</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.reactNativeDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) Meta Platforms, Inc. and affiliates
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/facebook/react-native/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/facebook/react-native
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expo License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>Expo</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.expoDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/expo/expo/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/expo/expo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Supabase License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>Supabase</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.supabaseDescription')}
              </Text>
              <Text style={styles.licenseType}>Apache License 2.0</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2020 Supabase
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/supabase/supabase/blob/master/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/supabase/supabase
                </Text>
              </TouchableOpacity>
            </View>

            {/* React Navigation License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>React Navigation</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.reactNavigationDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2017 React Navigation Contributors
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/react-navigation/react-navigation/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/react-navigation/react-navigation
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vision Camera License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>React Native Vision Camera</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.visionCameraDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2021 Marc Rousavy
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/mrousavy/react-native-vision-camera/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/mrousavy/react-native-vision-camera
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reanimated License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>React Native Reanimated</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.reanimatedDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2016 Software Mansion
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/software-mansion/react-native-reanimated/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/software-mansion/react-native-reanimated
                </Text>
              </TouchableOpacity>
            </View>

            {/* MaterialCommunityIcons License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>MaterialCommunityIcons</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.ioniconsDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2015-present Ionic
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/ionic-team/ionicons/blob/main/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/ionic-team/ionicons
                </Text>
              </TouchableOpacity>
            </View>

            {/* Agdasima Font License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>Agdasima Font</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.agdasimaDescription')}
              </Text>
              <Text style={styles.licenseType}>SIL Open Font License 1.1</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) Fonts by The Branded Quotes
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://fonts.google.com/specimen/Agdasima/about')}
              >
                <Text style={styles.licenseLink}>
                  https://fonts.google.com/specimen/Agdasima
                </Text>
              </TouchableOpacity>
            </View>

            {/* i18next License */}
            <View style={styles.licenseCard}>
              <Text style={styles.licenseTitle}>i18next</Text>
              <Text style={styles.licenseDescription}>
                {t('profile.i18nextDescription')}
              </Text>
              <Text style={styles.licenseType}>MIT License</Text>
              <Text style={styles.licenseCopyright}>
                Copyright (c) 2022 i18next
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/i18next/i18next/blob/master/LICENSE')}
              >
                <Text style={styles.licenseLink}>
                  https://github.com/i18next/i18next
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.licensesModalContainer}>
          <View style={[styles.licensesHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(false)}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="close" size={28} color={colors.gray500} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.privacyTitle')}</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            style={styles.licensesContent}
            contentContainerStyle={styles.licensesContentContainer}
          >
            <Text style={styles.privacyLastUpdated}>
              {t('profile.privacyLastUpdated')}
            </Text>
            <Text style={styles.privacyIntro}>
              {t('profile.privacyIntro')}
            </Text>

            {/* Section 1: Data Controller */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection1Text')}</Text>

            {/* Section 2: Data Collected */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection2Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.privacySection2_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection2_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.privacySection2_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection2_2Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.privacySection2_3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection2_3Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.privacySection2_4Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection2_4Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.privacySection2_5Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection2_5Text')}</Text>

            {/* Section 3: How We Use Your Data */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection3Text')}</Text>

            {/* Section 4: On-Device Processing */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection4Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection4Text')}</Text>

            {/* Section 5: Data Sharing */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection5Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection5Text')}</Text>

            {/* Section 6: International Transfers */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection6Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection6Text')}</Text>

            {/* Section 7: Data Retention */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection7Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection7Text')}</Text>

            {/* Section 8: Security */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection8Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection8Text')}</Text>

            {/* Section 9: Your Rights (GDPR) */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection9Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection9Text')}</Text>

            {/* Section 10: Account Deletion */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection10Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection10Text')}</Text>

            {/* Section 11: Minors */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection11Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection11Text')}</Text>

            {/* Section 12: App Permissions */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection12Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection12Text')}</Text>

            {/* Section 13: Cookies and Tracking */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection13Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection13Text')}</Text>

            {/* Section 14: Changes to Privacy Policy */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection14Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection14Text')}</Text>

            {/* Section 15: Contact */}
            <Text style={styles.privacySectionTitle}>{t('profile.privacySection15Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.privacySection15Text')}</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:pushoapp@gmail.com')}>
              <Text style={styles.licenseLink}>pushoapp@gmail.com</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.licensesModalContainer}>
          <View style={[styles.licensesHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="close" size={28} color={colors.gray500} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.termsTitle')}</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            style={styles.licensesContent}
            contentContainerStyle={styles.licensesContentContainer}
          >
            <Text style={styles.privacyLastUpdated}>
              {t('profile.termsLastUpdated')}
            </Text>
            <Text style={styles.privacyIntro}>
              {t('profile.termsIntro')}
            </Text>

            {/* Section 1: Service Description */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection1Text')}</Text>

            {/* Section 2: Usage Requirements */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection2Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection2_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection2_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection2_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection2_2Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection2_3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection2_3Text')}</Text>

            {/* Section 3: Code of Conduct */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection3Text')}</Text>

            {/* Section 4: Intellectual Property */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection4Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection4_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection4_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection4_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection4_2Text')}</Text>

            {/* Section 5: Service "As Is" */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection5Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection5Text')}</Text>

            {/* Section 6: Limitation of Liability */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection6Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection6_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection6_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection6_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection6_2Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection6_3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection6_3Text')}</Text>

            {/* Section 7: Account Deletion */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection7Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection7_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection7_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection7_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection7_2Text')}</Text>

            {/* Section 8: Service Availability */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection8Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection8_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection8_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection8_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection8_2Text')}</Text>

            {/* Section 9: Privacy */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection9Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection9Text')}</Text>

            {/* Section 10: Changes to Terms */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection10Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection10Text')}</Text>

            {/* Section 11: Governing Law */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection11Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection11Text')}</Text>

            {/* Section 12: General Provisions */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection12Title')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection12_1Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection12_1Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection12_2Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection12_2Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection12_3Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection12_3Text')}</Text>
            <Text style={styles.privacySubtitle}>{t('profile.termsSection12_4Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection12_4Text')}</Text>

            {/* Section 13: Contact */}
            <Text style={styles.privacySectionTitle}>{t('profile.termsSection13Title')}</Text>
            <Text style={styles.privacyText}>{t('profile.termsSection13Text')}</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:pushoapp@gmail.com')}>
              <Text style={styles.licenseLink}>pushoapp@gmail.com</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={[styles.privacyText, { marginTop: 24, fontStyle: 'italic' }]}>
              {t('profile.termsFooter')}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerButton: {
    padding: 4,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
  },
  nicknameDisplay: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.gray500,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.errorText,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: colors.transparent.success15,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray500,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.gray900,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.gray500,
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: colors.gray900,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingText: {
    fontSize: 16,
    color: colors.gray900,
    marginLeft: 12,
    flex: 1,
  },
  deleteAccountText: {
    color: colors.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 20,
  },
  licensesModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  licensesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  licensesContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  licensesContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  licensesIntro: {
    fontSize: 15,
    color: colors.gray500,
    marginBottom: 20,
    lineHeight: 22,
  },
  licenseCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  licenseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 8,
  },
  licenseDescription: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 12,
    lineHeight: 20,
  },
  licenseType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 8,
  },
  licenseCopyright: {
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 12,
  },
  licenseText: {
    fontSize: 12,
    color: colors.gray500,
    lineHeight: 18,
    marginBottom: 8,
  },
  licenseLink: {
    fontSize: 12,
    color: colors.gray900,
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  privacyLastUpdated: {
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  privacyIntro: {
    fontSize: 15,
    color: colors.gray500,
    marginBottom: 24,
    lineHeight: 22,
  },
  privacySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 20,
    marginBottom: 12,
  },
  privacySubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray700,
    marginTop: 12,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: colors.gray500,
    lineHeight: 21,
    marginBottom: 8,
  },
});
