# Dockerfile для Angular
# Stage 1: Build the Angular app
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Stage 2: Nginx для размещения собранного Angular приложения
FROM nginx:alpine
COPY --from=build /app/dist/testappdzencode.client/browser /usr/share/nginx/html
EXPOSE 80