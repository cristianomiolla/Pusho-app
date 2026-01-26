-- Function to delete the current authenticated user
-- This function can only delete the user who calls it (using auth.uid())
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();

  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user data from all tables (order matters due to foreign keys)
  -- 1. Delete workout sessions
  DELETE FROM workout_sessions WHERE user_id = current_user_id;

  -- 2. Delete workout cards
  DELETE FROM workout_cards WHERE user_id = current_user_id;

  -- 3. Delete user stats
  DELETE FROM user_stats WHERE user_id = current_user_id;

  -- 4. Delete profile
  DELETE FROM profiles WHERE id = current_user_id;

  -- 5. Delete the auth user
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
