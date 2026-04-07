# Stage 1: Build frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Install backend deps
FROM node:20-alpine AS server-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini
RUN npm install -g tsx

COPY --from=server-deps /app/node_modules ./node_modules
COPY --from=client-build /app/client/dist ./client/dist
COPY package.json ./
COPY server/ ./server/

RUN mkdir -p /app/data

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["tsx", "server/index.ts"]
