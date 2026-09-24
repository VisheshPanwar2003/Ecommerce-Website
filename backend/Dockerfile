FROM node:20-slim

# Install OpenSSL for Prisma engine compatibility on Debian slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies using the existing lockfile
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source code
COPY src ./src/

# Expose backend port
EXPOSE 5000

# Default runtime environment variables (overridable at container start)
ENV NODE_ENV=production \
    PORT=5000

CMD ["npm", "start"]
