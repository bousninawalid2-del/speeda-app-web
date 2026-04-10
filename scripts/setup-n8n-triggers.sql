-- =============================================================================
-- setup-n8n-triggers.sql
--
-- Run this script ONCE on the "datatest" PostgreSQL database to create the
-- NOTIFY triggers that feed changes back into Speeda in real time.
--
-- Usage:
--   sudo -u postgres psql -d datatest -f scripts/setup-n8n-triggers.sql
--
-- The trigger adds a "_table" key to the JSON payload so that the Next.js
-- pg-listener can route the notification to the correct handler.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Notification function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_speeda_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Include the table name in the payload so the listener knows the source.
  PERFORM pg_notify(
    'speeda_sync',
    (row_to_json(NEW)::jsonb || jsonb_build_object('_table', TG_TABLE_NAME))::text
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Trigger on preferences
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_notify_speeda_preferences ON preferences;

CREATE TRIGGER trg_notify_speeda_preferences
AFTER INSERT OR UPDATE ON preferences
FOR EACH ROW
EXECUTE FUNCTION notify_speeda_sync();

-- ---------------------------------------------------------------------------
-- 3. Trigger on activities
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_notify_speeda_activities ON activities;

CREATE TRIGGER trg_notify_speeda_activities
AFTER INSERT OR UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION notify_speeda_sync();

-- ---------------------------------------------------------------------------
-- Done
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'speeda_sync triggers created successfully on preferences and activities';
END;
$$;
