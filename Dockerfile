FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npm run build \
    && mkdir -p /app/.data /app/var/uploads/public \
    && chown -R node:node /app/.data /app/var

USER node

EXPOSE 4321

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/entry.mjs"]
