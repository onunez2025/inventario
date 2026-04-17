# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Argumentos de construcción para Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Ejecutamos el build asegurando que las variables se pasen
RUN VITE_SUPABASE_URL=${VITE_SUPABASE_URL} VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
