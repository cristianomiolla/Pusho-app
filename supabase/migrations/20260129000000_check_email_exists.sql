-- Migration: check_email_exists RPC function
-- Purpose: Check if an email exists in auth.users for email-first onboarding flow

CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(check_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;
