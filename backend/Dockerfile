FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
# prisma.config.ts exige DATABASE_URL mesmo no generate (não conecta no DB)
ENV DATABASE_URL="postgresql://dev_user:dev_password@localhost:5435/workapool_dev"
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 3001
# Projeto é ESM sem extensão .js nos imports — `node .build/...` quebra; tsx resolve como no dev
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]