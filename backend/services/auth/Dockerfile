FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install --omit=dev

COPY --chown=node:node services/auth ./services/auth
COPY --chown=node:node shared ./shared

WORKDIR /app/services/auth

USER node

EXPOSE 8001

CMD ["npm", "start"]