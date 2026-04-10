# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_MODE=develop

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --mode ${VITE_MODE}

# --- Serve Stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
