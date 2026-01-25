import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { haptics } from '../utils/haptics';
import { ModernCard } from './ModernCard';
import { SlotMachineNumber } from './SlotMachineNumber';
import { WorkoutSession, WorkoutStats, FilterPeriod } from '../types/workout';

interface HistoryTabProps {
  sessions: WorkoutSession[];
  stats: WorkoutStats;
  isActive?: boolean;
  ListHeaderComponent?: React.ReactNode;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sessions, stats, ListHeaderComponent }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  const [animationTrigger, setAnimationTrigger] = useState(-1);
  const [filterContainerWidth, setFilterContainerWidth] = useState(0);
  const filterTranslateX = React.useRef(new Animated.Value(0)).current;

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [customStartDate, setCustomStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Attiva l'animazione solo al primo mount del componente
  useEffect(() => {
    // Piccolo delay per garantire che tutti i componenti siano montati
    const timeout = setTimeout(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  // Filtra le sessioni in base al periodo selezionato
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1); // Fine giornata oggi

    switch (filterPeriod) {
      case 'week':
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startOfToday);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'custom':
        startDate = new Date(customStartDate.getFullYear(), customStartDate.getMonth(), customStartDate.getDate());
        endDate = new Date(customEndDate.getFullYear(), customEndDate.getMonth(), customEndDate.getDate(), 23, 59, 59);
        break;
      default:
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 7);
    }

    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }, [sessions, filterPeriod, customStartDate, customEndDate]);

  // Handler per il date picker
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      if (datePickerMode === 'start') {
        setCustomStartDate(selectedDate);
        // Se la data di inizio è dopo quella di fine, aggiorna anche la fine
        if (selectedDate > customEndDate) {
          setCustomEndDate(selectedDate);
        }
      } else {
        setCustomEndDate(selectedDate);
        // Se la data di fine è prima di quella di inizio, aggiorna anche l'inizio
        if (selectedDate < customStartDate) {
          setCustomStartDate(selectedDate);
        }
      }
    }
  };

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const formatDateShort = (date: Date): string => {
    const locale = i18n.language === 'it' ? 'it-IT' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const sessionDate = new Date(date);

    // Confronta le date a livello di giorno (ignora ore/minuti/secondi)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sessionStart = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    const diffTime = todayStart.getTime() - sessionStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('history.today');
    if (diffDays === 1) return t('history.yesterday');
    if (diffDays > 1 && diffDays < 7) return t('history.daysAgo', { count: diffDays });

    // Se più vecchio di un anno, mostra anche l'anno
    const includeYear = diffDays > 365;
    const locale = i18n.language === 'it' ? 'it-IT' : 'en-US';

    return sessionDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      ...(includeYear && { year: 'numeric' })
    });
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return '#34C759';
    if (quality >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const filterButtons: { period: FilterPeriod; label: string }[] = [
    { period: 'week', label: t('history.week') },
    { period: 'month', label: t('history.month') },
    { period: 'custom', label: t('history.custom') },
  ];

  const segmentWidth = filterContainerWidth / filterButtons.length;

  // Anima il background del filtro attivo
  useEffect(() => {
    if (filterContainerWidth > 0) {
      const activeIndex = filterButtons.findIndex(btn => btn.period === filterPeriod);

      Animated.spring(filterTranslateX, {
        toValue: activeIndex * segmentWidth,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  }, [filterPeriod, filterContainerWidth, segmentWidth, filterTranslateX, filterButtons]);

  // Calcolo dinamico padding bottom per tab bar
  const tabBarTotalHeight = 80 + (insets.bottom > 0 ? insets.bottom : 10) + 10;
  const scrollPaddingBottom = tabBarTotalHeight + 20;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
    >
      {/* Header Component (se presente) */}
      {ListHeaderComponent}

      {/* Sezione Statistiche */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{t('history.statistics')}</Text>

        {/* Card Panoramica Compatta */}
        <ModernCard style={styles.overviewCard}>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Ionicons name="barbell-outline" size={18} color="#666" />
              <View style={styles.numberContainer}>
                <SlotMachineNumber
                  key={`total-${animationTrigger}`}
                  value={stats.totalPushups}
                  style={styles.overviewValue}
                  trigger={animationTrigger}
                />
              </View>
              <Text style={styles.overviewLabel}>{t('history.totalPushups')}</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Ionicons name="trophy-outline" size={18} color="#666" />
              <View style={styles.numberContainer}>
                <SlotMachineNumber
                  key={`max-${animationTrigger}`}
                  value={stats.maxInSingleSet}
                  style={styles.overviewValue}
                  trigger={animationTrigger}
                />
              </View>
              <Text style={styles.overviewLabel}>{t('history.maxPerSet')}</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <View style={styles.numberContainer}>
                <View style={styles.timeContainer}>
                  {Math.floor(stats.totalTimeUnderTension / 3600) > 0 && (
                    <>
                      <SlotMachineNumber
                        key={`hours-${animationTrigger}`}
                        value={Math.floor(stats.totalTimeUnderTension / 3600)}
                        style={styles.overviewValue}
                        trigger={animationTrigger}
                      />
                      <Text style={styles.timeUnit}>h</Text>
                    </>
                  )}
                  <SlotMachineNumber
                    key={`minutes-${animationTrigger}`}
                    value={Math.floor((stats.totalTimeUnderTension % 3600) / 60)}
                    style={styles.overviewValue}
                    trigger={animationTrigger}
                  />
                  <Text style={styles.timeUnit}>m</Text>
                </View>
              </View>
              <Text style={styles.overviewLabel}>{t('history.totalTime')}</Text>
            </View>
          </View>
        </ModernCard>

        {/* Card Statistiche Aggiuntive */}
        <ModernCard style={styles.additionalStatsCard}>
          <View style={styles.additionalStatsGrid}>
            <View style={styles.additionalStatItem}>
              <View style={styles.additionalStatContent}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.additionalStatText}>
                  <View style={styles.additionalStatValueContainer}>
                    <SlotMachineNumber
                      key={`sessions-${animationTrigger}`}
                      value={stats.totalSessions}
                      style={styles.additionalStatValue}
                      trigger={animationTrigger}
                    />
                  </View>
                  <Text style={styles.additionalStatLabel}>{t('history.sessions')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.additionalStatDivider} />

            <View style={styles.additionalStatItem}>
              <View style={styles.additionalStatContent}>
                <Ionicons name="star-outline" size={20} color="#666" />
                <View style={styles.additionalStatText}>
                  <View style={styles.additionalStatValueContainer}>
                    <SlotMachineNumber
                      key={`quality-${animationTrigger}`}
                      value={stats.averageQuality}
                      style={styles.additionalStatValue}
                      trigger={animationTrigger}
                    />
                    <Text style={styles.additionalStatPercentSymbol}>%</Text>
                  </View>
                  <Text style={styles.additionalStatLabel}>{t('history.avgQuality')}</Text>
                </View>
              </View>
            </View>
          </View>
        </ModernCard>
      </View>

      {/* Sezione Attività */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>{t('history.activity')}</Text>

        {/* Filtri */}
        <View
          style={styles.filterContainer}
          onLayout={(event) => setFilterContainerWidth(event.nativeEvent.layout.width)}
        >
          {/* Background animato */}
          {filterContainerWidth > 0 && (
            <Animated.View
              style={[
                styles.filterActiveBackground,
                {
                  width: filterContainerWidth / filterButtons.length,
                  transform: [{ translateX: filterTranslateX }],
                },
              ]}
            />
          )}

          {/* Bottoni */}
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.period}
              style={styles.filterButton}
              onPress={() => {
                haptics.light();
                if (btn.period === 'custom') {
                  setShowCustomDateModal(true);
                }
                setFilterPeriod(btn.period);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filterPeriod === btn.period && styles.filterTextActive,
                ]}
              >
                {btn.period === 'custom' && filterPeriod === 'custom'
                  ? `${formatDateShort(customStartDate)} - ${formatDateShort(customEndDate)}`
                  : btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista Sessioni */}
        <View style={styles.sessionsContainer}>
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={64} color="#E5E5EA" />
              <Text style={styles.emptyText}>
                {sessions.length === 0 ? t('history.noSessionsYet') : t('history.noSessionsInPeriod')}
              </Text>
              <Text style={styles.emptySubtext}>
                {sessions.length === 0 ? t('history.startFirstWorkout') : t('history.changeFilter')}
              </Text>
            </View>
          ) : (
            filteredSessions.map((session) => {
              const isCardSession = !!session.workoutCardId;
              const sessionTitle = isCardSession && session.workoutCardName
                ? session.workoutCardName
                : t('history.freeWorkout');

              return (
                <ModernCard key={session.id} style={styles.sessionCard}>
                  {/* Header con titolo e data */}
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTitle}>{sessionTitle}</Text>
                    <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                  </View>

                  {/* Metriche come chip */}
                  <View style={styles.sessionContent}>
                    <View style={styles.chip}>
                      <Ionicons name="barbell" size={15} color="#666" />
                      <Text style={styles.chipText}>{session.totalPushups}</Text>
                    </View>

                    {isCardSession && (
                      <View style={styles.chip}>
                        <Ionicons name="repeat" size={15} color="#666" />
                        <Text style={styles.chipText}>
                          {session.completedSets || session.sets.length}
                          {session.targetSets && `/${session.targetSets}`}
                        </Text>
                      </View>
                    )}

                    <View style={styles.chip}>
                      <Ionicons name="time" size={15} color="#666" />
                      <Text style={styles.chipText}>
                        {formatDuration(session.duration)}
                      </Text>
                    </View>

                    {/* Chip qualità */}
                    <View
                      style={[
                        styles.chip,
                        styles.qualityChip,
                        { backgroundColor: getQualityColor(session.averageQuality) + '20' }
                      ]}
                    >
                      <Ionicons
                        name="star"
                        size={15}
                        color={getQualityColor(session.averageQuality)}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          { color: getQualityColor(session.averageQuality) }
                        ]}
                      >
                        {session.averageQuality}%
                      </Text>
                    </View>
                  </View>
                </ModernCard>
              );
            })
          )}
        </View>
      </View>

      {/* Modal per selezione date personalizzate */}
      <Modal
        visible={showCustomDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCustomDateModal(false)}
        >
          <View style={styles.dateModalContent} onStartShouldSetResponder={() => true}>
            {/* Icon */}
            <View style={styles.dateModalIconContainer}>
              <Ionicons name="calendar" size={48} color="#BDEEE7" />
            </View>

            {/* Title */}
            <Text style={styles.dateModalTitle}>{t('history.selectPeriod')}</Text>

            {/* Data Inizio */}
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{t('history.from')}</Text>
              <View style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.datePickerText}>
                  {customStartDate.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                {Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={customStartDate}
                    mode="date"
                    display="compact"
                    onChange={(_, date) => {
                      if (date) {
                        setCustomStartDate(date);
                        if (date > customEndDate) {
                          setCustomEndDate(date);
                        }
                      }
                    }}
                    maximumDate={new Date()}
                    locale="it-IT"
                    style={styles.iosHiddenPicker}
                  />
                )}
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={() => openDatePicker('start')}
                  />
                )}
              </View>
            </View>

            {/* Data Fine */}
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{t('history.to')}</Text>
              <View style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.datePickerText}>
                  {customEndDate.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                {Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={customEndDate}
                    mode="date"
                    display="compact"
                    onChange={(_, date) => {
                      if (date) {
                        setCustomEndDate(date);
                        if (date < customStartDate) {
                          setCustomStartDate(date);
                        }
                      }
                    }}
                    maximumDate={new Date()}
                    locale="it-IT"
                    style={styles.iosHiddenPicker}
                  />
                )}
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={() => openDatePicker('end')}
                  />
                )}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.dateModalButtonContainer}>
              <TouchableOpacity
                style={styles.dateModalCancelButton}
                onPress={() => setShowCustomDateModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateModalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateModalConfirmButton}
                onPress={() => setShowCustomDateModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateModalConfirmText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker nativo Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={datePickerMode === 'start' ? customStartDate : customEndDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  overviewCard: {
    padding: 20,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  numberContainer: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 24,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeUnit: {
    fontSize: 16,
    fontFamily: 'Agdasima-Bold',
    color: '#666',
    marginLeft: 1,
    marginRight: 4,
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  additionalStatsCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  additionalStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalStatItem: {
    flex: 1,
  },
  additionalStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  additionalStatText: {
    flex: 1,
  },
  additionalStatValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 24,
  },
  additionalStatValue: {
    fontSize: 20,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
  additionalStatPercentSymbol: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
    color: '#666',
    marginLeft: 1,
    marginBottom: -1.5,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 6,
  },
  additionalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  filterActiveBackground: {
    position: 'absolute',
    backgroundColor: '#BDEEE7',
    borderRadius: 10,
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.1,
  },
  filterTextActive: {
    color: '#000',
  },
  sessionsContainer: {
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
  sessionDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
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
  qualityChip: {
    marginLeft: 'auto',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDEEE7',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  dateModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(189, 238, 231, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateModalTitle: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    width: '100%',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 30,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  dateModalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  dateModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  dateModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dateModalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  dateModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  iosHiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
  },
});
