FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install \
 && npm install --no-save @rollup/rollup-linux-x64-gnu@4.53.2

COPY . .

EXPOSE 3003

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3003"]

