FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV START_FILE=server.js
ENV STATIC_DIR=/app/static

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001
CMD ["sh", "-c", "node ${START_FILE}"]
