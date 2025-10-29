# Multi-purpose Dockerfile for DB jobs (migrate & seed)
# Builds a minimal Node image that can run prisma migrate deploy and prisma db seed

FROM node:20-bullseye-slim

WORKDIR /app

# Install system deps required by prisma & psql client
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY tsconfig.json ./tsconfig.json

RUN npm ci --omit=dev

# Copy application code (seed script expects prisma/seed.ts)
COPY prisma ./prisma
COPY prisma/seed.ts ./prisma/seed.ts

# Use a small entrypoint script to run either migrate or seed
COPY docker/db-job/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["migrate"]
