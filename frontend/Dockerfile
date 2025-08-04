
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

ENV PORT=5173
ENV VITE_API_BASE_URL=http://localhost:8000/v1
COPY . .

EXPOSE ${PORT}

CMD npm run dev -- --host 0.0.0.0 --port ${PORT}
