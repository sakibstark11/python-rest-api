
FROM node:22-alpine

COPY package*.json ./

RUN npm ci

ENV PORT=5173
COPY . .

EXPOSE ${PORT}

CMD npm run dev -- --host 0.0.0.0 --port ${PORT}
