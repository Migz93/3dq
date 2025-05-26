# Use a more comprehensive Node.js image that includes more build tools
FROM node:18

# Set working directory
WORKDIR /app

# Install dependencies for PDF generation
RUN apt-get update && apt-get install -y \
    fonts-dejavu \
    fontconfig \
    libfontconfig1 \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire application
COPY . .

# Install all dependencies at once (both server and client)
RUN npm install && \
    cd client && npm install

# Build the client
RUN cd client && npm run build

# Set environment variables
ENV PORT=6123
ENV NODE_ENV=production

# Expose the port
EXPOSE 6123

# Start the application
CMD ["npm", "start"]
