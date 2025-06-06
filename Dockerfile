# Use Node.js v20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy all files (excluding .dockerignored files)
COPY . .

# Install dependencies and build
RUN npm install && \
    npm run client-install && \
    npm run build

# Set environment variables
ENV PORT=6123
ENV NODE_ENV=production
ENV CONFIG_DIR=/config

# Create config directory
RUN mkdir -p /config

# Expose the port
EXPOSE 6123

# Start the application
CMD ["npm", "start"]
