FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install --omit=dev

COPY --chown=node:node services/agent ./services/agent
COPY --chown=node:node shared ./shared

WORKDIR /app/services/agent

USER node

EXPOSE 8003

CMD ["npm", "start"]