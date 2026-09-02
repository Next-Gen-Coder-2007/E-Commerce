FROM node:20-alpine AS dependencies
WORKDIR /app
COPY ../package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5005
USER node
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node ../package*.json ./
COPY --chown=node:node ../shared/ ./shared/
COPY --chown=node:node ./payment-service/ ./payment-service/
EXPOSE 5005
CMD ["node", "payment-service/server.js"]
