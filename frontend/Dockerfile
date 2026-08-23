# Gorilla frontend — Vite build served as static files by nginx
#
#   docker build -t gorilla-web \
#     --build-arg VITE_API_BASE_URL=https://api.example.com frontend
#   docker run --rm -p 8080:80 gorilla-web
#
# VITE_API_BASE_URL is a BUILD argument, not a run-time one: Vite inlines
# import.meta.env values into the bundle, so the API URL is fixed the moment
# the image is built. Pointing the app at a different backend means rebuilding.

FROM node:22-alpine AS build

WORKDIR /app

# Install from the lockfile first so dependency layers survive source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build


FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://127.0.0.1/ || exit 1
