FROM node:22.12.0-alpine AS builder
LABEL maintainer="Mannatpreet Singh Khurana <khurana.mannat22@gmail.com>"
LABEL description="Fragments node.js microservice (build stage)"

ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

FROM node:22.12.0-alpine AS production
LABEL maintainer="Mannatpreet Singh Khurana <khurana.mannat22@gmail.com>"
LABEL description="Fragments node.js microservice (production)"

ENV PORT=8080
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

RUN apk add --no-cache \
    vips=8.15.3-r5 \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/src ./src
COPY --from=builder /app/tests/.htpasswd ./tests/.htpasswd

EXPOSE 8080

CMD ["node", "src/index.js"]
