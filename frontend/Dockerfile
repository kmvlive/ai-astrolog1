FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Запускаем в режиме разработки (не требует сборки)
EXPOSE 3000
CMD ["npm", "run", "dev"]
