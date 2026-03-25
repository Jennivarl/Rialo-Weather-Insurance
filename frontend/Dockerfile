# Stage 1: Build the Vite React app
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# VITE_* vars are injected at build time via Railway env vars
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_PRIVY_APP_ID
ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
