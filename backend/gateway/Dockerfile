FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./gateway/package*.json ./gateway/
RUN cd gateway && npm install --omit=dev

COPY --chown=node:node gateway ./gateway
COPY --chown=node:node shared ./shared

WORKDIR /app/gateway

USER node

EXPOSE 8000

CMD ["npm", "start"]