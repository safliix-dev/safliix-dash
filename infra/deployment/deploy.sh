#!/bin/bash
# =============================================================================
# deploy.sh — safliix-dash deployment script (INFRA-FAANG1)
# Calque ligne par ligne sur sachrist/deploy.sh
# Usage: ./deploy.sh <IMAGE_FULL> [DEPLOYMENT_TYPE]
# Environment: Set DEPLOY_ENV (dev|staging|prod), defaults to dev
# =============================================================================

set -e
set -u
set -o pipefail

# ============================================================================
# VARIABLES GLOBALES CENTRALISEES
# ============================================================================

# DEPLOYMENT PATHS
readonly BASE_DIRECTORY="/srv"
readonly SHARED_PROJECT_NAME="safliix-shared-project"
PROJECT_NAME="safliix-dash"
readonly WORK_DIR="${BASE_DIRECTORY}/${SHARED_PROJECT_NAME}/${PROJECT_NAME}"

# FILE PATHS
readonly TEMPLATE_FILENAME="docker-compose-template.yml"
readonly COMPOSE_OUTPUT_FILENAME="docker-compose.yml"

# HEALTH CHECK CONFIGURATION
readonly HEALTH_MAX_ATTEMPTS=10
readonly HEALTH_WAIT_TIME=3

# DOCKER DEFAULTS (peuvent etre ecrases par .env)
DEFAULT_IMAGE_REGISTRY="harbor.safliix.com"
DEFAULT_IMAGE_NAME="app"
SERVICE_NAME="safliix-dash"
# CONTAINER_NAME sera charge depuis les fichiers .env

# ============================================================================

# Variables globales pour eviter les undefined
IMAGE_FULL=${1:-""}
DEPLOYMENT_TYPE=${2:-"full"}
DETECTED_ENV=""
BASE_DIR=""

echo "=== DEPLOY.SH INFRA-FAANG1 ==="
echo "Execution: $(date '+%Y-%m-%d %H:%M:%S')"

# Validation des parametres
if [ -z "$IMAGE_FULL" ]; then
    echo "ERROR: Parametre IMAGE_FULL requis"
    echo "Usage: $0 <IMAGE_FULL> [DEPLOYMENT_TYPE]"
    echo "Exemple: $0 ${DEFAULT_IMAGE_REGISTRY}/${PROJECT_NAME}/${DEFAULT_IMAGE_NAME}:1.0.0 full"
    exit 1
fi

echo "Image: $IMAGE_FULL"
echo "Type: $DEPLOYMENT_TYPE"

# ============================================================================
# FONCTIONS
# ============================================================================

# Detecter l'environnement automatiquement
detect_environment() {
    local current_dir=$(pwd)
    local env=""

    if [ -n "${DEPLOY_ENV:-}" ]; then
        env="$DEPLOY_ENV"
        echo "Environnement detecte via DEPLOY_ENV: $env" >&2
    elif [[ "$current_dir" == *"/dev/"* ]]; then
        env="dev"
        echo "Environnement detecte via repertoire: $env" >&2
    elif [[ "$current_dir" == *"/staging/"* ]]; then
        env="staging"
        echo "Environnement detecte via repertoire: $env" >&2
    elif [[ "$current_dir" == *"/prod/"* ]]; then
        env="prod"
        echo "Environnement detecte via repertoire: $env" >&2
    else
        env="dev"
        echo "Environnement par defaut: $env" >&2
    fi

    env=$(echo "$env" | tr -d '\r\n\t ' | sed 's/[[:space:]]//g')
    echo "$env"
}

# Charger la configuration multi-env
load_environment() {
    local env="$1"

    env=$(echo "$env" | tr -d '\r\n\t ' | sed 's/[[:space:]]//g')
    echo "Configuration pour environnement: '$env'"

    if [ -f "infra/environments/common/base.env" ]; then
        BASE_DIR="infra"
    elif [ -f "../environments/common/base.env" ]; then
        BASE_DIR=".."
    elif [ -f "../../infra/environments/common/base.env" ]; then
        BASE_DIR="../../infra"
    else
        echo "ERROR: Structure INFRA-FAANG1 non trouvee"
        exit 1
    fi

    local common_env="$BASE_DIR/environments/common/base.env"
    local env_file="$BASE_DIR/environments/$env/.env.$env"

    echo "Base directory: $BASE_DIR"

    if [ -f "$common_env" ]; then
        echo "Chargement config commune: $common_env"
        set -a
        source "$common_env"
        set +a
    fi

    if [ -f "$env_file" ]; then
        echo "Chargement config $env: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        echo "ERROR: Config $env non trouvee: $env_file"
        exit 1
    fi

    # Load secrets if available
    local secrets_file="$WORK_DIR/.env.secrets"
    if [ -f "$secrets_file" ]; then
        set -a
        source "$secrets_file"
        set +a
        echo "Secrets loaded from $secrets_file"
    else
        echo "WARNING: No secrets file found at $secrets_file"
    fi
}

# check_network APRES load_environment
check_network() {
    if ! docker network inspect "$NETWORK_EXTERNAL_NAME" >/dev/null 2>&1; then
        echo "Reseau $NETWORK_EXTERNAL_NAME inexistant, creation..."
        docker network create "$NETWORK_EXTERNAL_NAME"
        echo "Reseau $NETWORK_EXTERNAL_NAME cree"
    fi
}

# Exporter les variables pour envsubst
export_template_variables() {
    local deployment_type=$1
    local image_full=$2

    local tag=""
    if [ "$deployment_type" = "hotfix" ]; then
        tag="current"
    else
        tag=$(echo "$image_full" | awk -F: '{print $NF}')
        if [ -z "$tag" ] || [ "$tag" = "$image_full" ]; then
            tag="latest"
        fi
    fi

    echo "Tag extrait pour template: '$tag'"

    export PROJECT_NAME="safliix-dash"
    export IMAGE_REGISTRY="${IMAGE_REGISTRY}"
    export IMAGE_NAME="${IMAGE_NAME}"
    export IMAGE_TAG="$tag"
    export IMAGE_FULL="$image_full"
    export CONTAINER_NAME="${CONTAINER_NAME}"
    export CONTAINER_PORT="${CONTAINER_PORT}"
    export NODE_ENV="${NODE_ENV}"
    export ENV="${ENV}"
    export HOST_PORT="${HOST_PORT}"
    export NETWORK_EXTERNAL_NAME="${NETWORK_EXTERNAL_NAME}"
    export VIRTUAL_HOST="${VIRTUAL_HOST:-}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
    export KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-}"
    export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}"
    export NEXT_PUBLIC_KEYCLOAK_URL="${NEXT_PUBLIC_KEYCLOAK_URL:-}"
    export NEXT_PUBLIC_KEYCLOAK_REALM="${NEXT_PUBLIC_KEYCLOAK_REALM:-}"
    export NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID:-}"

    # Variables healthcheck
    export HEALTH_INTERVAL="${HEALTH_INTERVAL:-15s}"
    export HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-5s}"
    export HEALTH_RETRIES="${HEALTH_RETRIES:-2}"
    export HEALTH_START_PERIOD="${HEALTH_START_PERIOD:-10s}"
    export HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/}"
}

# Configuration .env dynamique
configure_dynamic_env() {
    local deployment_type=$1
    local image_full=$2

    local tag=""
    if [ "$deployment_type" = "hotfix" ]; then
        tag="current"
    else
        tag=$(echo "$image_full" | awk -F: '{print $NF}')
        if [ -z "$tag" ] || [ "$tag" = "$image_full" ]; then
            tag="latest"
        fi
    fi

    echo "Configuration .env pour Docker Compose..."
    echo "Tag final: '$tag'"

    cat > .env << EOF
PROJECT_NAME=safliix-dash
CONTAINER_NAME=${CONTAINER_NAME}
IMAGE_REGISTRY=${IMAGE_REGISTRY}
IMAGE_NAME=${IMAGE_NAME}
IMAGE_TAG=${tag}
IMAGE_FULL=${image_full}
NODE_ENV=${NODE_ENV}
ENV=${ENV}
EOF

    echo "Configuration .env generee"
}

# Copier le fichier env pour le container
copy_env_file_for_container() {
    local env=$1
    local source_file="$BASE_DIR/environments/${env}/.env.${env}"
    local target_file=".env"

    echo "Configuration env_file pour container: $env"

    if [ -f "$source_file" ]; then
        cp "$source_file" "$target_file"
        echo "Copie: $source_file -> $target_file"
    else
        echo "ERROR: Fichier source non trouve: $source_file"
        exit 1
    fi
}

# Health check post-deploiement (soft-fail comme ouebx)
health_check() {
    echo "Verification sante service..."

    for i in $(seq 1 $HEALTH_MAX_ATTEMPTS); do
        echo "Tentative $i/$HEALTH_MAX_ATTEMPTS..."

        if curl -f "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            echo "Service accessible et fonctionnel"
            return 0
        fi

        if [ $i -eq $HEALTH_MAX_ATTEMPTS ]; then
            echo "Service inaccessible apres $((HEALTH_MAX_ATTEMPTS * HEALTH_WAIT_TIME)) secondes"
            echo "Logs pour debugging:"
            docker compose logs --tail=10 "$SERVICE_NAME" || true
            return 0
        fi

        sleep $HEALTH_WAIT_TIME
    done
}

# Deploiement complet
deploy_full() {
    local image_full=$1
    echo "=== DEPLOIEMENT COMPLET ==="

    configure_dynamic_env "full" "$image_full"
    copy_env_file_for_container "$DETECTED_ENV"

    if [ -n "${HARBOR_PASSWORD:-}" ] && [ -n "${HARBOR_USER:-}" ]; then
        echo "Connexion a Harbor Registry..."
        if echo "$HARBOR_PASSWORD" | docker login "${IMAGE_REGISTRY:-${DEFAULT_IMAGE_REGISTRY}}" -u "$HARBOR_USER" --password-stdin; then
            echo "Connexion Harbor reussie"
        else
            echo "ERROR: Echec connexion Harbor"
            exit 1
        fi
    fi

    echo "Arret du service existant..."
    docker compose down "$SERVICE_NAME" 2>/dev/null || true
    docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

    echo "Telechargement de l'image..."

    if ! docker compose pull "$SERVICE_NAME"; then
        echo "ERROR: Echec pull image"
        exit 1
    fi

    if ! docker compose up -d "$SERVICE_NAME"; then
        echo "ERROR: Echec deploiement"
        exit 1
    fi

    if ! health_check; then
        echo "ERROR: Service non fonctionnel apres deploiement"
        exit 1
    fi

    echo "Deploiement complet reussi: $image_full"
}

# Deploiement hotfix
deploy_hotfix() {
    echo "=== DEPLOIEMENT HOTFIX ==="

    configure_dynamic_env "hotfix" "$IMAGE_FULL"
    copy_env_file_for_container "$DETECTED_ENV"

    echo "Redemarrage du service..."

    if ! docker compose down "$SERVICE_NAME"; then
        echo "ERROR: Echec docker compose down"
        exit 1
    fi

    if ! docker compose up -d "$SERVICE_NAME"; then
        echo "ERROR: Echec docker compose up"
        exit 1
    fi

    if ! health_check; then
        echo "ERROR: Service non fonctionnel apres hotfix"
        exit 1
    fi

    echo "Hotfix deploye et valide avec succes"
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

main() {
    DETECTED_ENV=$(detect_environment)
    DETECTED_ENV=$(echo "$DETECTED_ENV" | tr -d '\r\n\t ' | sed 's/[[:space:]]//g')

    echo "Environnement final detecte: '$DETECTED_ENV'"

    load_environment "$DETECTED_ENV"

    check_network

    TEMPLATE_PATH=$(realpath "$BASE_DIR/templates/$TEMPLATE_FILENAME")

    BASE_DIR=$(realpath "$BASE_DIR")

    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR"

    echo "Repertoire de travail: $(pwd)"

    if [ -f "$TEMPLATE_PATH" ]; then
        echo "Generation docker-compose.yml depuis template..."

        export_template_variables "$DEPLOYMENT_TYPE" "$IMAGE_FULL"

        envsubst < "$TEMPLATE_PATH" > "$COMPOSE_OUTPUT_FILENAME"

        echo "docker-compose.yml genere"
    else
        echo "ERROR: Template non trouve: $TEMPLATE_PATH"
        exit 1
    fi

    case "$DEPLOYMENT_TYPE" in
        "hotfix")
            deploy_hotfix
            ;;
        "full")
            deploy_full "$IMAGE_FULL"
            ;;
        *)
            echo "ERROR: Type de deploiement invalide: $DEPLOYMENT_TYPE"
            exit 1
            ;;
    esac

    echo "=== STATUS FINAL ==="
    docker compose ps "$SERVICE_NAME" || true
    echo "=== DEPLOIEMENT TERMINE AVEC SUCCES ==="
    echo "Service accessible: $HEALTH_CHECK_URL"
}

if ! main "$@"; then
    echo "=== ECHEC DU DEPLOIEMENT ==="
    exit 1
fi
