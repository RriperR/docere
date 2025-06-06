# Сборка фронтенда
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Сохраняем только build-артефакты
FROM alpine:3.18
WORKDIR /react
COPY --from=builder /app/dist ./dist
