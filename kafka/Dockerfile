FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY consumers ./consumers

CMD ["node", "consumers/emailConsumer.js"]
