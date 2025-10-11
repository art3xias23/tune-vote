# Multi-stage build for React frontend
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Accept build arguments
ARG REACT_APP_BUILD_NUMBER=dev
ARG REACT_APP_BUILD_COMMIT=local

# Set environment variables from build args
ENV REACT_APP_BUILD_NUMBER=$REACT_APP_BUILD_NUMBER
ENV REACT_APP_BUILD_COMMIT=$REACT_APP_BUILD_COMMIT

# Copy source code
COPY . .

# Build the React app for production
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Copy built React app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginxuser -u 1001 -G nginx-group

# Set proper permissions
RUN chown -R nginxuser:nginx-group /usr/share/nginx/html && \
    chown -R nginxuser:nginx-group /var/cache/nginx && \
    chown -R nginxuser:nginx-group /var/log/nginx && \
    chown -R nginxuser:nginx-group /etc/nginx/conf.d

# Touch pid file and change ownership
RUN touch /var/run/nginx.pid && \
    chown -R nginxuser:nginx-group /var/run/nginx.pid

# Switch to non-root user
USER nginxuser

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]