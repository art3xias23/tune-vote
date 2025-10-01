FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install production dependencies and add curl for healthcheck
RUN npm ci --only=production && npm cache clean --force \
    && apk add --no-cache curl

COPY . .

# Create non-root user and assign to group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -sS -f http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
