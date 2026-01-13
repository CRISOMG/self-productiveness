#!/bin/bash

# Colores para los logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cargar variables del .env para este script
if [ -f .env ]; then
  # Exportamos las variables localmente para usarlas en el script
  export $(grep -v '^#' .env | xargs)
fi

echo -e "${BLUE}▶ Configurando entorno para LocalTunnel...${NC}"

if [ -z "$WEBHOOK_SUBDOMAIN" ]; then
  echo -e "${RED}✘ Error: La variable WEBHOOK_SUBDOMAIN no está definida en .env${NC}"
  echo -e "Por favor, añade una línea como esta a tu archivo .env:"
  echo -e "WEBHOOK_SUBDOMAIN=un-nombre-unico-para-tu-tunel"
  exit 1
fi

# Construir la URL del webhook basada en el subdominio
export WEBHOOK_URL="https://${WEBHOOK_SUBDOMAIN}.loca.lt"

echo -e "${BLUE}▶ Iniciando n8n y LocalTunnel...${NC}"
echo -e "URL del Webhook: ${GREEN}${WEBHOOK_URL}${NC}"

# Levantar todos los servicios (n8n y tunnel)
# Docker Compose usará el WEBHOOK_URL exportado aquí
docker compose up -d --remove-orphans

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ ¡Todo listo!${NC}"
  echo -e "Accede a n8n aquí (puede tardar unos segundos en conectar el túnel):"
  echo -e "${GREEN}${WEBHOOK_URL}${NC}"
else
  echo -e "${RED}✘ Ocurrió un error al iniciar los contenedores.${NC}"
  exit 1
fi
