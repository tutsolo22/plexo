FROM node:20-bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install required packages: psql client and ca-certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client ca-certificates curl unzip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# Generate Prisma client (if present) during image build
COPY prisma ./prisma
RUN npx prisma generate || true

# Copy app files (only what's needed for seed/migrations)
COPY prisma/migrations ./prisma/migrations
COPY prisma/seed.ts ./prisma/seed.ts
COPY prisma/schema.prisma ./prisma/schema.prisma

# Copy entrypoint
COPY docker/db-init/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PATH="/workspace/node_modules/.bin:${PATH}"

ENTRYPOINT ["/entrypoint.sh"]
