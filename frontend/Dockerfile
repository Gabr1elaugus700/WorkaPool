# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Valor vem de docker-compose build.args (arquivo --env-file do Compose).
# ARG não lê .env sozinho; $VAR no default do ARG também não pega o host.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN test -n "$VITE_API_BASE_URL" || (echo "VITE_API_BASE_URL vazio no build" && exit 1)
RUN echo "Building frontend with VITE_API_BASE_URL=$VITE_API_BASE_URL"
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
