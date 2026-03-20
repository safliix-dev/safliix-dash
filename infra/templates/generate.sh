#!/bin/bash
# =============================================================================
# generate.sh — Generate docker-compose.yml from template
# Merges base.env + .env.{env} + .env.secrets and runs envsubst
# Usage: ./generate.sh <env> [output_dir]
# =============================================================================

set -euo pipefail

# -------------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

# -------------------------------------------------------------------------
# Parse parameters
# -------------------------------------------------------------------------
TARGET_ENV="${1:?ERROR: Environment parameter required. Usage: ./generate.sh <dev|staging|prod> [output_dir]}"
OUTPUT_DIR="${2:-$SCRIPT_DIR/generated}"

if [[ ! "$TARGET_ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo "[generate] ERROR: Invalid environment '$TARGET_ENV'. Must be dev, staging, or prod."
    exit 1
fi

echo "============================================"
echo " safliix-dash — Generate Compose File"
echo "============================================"
echo "[generate] Environment: $TARGET_ENV"

# -------------------------------------------------------------------------
# Load configuration files
# -------------------------------------------------------------------------
COMMON_ENV="$INFRA_DIR/environments/common/base.env"
ENV_FILE="$INFRA_DIR/environments/$TARGET_ENV/.env.$TARGET_ENV"
SECRETS_FILE="/srv/safliix-shared-project/safliix-dash/.env.secrets"
TEMPLATE_FILE="$SCRIPT_DIR/docker-compose-template.yml"

# Validate required files
for f in "$COMMON_ENV" "$ENV_FILE" "$TEMPLATE_FILE"; do
    if [ ! -f "$f" ]; then
        echo "[generate] ERROR: Required file not found: $f"
        exit 1
    fi
done

# Source environment files
set -a
source "$COMMON_ENV"
source "$ENV_FILE"

# Load secrets if available
if [ -f "$SECRETS_FILE" ]; then
    source "$SECRETS_FILE"
    echo "[generate] Secrets loaded."
else
    echo "[generate] WARNING: No secrets file found at $SECRETS_FILE"
    echo "[generate] Using placeholder values for secrets."
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-PLACEHOLDER_REPLACE_ME}"
    KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-PLACEHOLDER_REPLACE_ME}"
fi

# Set IMAGE_FULL if not already defined
IMAGE_FULL="${IMAGE_FULL:-${IMAGE_REGISTRY}/${PROJECT_NAME}/${IMAGE_NAME}:latest}"
export IMAGE_FULL
set +a

# -------------------------------------------------------------------------
# Generate output
# -------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/docker-compose.yml"

echo "[generate] Template:  $TEMPLATE_FILE"
echo "[generate] Output:    $OUTPUT_FILE"

envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "[generate] docker-compose.yml generated successfully."
echo "============================================"
echo ""
echo "To deploy, run:"
echo "  docker compose -f $OUTPUT_FILE -p safliix-dash-$TARGET_ENV up -d"
echo ""
