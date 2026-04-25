# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built React app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config if needed (optional, keeping default for now)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
