-- ============================================
-- PUSHO DATABASE SCHEMA
-- Migration: Preset Workout Cards
-- Scheda allenamento predefinita per nuovi utenti
-- ============================================

-- ============================================
-- FUNCTION: Crea scheda preset per nuovo utente
-- ============================================
CREATE OR REPLACE FUNCTION public.create_preset_cards_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Scheda base: 3 serie x 10 ripetizioni
  INSERT INTO public.workout_cards (user_id, name, sets, reps_per_set, rest_time, variant, is_favorite, is_preset)
  VALUES (NEW.id, 'Starter', 3, 10, 60, 'Perfect for beginners', false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Crea scheda preset dopo creazione profilo
-- (Si attiva dopo handle_new_user)
-- ============================================
CREATE OR REPLACE TRIGGER on_profile_created_add_presets
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_preset_cards_for_user();

-- ============================================
-- NOTE: Per utenti esistenti, eseguire manualmente:
--
-- INSERT INTO workout_cards (user_id, name, sets, reps_per_set, rest_time, variant, is_favorite, is_preset)
-- SELECT p.id, 'Starter', 3, 10, 60, 'Perfect for beginners', false, true
-- FROM profiles p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM workout_cards wc
--   WHERE wc.user_id = p.id AND wc.is_preset = true
-- );
-- ============================================
