FROM node:18

WORKDIR /app

COPY package*.json ./

# Install dependencies and rebuild native modules like bcrypt
RUN npm install

COPY . .

# Optional but recommended:
RUN npx prisma generate
RUN npm rebuild bcrypt --build-from-source

EXPOSE 5000

CMD ["node", "server.js"]
