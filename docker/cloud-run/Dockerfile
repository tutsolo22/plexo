# Multi-stage Dockerfile for deploying Next.js + Prisma app to Cloud Run
# - builder: installs dev deps, runs prisma generate and builds Next.js
# - runner: minimal image with production deps and compiled app

FROM node:20-bullseye as builder
WORKDIR /app

# Copy package manifests and install all deps (including dev for build)
COPY package.json package-lock.json* ./
# Install dependencies but skip lifecycle scripts (prisma generate will run after copying schema)
RUN npm ci --ignore-scripts

# Copy source and generate Prisma client, then build Next.js
COPY . .
# Now we have prisma/schema.prisma in the context; run generate and build
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

FROM node:20-bullseye-slim as runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package manifest and production node_modules from builder
COPY package.json package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules

# Copy build output and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js

# Expose the port Cloud Run uses
ENV PORT=8080
EXPOSE 8080

# Use npm start (expect package.json "start" script to run `next start -p $PORT`)
CMD ["npm", "run", "start"]
