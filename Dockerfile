# Build stage: Debian/glibc para que Rolldown instale @rolldown/binding-linux-x64-gnu (Alpine/musl falla con binding musl)
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm cache clean --force && npm install --legacy-peer-deps --include=optional

COPY . .

# Build-time env (Vite embeds VITE_* at build time)
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_APP_NAME=${VITE_APP_NAME:-"COMWARE Risk Management"} \
    VITE_ENV=${VITE_ENV:-production}

RUN npm run build

# Production stage: serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
