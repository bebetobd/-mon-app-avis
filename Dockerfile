# ─── Étape 1 : Build du frontend ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ─── Étape 2 : Image de production ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]
