# Stage 1 — Build the Vue app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite values are injected at build time and become part of the compiled JS.
# Explicit process environment values take precedence over any .env files in
# the build context, so staging and production remain independently configured.
ARG VITE_API_BASE_URL
ARG VITE_PRODUCT_ANALYTICS_ENABLED=false
ARG VITE_POSTHOG_PROJECT_TOKEN=
ARG VITE_POSTHOG_API_HOST=https://eu.i.posthog.com
RUN VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
    VITE_PRODUCT_ANALYTICS_ENABLED="${VITE_PRODUCT_ANALYTICS_ENABLED:-false}" \
    VITE_POSTHOG_PROJECT_TOKEN="${VITE_POSTHOG_PROJECT_TOKEN:-}" \
    VITE_POSTHOG_API_HOST="${VITE_POSTHOG_API_HOST:-https://eu.i.posthog.com}" \
    npm run build

# Stage 2 — Serve the compiled app with nginx
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
