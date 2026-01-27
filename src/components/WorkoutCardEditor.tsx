import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ModernCard } from './ModernCard';
import { haptics } from '../utils/haptics';
import { ConfirmDialog } from './ConfirmDialog';
import { colors } from '../theme';

interface WorkoutCardEditorProps {
  initialName?: string;
  initialSets?: number;
  initialReps?: number;
  initialRestTime?: number;
  initialVariant?: string;
  onSave: (data: {
    name: string;
    sets: number;
    repsPerSet: number;
    restTime: number;
    variant?: string;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;

export const WorkoutCardEditor: React.FC<WorkoutCardEditorProps> = ({
  initialName = '',
  initialSets = 3,
  initialReps = 10,
  initialRestTime = 60,
  initialVariant = '',
  onSave,
  onCancel,
  onDelete,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [sets, setSets] = useState(initialSets);
  const [reps, setReps] = useState(initialReps);
  const [restTime, setRestTime] = useState(initialRestTime);
  const [variant, setVariant] = useState(initialVariant);
  const [mainScrollEnabled, setMainScrollEnabled] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const repsScrollRef = useRef<ScrollView>(null);
  const restTimeScrollRef = useRef<ScrollView>(null);
  const lastVibratedRepsRef = useRef<number>(initialReps);
  const lastVibratedRestTimeRef = useRef<number>(initialRestTime);

  // Genera array di numeri per i wheel picker
  const repsOptions = Array.from({ length: 50 }, (_, i) => i + 1); // 1-50
  const restTimeOptions = Array.from({ length: 24 }, (_, i) => (i + 1) * 15); // 15s-360s (6min)

  // Inizializza la posizione dei wheel picker
  useEffect(() => {
    // Aspetta che il layout sia completo
    setTimeout(() => {
      const repsIndex = repsOptions.indexOf(reps);
      const restTimeIndex = restTimeOptions.indexOf(restTime);

      if (repsIndex !== -1 && repsScrollRef.current) {
        repsScrollRef.current.scrollTo({
          y: repsIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (restTimeIndex !== -1 && restTimeScrollRef.current) {
        restTimeScrollRef.current.scrollTo({
          y: restTimeIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 100);
  }, []);

  const handleRepsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selectedValue = repsOptions[index];
    if (selectedValue !== undefined && selectedValue !== lastVibratedRepsRef.current) {
      haptics.selection();
      lastVibratedRepsRef.current = selectedValue;
    }
  };

  const handleRepsScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selectedValue = repsOptions[index];
    if (selectedValue !== undefined && selectedValue !== reps) {
      setReps(selectedValue);
      lastVibratedRepsRef.current = selectedValue;
    }
  };

  const handleRestTimeScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selectedValue = restTimeOptions[index];
    if (selectedValue !== undefined && selectedValue !== lastVibratedRestTimeRef.current) {
      haptics.selection();
      lastVibratedRestTimeRef.current = selectedValue;
    }
  };

  const handleRestTimeScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selectedValue = restTimeOptions[index];
    if (selectedValue !== undefined && selectedValue !== restTime) {
      setRestTime(selectedValue);
      lastVibratedRestTimeRef.current = selectedValue;
    }
  };

  // Controlla se i dati sono stati modificati
  const hasChanges = () => {
    return (
      name !== initialName ||
      sets !== initialSets ||
      reps !== initialReps ||
      restTime !== initialRestTime ||
      variant !== initialVariant
    );
  };

  const handleSaveAttempt = () => {
    if (!name.trim()) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    setTimeout(() => {
      onSave({
        name: name.trim(),
        sets,
        repsPerSet: reps,
        restTime,
        variant: variant.trim() || undefined,
      });
    }, 50);
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
  };

  const handleDeleteAttempt = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    setTimeout(() => {
      if (onDelete) {
        onDelete();
      }
    }, 50);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const incrementSets = () => {
    haptics.selection();
    setSets(prev => Math.min(prev + 1, 20));
  };
  const decrementSets = () => {
    haptics.selection();
    setSets(prev => Math.max(prev - 1, 1));
  };

  const formatRestTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderWheelPickerItem = (
    value: number,
    isSelected: boolean,
    formatter?: (val: number) => string
  ) => {
    const displayValue = formatter ? formatter(value) : value.toString();
    return (
      <View
        key={value}
        style={styles.wheelItem}
      >
        <Text
          style={[
            styles.wheelItemText,
            isSelected && styles.wheelItemTextSelected,
          ]}
        >
          {displayValue}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header con paddingTop per safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={28} color={colors.gray500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {initialName ? t('cards.editCard') : t('cards.create')}
        </Text>
        {!initialName || hasChanges() ? (
          <TouchableOpacity
            onPress={handleSaveAttempt}
            style={[styles.headerButton, !name.trim() && styles.headerButtonDisabled]}
            disabled={!name.trim()}
          >
            <MaterialCommunityIcons
              name={initialName ? "pencil" : "check"}
              size={28}
              color={name.trim() ? (initialName ? colors.gray500 : colors.black) : colors.gray400}
            />
          </TouchableOpacity>
        ) : (
          onDelete && (
            <TouchableOpacity
              onPress={handleDeleteAttempt}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={28} color={colors.error} />
            </TouchableOpacity>
          )
        )}
      </View>

      <ScrollView
        ref={mainScrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={mainScrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nome Scheda */}
        <ModernCard style={styles.nameCard}>
          <TextInput
            style={styles.nameInput}
            placeholder={t('cards.cardNamePlaceholder')}
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
          />
        </ModernCard>

        {/* Serie Counter */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('cards.sets')}</Text>
        </View>
        <ModernCard style={styles.counterCard}>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              onPress={decrementSets}
              style={[styles.counterButton, sets <= 1 && styles.counterButtonDisabled]}
              disabled={sets <= 1}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={32}
                color={sets <= 1 ? colors.gray200 : colors.gray500}
              />
            </TouchableOpacity>

            <View style={styles.counterValueContainer}>
              <Text style={styles.counterValue}>{sets}</Text>
              <Text style={styles.counterUnit}>{t('cards.sets')}</Text>
            </View>

            <TouchableOpacity
              onPress={incrementSets}
              style={[styles.counterButton, sets >= 20 && styles.counterButtonDisabled]}
              disabled={sets >= 20}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={32}
                color={sets >= 20 ? colors.gray200 : colors.gray500}
              />
            </TouchableOpacity>
          </View>
        </ModernCard>

        {/* Ripetizioni e Pausa con Wheel Picker */}
        <View style={styles.wheelPickersContainer}>
          {/* Ripetizioni */}
          <View style={styles.wheelPickerSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('cards.reps')}</Text>
            </View>
            <ModernCard style={styles.wheelPickerCard}>
              <View
                style={styles.wheelPickerWrapper}
                onStartShouldSetResponder={() => {
                  setMainScrollEnabled(false);
                  return false;
                }}
                onResponderRelease={() => {
                  setTimeout(() => setMainScrollEnabled(true), 100);
                }}
              >
                <View style={styles.wheelPickerHighlight} />
                <ScrollView
                  ref={repsScrollRef}
                  style={styles.wheelPicker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  onScroll={handleRepsScroll}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={handleRepsScrollEnd}
                  onScrollBeginDrag={() => setMainScrollEnabled(false)}
                  onScrollEndDrag={(e) => {
                    handleRepsScrollEnd(e);
                    setTimeout(() => setMainScrollEnabled(true), 100);
                  }}
                  contentContainerStyle={styles.wheelPickerContent}
                  nestedScrollEnabled={true}
                >
                  {/* Padding items top */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                  {repsOptions.map(value =>
                    renderWheelPickerItem(value, value === reps)
                  )}
                  {/* Padding items bottom */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                </ScrollView>
              </View>
            </ModernCard>
          </View>

          {/* Pausa */}
          <View style={styles.wheelPickerSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('cards.rest')}</Text>
            </View>
            <ModernCard style={styles.wheelPickerCard}>
              <View
                style={styles.wheelPickerWrapper}
                onStartShouldSetResponder={() => {
                  setMainScrollEnabled(false);
                  return false;
                }}
                onResponderRelease={() => {
                  setTimeout(() => setMainScrollEnabled(true), 100);
                }}
              >
                <View style={styles.wheelPickerHighlight} />
                <ScrollView
                  ref={restTimeScrollRef}
                  style={styles.wheelPicker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  onScroll={handleRestTimeScroll}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={handleRestTimeScrollEnd}
                  onScrollBeginDrag={() => setMainScrollEnabled(false)}
                  onScrollEndDrag={(e) => {
                    handleRestTimeScrollEnd(e);
                    setTimeout(() => setMainScrollEnabled(true), 100);
                  }}
                  contentContainerStyle={styles.wheelPickerContent}
                  nestedScrollEnabled={true}
                >
                  {/* Padding items top */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                  {restTimeOptions.map(value =>
                    renderWheelPickerItem(value, value === restTime, formatRestTime)
                  )}
                  {/* Padding items bottom */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                </ScrollView>
              </View>
            </ModernCard>
          </View>
        </View>

        {/* Variante (opzionale) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('cards.notesOptional')}</Text>
        </View>
        <ModernCard style={styles.variantCard}>
          <TextInput
            style={styles.variantInput}
            placeholder={t('cards.notesPlaceholder')}
            placeholderTextColor={colors.gray400}
            value={variant}
            onChangeText={setVariant}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </ModernCard>
      </ScrollView>

      {/* Dialog Conferma Salvataggio */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title={initialName ? t('cards.saveChanges') : t('cards.createCard')}
        message={initialName ? t('cards.saveChangesMessage') : t('cards.createCardMessage')}
        confirmText={initialName ? t('common.save') : t('cards.create')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        icon="check-circle-outline"
        iconColor={colors.success}
        confirmButtonColor={colors.black}
      />

      {/* Dialog Conferma Eliminazione */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title={t('cards.deleteCard')}
        message={t('cards.deleteConfirm', { name })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        icon="trash-can-outline"
        iconColor={colors.error}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  nameCard: {
    padding: 20,
    marginBottom: 32,
  },
  nameInput: {
    fontSize: 32,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    textAlign: 'center',
  },
  counterCard: {
    padding: 24,
    marginBottom: 32,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.3,
  },
  counterValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 64,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    lineHeight: 72,
  },
  counterUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray500,
    marginTop: 4,
  },
  wheelPickersContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  wheelPickerSection: {
    flex: 1,
  },
  wheelPickerCard: {
    padding: 0,
    overflow: 'hidden',
  },
  wheelPickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
  },
  wheelPicker: {
    flex: 1,
  },
  wheelPickerContent: {
    alignItems: 'center',
  },
  wheelPickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.primary,
    opacity: 0.2,
    borderRadius: 12,
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wheelItemText: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray200,
  },
  wheelItemTextSelected: {
    fontSize: 24,
    color: colors.black,
  },
  variantCard: {
    padding: 20,
  },
  variantInput: {
    fontSize: 16,
    color: colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
