# Stage 1: Build frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install
COPY client/ ./
RUN npm run build

# Stage 2: Install backend deps
FROM node:20-alpine AS server-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev

# Stage 3: Runtime (minimal ~80MB)
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini curl && \
    npm install -g tsx && \
    rm -rf /root/.npm /tmp/* /var/cache/apk/*

COPY --from=server-deps /app/node_modules ./node_modules
COPY --from=client-build /app/client/dist ./client/dist
COPY package.json openapi.yaml ./
COPY server/ ./server/

RUN mkdir -p /app/data && chown -R node:node /app
USER node

ENV NODE_ENV=production PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost:3000/api/health || exit 1

STOPSIGNAL SIGTERM

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["tsx", "server/index.ts"]
