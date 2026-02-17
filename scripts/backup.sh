#!/bin/bash
# ============================================================================
# YourFocus — Full Database Backup
# ============================================================================
# Creates two SQL dumps:
#   1. Full backup (schema + data) — safety net
#   2. Data-only backup — for restoring into fresh schema from repo
#
# Usage:
#   ./scripts/backup.sh                            # dumps linked project
#   DB_URL="postgresql://..." ./scripts/backup.sh   # specific database
#
# Prerequisites:
#   - Supabase CLI installed and authenticated (`supabase login`)
#   - Project linked (`supabase link --project-ref <ref>`)
#
# Future: This will run automatically before prod deployments in CI/CD.
# ============================================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

# Check if a DB_URL is provided for direct connection, otherwise use --linked
if [ -n "${DB_URL:-}" ]; then
  DUMP_FLAG="--db-url $DB_URL"
  ENV_LABEL="custom"
  echo "🔗 Using direct connection string"
else
  DUMP_FLAG="--linked"
  ENV_LABEL="linked"
  echo "🔗 Using linked project (run 'supabase link' first if not linked)"
fi

FULL_FILE="${BACKUP_DIR}/${ENV_LABEL}_full_${TIMESTAMP}.sql"
DATA_FILE="${BACKUP_DIR}/${ENV_LABEL}_data_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup..."
echo "   Timestamp: ${TIMESTAMP}"
echo ""

# 1. Full backup (schema + data)
echo "📦 [1/2] Full backup (schema + data)..."
if supabase db dump $DUMP_FLAG -f "$FULL_FILE" 2>/dev/null; then
  FULL_SIZE=$(du -h "$FULL_FILE" | cut -f1)
  echo "   ✅ ${FULL_FILE} (${FULL_SIZE})"
else
  echo "   ❌ Full backup failed. Check 'supabase link' or DB_URL."
  exit 1
fi

# 2. Data-only backup
echo "📦 [2/2] Data-only backup..."
if supabase db dump $DUMP_FLAG --data-only -f "$DATA_FILE" 2>/dev/null; then
  DATA_SIZE=$(du -h "$DATA_FILE" | cut -f1)
  echo "   ✅ ${DATA_FILE} (${DATA_SIZE})"
else
  echo "   ⚠️  Data-only backup failed (may be empty database)"
fi

echo ""
echo "✅ Backup complete!"
echo "   Full:      ${FULL_FILE} (${FULL_SIZE:-?})"
echo "   Data-only: ${DATA_FILE} (${DATA_SIZE:-?})"
