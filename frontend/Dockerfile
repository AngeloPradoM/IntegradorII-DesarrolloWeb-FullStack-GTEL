# ==============================================================
# GTEL Talento ATS - Frontend Dockerfile (Multi-stage Build)
# Node.js 22 Alpine + Nginx 1.27 Alpine
# ==============================================================

# --------------------------------------------------------------
# Etapa 1: Compilación de React y Vite
# --------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Cache de dependencias de npm
COPY package*.json ./
RUN npm ci

# Copia del código fuente del frontend
COPY . .

# Argumento para la URL de la API (vacío para usar proxy inverso relativo /api/)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Compilación de producción optimizada
RUN npm run build

# --------------------------------------------------------------
# Etapa 2: Servidor web Nginx ligero para producción
# --------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Limpiar archivos de configuración por defecto
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck interno del servidor web
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
