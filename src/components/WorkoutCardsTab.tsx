import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { haptics } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { ModernCard } from './ModernCard';
import { WorkoutCardEditor } from './WorkoutCardEditor';
import { WorkoutCard } from '../types/workout';

interface WorkoutCardsTabProps {
  workoutCards: WorkoutCard[];
  onAddCard: (card: Omit<WorkoutCard, 'id' | 'createdAt'>) => void;
  onEditCard: (cardId: string, card: Omit<WorkoutCard, 'id' | 'createdAt'>) => void;
  onToggleFavorite: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  ListHeaderComponent?: React.ReactNode;
}

export const WorkoutCardsTab: React.FC<WorkoutCardsTabProps> = ({
  workoutCards,
  onAddCard,
  onEditCard,
  onToggleFavorite,
  onDeleteCard,
  ListHeaderComponent,
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<WorkoutCard | null>(null);
  const insets = useSafeAreaInsets();

  // Tab bar: 80px altezza + marginBottom (insets.bottom o 10px) + margine extra per sicurezza
  const tabBarTotalHeight = 80 + (insets.bottom > 0 ? insets.bottom : 10) + 10;
  // Padding per lo scroll: spazio per FAB + tab bar
  const scrollPaddingBottom = tabBarTotalHeight + 64 + 32;

  const favoriteCards = workoutCards.filter(card => card.isFavorite);
  // Schede non preferite: prima quelle utente, poi quelle preset (base) in fondo
  const nonFavoriteCards = workoutCards
    .filter(card => !card.isFavorite)
    .sort((a, b) => {
      // Preset cards vanno in fondo
      if (a.isPreset && !b.isPreset) return 1;
      if (!a.isPreset && b.isPreset) return -1;
      return 0;
    });

  const handleOpenCreateModal = () => {
    setEditingCard(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (card: WorkoutCard) => {
    setEditingCard(card);
    setShowModal(true);
  };

  const handleSaveCard = (data: {
    name: string;
    sets: number;
    repsPerSet: number;
    restTime: number;
    variant?: string;
  }) => {
    const cardPayload = {
      ...data,
      isFavorite: editingCard?.isFavorite ?? false,
    };

    if (editingCard) {
      onEditCard(editingCard.id, cardPayload);
    } else {
      onAddCard(cardPayload);
    }

    setShowModal(false);
    setEditingCard(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  const handleDeleteFromEditor = () => {
    if (editingCard) {
      onDeleteCard(editingCard.id);
      setShowModal(false);
      setEditingCard(null);
    }
  };

  const formatRestTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const renderWorkoutCard = (card: WorkoutCard) => (
    <TouchableOpacity
      key={card.id}
      onPress={() => !card.isPreset && handleOpenEditModal(card)}
      activeOpacity={card.isPreset ? 1 : 0.7}
    >
      <ModernCard style={styles.sessionCard}>
        {/* Header con titolo e stella preferito */}
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{card.name}</Text>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              onToggleFavorite(card.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={card.isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={card.isFavorite ? '#FFD700' : '#999'}
            />
          </TouchableOpacity>
        </View>

        {/* Metriche come chip */}
        <View style={styles.sessionContent}>
          <View style={styles.chip}>
            <Ionicons name="barbell" size={15} color="#666" />
            <Text style={styles.chipText}>{card.repsPerSet}</Text>
          </View>

          <View style={styles.chip}>
            <Ionicons name="repeat" size={15} color="#666" />
            <Text style={styles.chipText}>{card.sets}</Text>
          </View>

          <View style={styles.chip}>
            <Ionicons name="time" size={15} color="#666" />
            <Text style={styles.chipText}>{formatRestTime(card.restTime)}</Text>
          </View>

          {/* Chip Base al posto della qualità */}
          {card.isPreset && (
            <View style={[styles.chip, styles.presetChip]}>
              <Text style={styles.presetChipText}>{t('cards.base')}</Text>
            </View>
          )}
        </View>

        {/* Variante/descrizione */}
        {card.variant && (
          <Text style={styles.variantText} numberOfLines={2}>{card.variant}</Text>
        )}
      </ModernCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Component (se presente) */}
        {ListHeaderComponent}

        {/* Schede Preferite */}
        {favoriteCards.length > 0 && (
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>{t('cards.favorites')}</Text>
            <View style={styles.cardsContainer}>
              {favoriteCards.map(renderWorkoutCard)}
            </View>
          </View>
        )}

        {/* Tutte le Schede (utente + base in fondo) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cards.yourCards')}</Text>
          {nonFavoriteCards.length > 0 ? (
            <View style={styles.cardsContainer}>
              {nonFavoriteCards.map(renderWorkoutCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={64} color="#E5E5EA" />
              <Text style={styles.emptyText}>{t('cards.noCards')}</Text>
              <Text style={styles.emptySubtext}>
                {t('cards.createFirst')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottone Floating per Creare Scheda */}
      <TouchableOpacity
        style={[styles.fab, { bottom: tabBarTotalHeight + 16 }]}
        onPress={handleOpenCreateModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      {/* Modal Creazione/Modifica Scheda */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}
      >
        <WorkoutCardEditor
          initialName={editingCard?.name}
          initialSets={editingCard?.sets}
          initialReps={editingCard?.repsPerSet}
          initialRestTime={editingCard?.restTime}
          initialVariant={editingCard?.variant}
          onSave={handleSaveCard}
          onCancel={handleCloseModal}
          onDelete={editingCard ? handleDeleteFromEditor : undefined}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  favoritesSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardsContainer: {
    gap: 12,
  },
  sessionCard: {
    padding: 14,
    paddingBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
  },
  sessionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
    color: '#444',
  },
  presetChip: {
    marginLeft: 'auto',
    backgroundColor: '#BDEEE7',
  },
  presetChipText: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
    color: '#1A6B5C',
  },
  variantText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#BDEEE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
});
