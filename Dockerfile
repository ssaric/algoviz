# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:24-alpine AS build-stage
# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /usr/src/app

# Installing dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copying source files
COPY . .

# Building app
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
#
# nginx has no official brotli module -- nginx.org packages geoip, image-filter,
# njs, perl, xslt, otel and acme, but not brotli -- so a third-party build is
# the only way to get brotli_static, which is what serves the precompressed
# assets adapter-static produces. Pinned so a rebuild cannot silently move to a
# different nginx: the tag tracks stable and moved to 1.30.4 recently.
FROM fholzer/nginx-brotli:v1.30.4

COPY --from=build-stage /usr/src/app/build/ /usr/share/nginx/html
# Copy the default nginx.conf provided by tiangolo/node-frontend
COPY --from=build-stage /usr/src/app/nginx.conf /etc/nginx/conf.d/default.conf
