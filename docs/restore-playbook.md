# YourFocus — Restore Playbook

Step-by-step guide to restore the entire Supabase instance from backups + repo.

## Prerequisites

- Supabase CLI installed and authenticated (`supabase login`)
- Access to backup files in `backups/` directory
- Organization ID for creating new project

## Step 1: Create New Project

```bash
supabase projects create --name yourfocus --region us-west-2 --org-id <ORG_ID>
# Note the new project ref from the output
export NEW_REF="<new-project-ref>"
```

## Step 2: Link & Push Schema

```bash
supabase link --project-ref "$NEW_REF"
supabase db push
```

This applies all declarative schemas from `supabase/schemas/`:

- Extensions and grants (`main.sql`)
- Tables, types, constraints (`tables.sql`)
- Functions and triggers (`functions_and_triggers.sql`)
- RLS policies (`policies.sql`)
- Storage buckets and policies (`storage.sql`)
- Webhooks (`webhooks.sql`)

## Step 3: Restore Data

```bash
# Get the database URL from Dashboard → Settings → Database → Connection string
export DB_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Restore data (use the most recent data-only backup)
psql "$DB_URL" < backups/prod_data_YYYYMMDD_HHMMSS.sql
```

## Step 4: Restore Auth Users

```bash
# Filter out @yopmail.com test accounts during restore
grep -v 'yopmail\.com' backups/prod_auth_YYYYMMDD_HHMMSS.sql | psql "$DB_URL"
```

> ⚠️ Passwords are bcrypt-hashed and will work. OAuth tokens may need reconfiguration.

## Step 5: Deploy Edge Functions

```bash
supabase functions deploy send-push --project-ref "$NEW_REF"
```

## Step 6: Restore Storage Objects

```bash
export SUPABASE_SERVICE_ROLE_KEY="<new-service-role-key>"
# Upload backed-up files using the Storage API
# For each file in backups/prod_storage_YYYYMMDD/avatars/:
for USER_DIR in backups/prod_storage_*/avatars/*/; do
  USER_ID=$(basename "$USER_DIR")
  for FILE in "$USER_DIR"*; do
    FILENAME=$(basename "$FILE")
    curl -X POST \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -F "file=@$FILE" \
      "https://${NEW_REF}.supabase.co/storage/v1/object/avatars/${USER_ID}/${FILENAME}"
  done
done
```

## Step 7: Reconfigure Secrets

Follow the checklist in [docs/secrets-checklist.md](./secrets-checklist.md):

1. Set VAPID keys in Edge Function secrets
2. Update `.env` files with new Supabase URL and keys
3. Reconfigure OAuth providers (if any)
4. Verify webhook URLs

## Step 8: Verify

```sql
-- Check row counts match expected values
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Verify auth users
SELECT count(*) FROM auth.users;

-- Verify storage
SELECT count(*) FROM storage.objects;
```

## Step 9: Update Application

Update all environment variables in your deployment (Vercel, etc.) to point to the new project URL and keys.

---

> **Future improvement:** Automate this playbook as a single `scripts/restore.sh` script.
