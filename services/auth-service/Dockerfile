FROM node:20-alpine AS dependencies
WORKDIR /app
COPY ../package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001
USER node
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node ../package*.json ./
COPY --chown=node:node ../shared/ ./shared/
COPY --chown=node:node ./auth-service/ ./auth-service/
EXPOSE 5001
CMD ["node", "auth-service/server.js"]
