# Build stage
#FROM node:20-alpine AS build
FROM registry.access.redhat.com/ubi9/nodejs-20:9.7 AS build
LABEL maintainer="Robert Guske"
LABEL description="Fun Project - Retroplay Online Lab Website"
WORKDIR /app

# Fix Permissions
RUN fix-permissions /app -P

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM registry.access.redhat.com/ubi9/nginx-120

USER 0

# Replace the base nginx.conf that contains its own default server
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Your vhost
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY --chown=1001:0 nginx/entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

# Static assets (match the root above)
COPY --from=build --chown=1001:0 /app/dist/ /usr/share/nginx/html/

USER 1001
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
