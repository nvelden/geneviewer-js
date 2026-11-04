# Test image for the SVG fixture tests: a fixed Linux, Chromium and set of
# fonts, so text measures, and therefore chart layout, are identical on
# every machine. It runs natively on arm64 (Apple silicon, and the
# ubuntu-24.04-arm runners in CI): Chrome under amd64 emulation misreads
# numbers (e.g. 0.2 as 0), so emulation is not used.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates fontconfig fonts-dejavu-core fonts-liberation2 \
 && rm -rf /var/lib/apt/lists/*

COPY docker/fonts.conf /etc/fonts/local.conf
RUN fc-cache -f

# Test dependencies live in the image, not in the mounted repo, whose
# node_modules belong to the host system. Playwright pins Chromium.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/harness/browsers
WORKDIR /opt/harness
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
 && npx playwright-core install --with-deps chromium \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_PATH=/opt/harness/node_modules

WORKDIR /work
