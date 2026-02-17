#!/bin/bash
# ============================================================================
# YourFocus — Auth Users Backup
# ============================================================================
# Exports the auth schema (users, sessions, etc.).
#
# Usage:
#   ./scripts/backup-auth.sh                            # dumps linked project
#   DB_URL="postgresql://..." ./scripts/backup-auth.sh   # specific database
#
# ⚠️  Passwords are bcrypt-hashed — they restore correctly.
#     OAuth tokens and provider links may need manual reconfiguration.
#
# Note: @yopmail.com test accounts are included in the dump.
#       Filter them out during restore with:
#       grep -v 'yopmail\.com' backup_file.sql | psql <DB_URL>
# ============================================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

# Check if a DB_URL is provided for direct connection, otherwise use --linked
if [ -n "${DB_URL:-}" ]; then
  DUMP_FLAG="--db-url $DB_URL"
  ENV_LABEL="custom"
else
  DUMP_FLAG="--linked"
  ENV_LABEL="linked"
fi

AUTH_FILE="${BACKUP_DIR}/${ENV_LABEL}_auth_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "🔄 Exporting auth schema..."

# Dump the auth schema
if supabase db dump $DUMP_FLAG --schema auth -f "$AUTH_FILE" 2>/dev/null; then
  AUTH_SIZE=$(du -h "$AUTH_FILE" | cut -f1)
  echo ""
  echo "✅ Auth backup complete!"
  echo "   File: ${AUTH_FILE} (${AUTH_SIZE})"
  echo ""
  echo "⚠️  To filter @yopmail.com accounts during restore:"
  echo "   grep -v 'yopmail\\.com' ${AUTH_FILE} | psql \$DB_URL"
  echo ""
  echo "⚠️  After restoring to a new project:"
  echo "   - Reconfigure OAuth provider keys in Dashboard"
  echo "   - Reset any custom role passwords"
else
  echo "   ❌ Auth backup failed. Check 'supabase link' or DB_URL."
  exit 1
fi
