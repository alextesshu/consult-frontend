# Stage 1 — Build the Vue app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL is injected at build time (becomes part of compiled JS)
ARG VITE_API_BASE_URL
RUN if [ -n "$VITE_API_BASE_URL" ]; then \
      VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build; \
    else \
      npm run build; \
    fi

# Stage 2 — Serve the compiled app with nginx
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
