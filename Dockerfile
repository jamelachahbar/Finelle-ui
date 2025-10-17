# Multi-stage build for React app with Application Insights
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --no-package-lock

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_APPINSIGHTS_CONNECTION_STRING
ARG VITE_BACKEND_URL

# Set environment variables for Vite build
ENV VITE_APPINSIGHTS_CONNECTION_STRING=$VITE_APPINSIGHTS_CONNECTION_STRING
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build the application (environment variables will be picked up from build args)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy environment configuration script
COPY env-config.sh /docker-entrypoint.d/10-env-config.sh
RUN chmod +x /docker-entrypoint.d/10-env-config.sh

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Environment variables will be injected at runtime
ENV VITE_APPINSIGHTS_CONNECTION_STRING=""
ENV VITE_BACKEND_URL=""

# Start nginx (env-config.sh will run automatically via /docker-entrypoint.d/)
CMD ["nginx", "-g", "daemon off;"]