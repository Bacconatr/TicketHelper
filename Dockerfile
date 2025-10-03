FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY index.mjs ./

# Run as non-root user for security
USER node

# Start the bot
CMD ["node", "index.mjs"]
