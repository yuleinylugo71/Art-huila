FROM node:20-alpine AS deps

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS prod-deps

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/product-import-data.json ./product-import-data.json
COPY --from=build --chown=node:node /app/package*.json ./

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
