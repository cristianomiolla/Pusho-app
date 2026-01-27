import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '../utils/haptics';
import { WorkoutCard } from '../types/workout';
import { ModernCard } from './ModernCard';

interface WorkoutCardsModalProps {
  visible: boolean;
  onClose: () => void;
  workoutCards: WorkoutCard[];
  onSelectCard: (card: WorkoutCard) => void;
  onToggleFavorite: (cardId: string) => void;
}

export const WorkoutCardsModal: React.FC<WorkoutCardsModalProps> = ({
  visible,
  onClose,
  workoutCards,
  onSelectCard,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const favoriteCards = workoutCards.filter(card => card.isFavorite);
  // Schede non preferite: prima quelle utente, poi quelle preset (base) in fondo
  const otherCards = workoutCards
    .filter(card => !card.isFavorite)
    .sort((a, b) => {
      if (a.isPreset && !b.isPreset) return 1;
      if (!a.isPreset && b.isPreset) return -1;
      return 0;
    });

  const handleSelectCard = (card: WorkoutCard) => {
    haptics.light();
    onSelectCard(card);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('workout.selectCardTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Favorite Cards */}
            {favoriteCards.length > 0 && (
              <View style={styles.favoritesSection}>
                <Text style={styles.sectionTitle}>{t('cards.favorites')}</Text>
                {favoriteCards.map(card => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onPress={() => handleSelectCard(card)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </View>
            )}

            {/* Other Cards */}
            {otherCards.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('cards.yourCards')}</Text>
                {otherCards.map(card => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onPress={() => handleSelectCard(card)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </View>
            )}

            {/* Empty State */}
            {workoutCards.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="file-document-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>{t('workout.noCardsAvailable')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('workout.createCardFromTab')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface CardItemProps {
  card: WorkoutCard;
  onPress: () => void;
  onToggleFavorite: (cardId: string) => void;
}

const formatRestTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
};

const CardItem: React.FC<CardItemProps> = ({ card, onPress, onToggleFavorite }) => {
  const { t } = useTranslation();

  const handleFavoritePress = () => {
    haptics.light();
    onToggleFavorite(card.id);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ModernCard style={styles.sessionCard}>
        {/* Header con titolo e stella preferito */}
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{card.name}</Text>
          <TouchableOpacity
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={card.isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={card.isFavorite ? '#FFD700' : '#999'}
            />
          </TouchableOpacity>
        </View>

        {/* Metriche come chip */}
        <View style={styles.sessionContent}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="arm-flex-outline" size={15} color="#666" />
            <Text style={styles.chipText}>{card.repsPerSet}</Text>
          </View>

          <View style={styles.chip}>
            <MaterialCommunityIcons name="repeat" size={15} color="#666" />
            <Text style={styles.chipText}>{card.sets}</Text>
          </View>

          <View style={styles.chip}>
            <MaterialCommunityIcons name="clock-outline" size={15} color="#666" />
            <Text style={styles.chipText}>{formatRestTime(card.restTime)}</Text>
          </View>

          {/* Chip Base */}
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
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  section: {
    paddingTop: 12,
  },
  favoritesSection: {
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
  sessionCard: {
    padding: 14,
    paddingBottom: 12,
    marginBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
});