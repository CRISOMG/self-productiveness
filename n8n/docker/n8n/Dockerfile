# Etapa 1: Builder para descargar herramientas sin depender del gestor de n8n
FROM alpine:3.20 AS builder
RUN apk add --no-cache curl unzip bash

# Instalamos Bun en el builder
RUN curl -fsSL https://bun.sh/install | bash

# Descargamos un binario estático de Curl
RUN wget https://github.com/moparisthebest/static-curl/releases/latest/download/curl-amd64 -O /curl-static && \
    chmod +x /curl-static

# Etapa 2: Imagen final de n8n
FROM docker.n8n.io/n8nio/n8n:2.1.4

USER root

# Copiamos Bun (binario autónomo)
COPY --from=builder /root/.bun/bin/bun /usr/local/bin/bun
RUN chmod +x /usr/local/bin/bun

# Copiamos Curl estático (funciona sin librerías externas)
COPY --from=builder /curl-static /usr/local/bin/curl

RUN npm install -g telegram

USER node

# Aseguramos que los binarios estén en el PATH
ENV PATH="/usr/local/bin:$PATH"
