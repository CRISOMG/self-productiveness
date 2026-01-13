#!/bin/bash

# Colores para los logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}▶ Iniciando Cloudflare Tunnel...${NC}"

# Capturamos el timestamp actual para filtrar logs viejos
START_TIME=$(date +%s)

# 1. Levantar solo cloudflared (forzando recreación para limpiar estado)
docker compose up -d --force-recreate cloudflared

echo -e "${BLUE}▶ Buscando URL del túnel (esperando 15s)...${NC}"
# 2. Esperar un poco más para asegurar que conecte
# 2. Esperar un poco más para asegurar que conecte, mostrando logs
timeout 15s docker compose logs -f cloudflared || true

# 3. Extraer la URL de los logs USANDO EL FILTRO DE TIEMPO (--since)
# Esto evita que lea URLs de sesiones anteriores
TUNNEL_URL=$(docker compose logs --since 15s cloudflared 2>&1 | grep -o 'https://[^"]*\.trycloudflare\.com' | head -n 1)

if [ -z "$TUNNEL_URL" ]; then
  echo -e "${RED}✘ No se pudo encontrar la URL del túnel. Revisa los logs de cloudflared.${NC}"
  docker compose logs cloudflared
  exit 1
fi

echo -e "${GREEN}✔ Túnel encontrado: $TUNNEL_URL${NC}"

# 4. Levantar n8n pasándole la URL encontrada
echo -e "${BLUE}▶ Iniciando n8n con la nueva URL...${NC}"
WEBHOOK_URL=$TUNNEL_URL docker compose up -d n8n

echo -e "${GREEN}✔ ¡Todo listo!${NC}"
echo -e "Accede a n8n aquí: ${GREEN}$TUNNEL_URL${NC}"
