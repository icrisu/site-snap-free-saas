# Stage 1: build
FROM node:24-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Stage 2: production
FROM node:24-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Install Chromium system dependencies
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install Chromium headless shell for Playwright
RUN npx playwright install chromium

EXPOSE 3000

CMD ["npm", "start"]
