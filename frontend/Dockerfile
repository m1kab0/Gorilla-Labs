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

# Where the API lives, as seen from inside this container. Overridden under
# Kubernetes, where the bare service name does not resolve for nginx.
ENV API_UPSTREAM=http://api:8000

# Goes into templates/, not conf.d/: the nginx image's entrypoint runs envsubst
# over this and writes the result to /etc/nginx/conf.d/default.conf, which is
# how ${API_UPSTREAM} gets filled in. nginx's own $variables are left alone,
# because envsubst is given an explicit list of environment variables.
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Scripts in this directory are run by the nginx image's entrypoint before
# nginx starts — this one pins the DNS resolver to whatever the environment
# actually uses, so the same image works under Compose and Kubernetes.
COPY docker-entrypoint.d/10-resolver.sh /docker-entrypoint.d/10-resolver.sh
RUN chmod +x /docker-entrypoint.d/10-resolver.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://127.0.0.1/ || exit 1
