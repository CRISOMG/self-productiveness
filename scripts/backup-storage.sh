#!/bin/bash
# ============================================================================
# YourFocus — Storage Objects Backup
# ============================================================================
# Downloads all files from Supabase Storage buckets to local backup.
#
# Usage:
#   ./scripts/backup-storage.sh                # uses .env for config
#
# Configuration:
#   The script reads from your .env file automatically:
#     - SUPABASE_URL        → project URL
#     - SUPABASE_SERVICE_KEY → service role key (for API auth)
#
#   Or override via environment variables:
#     SUPABASE_SERVICE_ROLE_KEY="..." ./scripts/backup-storage.sh
#
# Buckets backed up:
#   - avatars
#   - yourfocus
#   - chat-attachments
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Load .env if it exists ──────────────────────────────────────────────────
ENV_FILE="${PROJECT_ROOT}/.env"
if [ -f "$ENV_FILE" ]; then
  # Source only the vars we need (handles quotes and spaces in values)
  SUPABASE_URL="${SUPABASE_URL:-$(grep -E '^SUPABASE_URL=' "$ENV_FILE" | head -1 | sed 's/^SUPABASE_URL=//' | tr -d '"' | tr -d "'")}"
  # Try SUPABASE_SERVICE_ROLE_KEY first, then fall back to SUPABASE_SERVICE_KEY from .env
  if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY:-$(grep -E '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" | head -1 | sed 's/^SUPABASE_SERVICE_KEY=//' | tr -d '"' | tr -d "'")}"
  fi
fi

# ── Validate config ────────────────────────────────────────────────────────
if [ -z "${SUPABASE_URL:-}" ]; then
  echo "❌ Error: SUPABASE_URL not found."
  echo "   Set it in .env or as an environment variable."
  exit 1
fi

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "❌ Error: No service role key found."
  echo ""
  echo "   The script checks these sources (in order):"
  echo "   1. SUPABASE_SERVICE_ROLE_KEY env var"
  echo "   2. SUPABASE_SERVICE_KEY in .env"
  echo ""
  echo "   Find it in: Dashboard → Settings → API → service_role key"
  exit 1
fi

# Check for required tools
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required. Install with: sudo apt install jq"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required."; exit 1; }

# ── Setup ───────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${PROJECT_ROOT}/backups/storage_${TIMESTAMP}"
BUCKETS=("avatars" "yourfocus" "chat-attachments")
TOTAL_FILES=0
TOTAL_ERRORS=0

echo "🔄 Storage backup starting..."
echo "   URL:       ${SUPABASE_URL}"
echo "   Buckets:   ${BUCKETS[*]}"
echo "   Output:    ${BACKUP_DIR}"
echo ""

# ── Download function ──────────────────────────────────────────────────────
download_objects() {
  local bucket="$1"
  local prefix="$2"
  local output_dir="$3"

  # List objects at this prefix
  local list_body="{\"prefix\":\"${prefix}\",\"limit\":10000,\"offset\":0}"
  local response
  response=$(curl -s \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$list_body" \
    "${SUPABASE_URL}/storage/v1/object/list/${bucket}")

  # Validate response
  if ! echo "$response" | jq -e 'type == "array"' >/dev/null 2>&1; then
    echo "   ⚠️  API error for prefix '${prefix:-/}'"
    return
  fi

  local count
  count=$(echo "$response" | jq 'length')
  if [ "$count" -eq 0 ]; then
    return
  fi

  # Process each item
  echo "$response" | jq -c '.[]' | while IFS= read -r item; do
    local name
    name=$(echo "$item" | jq -r '.name')
    local id
    id=$(echo "$item" | jq -r '.id // empty')

    if [ -z "$id" ]; then
      # It's a folder — recurse into it
      local sub_prefix="${prefix}${name}/"
      mkdir -p "${output_dir}/${name}"
      download_objects "$bucket" "$sub_prefix" "${output_dir}/${name}"
    else
      # It's a file — download it
      local file_path="${output_dir}/${name}"
      local object_path="${prefix}${name}"

      # URL-encode the object path
      local encoded_path
      encoded_path=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${object_path}', safe='/'))" 2>/dev/null || echo "$object_path")

      if curl -sf -o "$file_path" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        "${SUPABASE_URL}/storage/v1/object/${bucket}/${encoded_path}"; then
        local size
        size=$(du -h "$file_path" 2>/dev/null | cut -f1)
        echo "   ↓ ${bucket}/${object_path} (${size})"
        TOTAL_FILES=$((TOTAL_FILES + 1))
      else
        echo "   ✗ Failed: ${bucket}/${object_path}"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
      fi
    fi
  done
}

# ── Main loop ──────────────────────────────────────────────────────────────
for BUCKET in "${BUCKETS[@]}"; do
  echo "📁 Bucket: ${BUCKET}"

  BUCKET_DIR="${BACKUP_DIR}/${BUCKET}"
  mkdir -p "$BUCKET_DIR"

  download_objects "$BUCKET" "" "$BUCKET_DIR"

  # Check if bucket directory is empty
  if [ -z "$(ls -A "$BUCKET_DIR" 2>/dev/null)" ]; then
    echo "   (empty bucket or not accessible)"
    rmdir "$BUCKET_DIR" 2>/dev/null || true
  fi
  echo ""
done

# ── Summary ────────────────────────────────────────────────────────────────
if [ -d "$BACKUP_DIR" ]; then
  STORAGE_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
else
  STORAGE_SIZE="0"
fi

echo "✅ Storage backup complete!"
echo "   Directory:  ${BACKUP_DIR}"
echo "   Total size: ${STORAGE_SIZE}"
if [ "$TOTAL_ERRORS" -gt 0 ]; then
  echo "   ⚠️  Errors: ${TOTAL_ERRORS}"
fi
