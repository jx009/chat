FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json

RUN npm ci --workspace backend --include-workspace-root=false

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend ./backend

RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 3001

CMD ["node", "backend/dist/main.js"]
