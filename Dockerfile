FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy project configuration and data
COPY --chown=nodejs:nodejs openclaw.json /app/
COPY --chown=nodejs:nodejs agents /app/agents/
COPY --chown=nodejs:nodejs flows /app/flows/
COPY --chown=nodejs:nodejs plugins /app/plugins/
COPY --chown=nodejs:nodejs plugin-skills /app/plugin-skills/
COPY --chown=nodejs:nodejs sandboxes /app/sandboxes/
COPY --chown=nodejs:nodejs tasks /app/tasks/
COPY --chown=nodejs:nodejs workspace /app/workspace/
COPY --chown=nodejs:nodejs logs /app/logs/

USER nodejs

EXPOSE 18789

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -O- http://localhost:18789 || exit 1

CMD ["npx", "openclaw", "gateway", "--port", "18789"]
