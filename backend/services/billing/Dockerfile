FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install --omit=dev

COPY --chown=node:node services/billing ./services/billing
COPY --chown=node:node shared ./shared

WORKDIR /app/services/billing

USER node

EXPOSE 8004

CMD ["npm", "start"]