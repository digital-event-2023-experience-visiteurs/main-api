FROM node:19.2.0-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY .env ./
COPY creneaux.json ./
COPY app.js ./
ADD routes ./routes/
RUN npm ci

CMD npm run start