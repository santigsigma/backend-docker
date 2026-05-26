FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY index.js .

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV DB_HOST=mysql
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=password
ENV DB_NAME=dbapp

EXPOSE 8080

CMD ["node", "index.js"]
