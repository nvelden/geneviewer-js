# check=skip=FromPlatformFlagConstDisallowed
# Test image for the SVG fixture tests: a fixed Linux, Chrome and set of
# fonts, so text measures, and therefore chart layout, are identical on
# every machine. Built for linux/amd64, the only Linux build of Chrome for
# Testing; on Apple silicon Docker runs it through emulation.
FROM --platform=linux/amd64 node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates fontconfig fonts-dejavu-core fonts-liberation2 \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 \
      libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
      libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
      libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 libxshmfence1 \
 && rm -rf /var/lib/apt/lists/*

COPY docker/fonts.conf /etc/fonts/local.conf
RUN fc-cache -f

# Test dependencies live in the image, not in the mounted repo, whose
# node_modules belong to the host system.
ENV PUPPETEER_CACHE_DIR=/opt/harness/.cache/puppeteer
WORKDIR /opt/harness
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npx puppeteer browsers install chrome
ENV NODE_PATH=/opt/harness/node_modules

WORKDIR /work
