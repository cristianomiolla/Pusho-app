import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { TabChips } from '../components/TabChips';
import { HistoryTab } from '../components/HistoryTab';
import { WorkoutCardsTab } from '../components/WorkoutCardsTab';
import { ProfileScreen } from './ProfileScreen';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { WorkoutSession, WorkoutStats, WorkoutCard } from '../types/workout';
import * as cardsService from '../services/cards.service';
import * as workoutService from '../services/workout.service';
import * as statsService from '../services/stats.service';

type MainTab = 'history' | 'cards';

export const AllenamentiScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MainTab>('history');
  const [showProfile, setShowProfile] = useState(false);
  const { profile, user, isLoading: isAuthLoading } = useAuth();
  const { shouldRefreshHome, clearHomeRefresh } = useWorkout();

  // Stati per i dati da Supabase
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WorkoutStats>({
    totalPushups: 0,
    maxInSingleSet: 0,
    totalTimeUnderTension: 0,
    totalSessions: 0,
    averageQuality: 0,
  });
  const [workoutCards, setWorkoutCards] = useState<WorkoutCard[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Carica dati da Supabase
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsDataLoading(true);

      const [cardsData, sessionsData, statsData] = await Promise.all([
        cardsService.fetchWorkoutCards(user.id),
        workoutService.fetchWorkoutSessions(user.id, { limit: 20 }),
        statsService.fetchUserStats(user.id),
      ]);

      setWorkoutCards(cardsData);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      // Silent fail - data will be empty
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  // Carica dati al mount e quando lo schermo diventa attivo
  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      // Ricarica dati solo se un allenamento è stato salvato
      if (shouldRefreshHome) {
        loadData();
        clearHomeRefresh();
      }
    }, [shouldRefreshHome, loadData, clearHomeRefresh])
  );

  const mainTabs = [
    { id: 'history', label: t('home.activityTab'), icon: 'lightning-bolt' as const },
    { id: 'cards', label: t('home.cardsTab'), icon: 'file-document-outline' as const },
  ];

  const handleAddCard = async (newCard: Omit<WorkoutCard, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const createdCard = await cardsService.createWorkoutCard(newCard, user.id);
      setWorkoutCards(prev => [createdCard, ...prev]);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleToggleFavorite = async (cardId: string) => {
    const card = workoutCards.find(c => c.id === cardId);
    if (!card) return;

    try {
      await cardsService.toggleCardFavorite(cardId, !card.isFavorite);
      setWorkoutCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c))
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await cardsService.deleteWorkoutCard(cardId);
      setWorkoutCards(prev => prev.filter(c => c.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleEditCard = async (cardId: string, updatedData: Omit<WorkoutCard, 'id' | 'createdAt'>) => {
    try {
      const updatedCard = await cardsService.updateWorkoutCard(cardId, updatedData);
      setWorkoutCards(prev =>
        prev.map(c => (c.id === cardId ? updatedCard : c))
      );
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };


  // Mostra loading solo durante il caricamento auth iniziale o dei dati
  if (isAuthLoading || isDataLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BDEEE7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Profile Modal */}
        <Modal
          visible={showProfile}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowProfile(false)}
        >
          <ProfileScreen onClose={() => setShowProfile(false)} />
        </Modal>

        {/* Header fisso */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting', { nickname: profile?.nickname || 'Atleta' })}</Text>
            <Text style={styles.subtitle}>{t('home.readyToTrain')}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setShowProfile(true)}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {(profile?.nickname || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher fisso - singola istanza */}
        <TabChips
          tabs={mainTabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as MainTab)}
        />

        {/* Content - entrambi i tab sono sempre montati per preservare lo stato */}
        <View style={styles.content}>
          <View style={[styles.tabContent, activeTab !== 'history' && styles.hiddenTab]}>
            <HistoryTab
              sessions={sessions}
              stats={stats}
              isActive={activeTab === 'history'}
            />
          </View>
          <View style={[styles.tabContent, activeTab !== 'cards' && styles.hiddenTab]}>
            <WorkoutCardsTab
              workoutCards={workoutCards}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onToggleFavorite={handleToggleFavorite}
              onDeleteCard={handleDeleteCard}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  avatarButton: {
    padding: 4,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#BDEEE7',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  hiddenTab: {
    display: 'none',
  },
});
