FROM oven/bun:latest AS base

RUN apt-get update && apt-get install -y tzdata fontconfig fonts-dejavu fonts-liberation && \
  cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
  echo "Asia/Tokyo" > /etc/timezone && \
  fc-cache -fv && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile && bun build src/main.ts --minify --outfile dist/index.js

CMD ["bun", "dist/index.js"]
