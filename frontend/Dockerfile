FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production build (собирает свежий .next при каждом билде)
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
