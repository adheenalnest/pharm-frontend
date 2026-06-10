FROM node:22-alpine AS build

# Accept corporate proxy at build time (pass via --build-arg in Jenkinsfile)
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY=localhost,127.0.0.1

# Trust corporate Sophos SSL inspection CA
COPY ["sophos-root-ca.crt", "/tmp/sophos-root-ca.crt"]
COPY ["sophos-ssl-ca.crt", "/tmp/sophos-ssl-ca.crt"]
RUN cat /tmp/sophos-root-ca.crt /tmp/sophos-ssl-ca.crt > /usr/local/corporate-ca.pem \
    && cat /tmp/sophos-root-ca.crt /tmp/sophos-ssl-ca.crt >> /etc/ssl/certs/ca-certificates.crt

ENV NODE_EXTRA_CA_CERTS=/usr/local/corporate-ca.pem
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# Give Node more heap space to prevent OOM kills during npm install
ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app
COPY package*.json ./

# Configure npm for corporate network in a separate layer (cached independently)
RUN npm config set cafile /usr/local/corporate-ca.pem \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && if [ -n "$HTTPS_PROXY" ]; then \
         npm config set proxy "$HTTP_PROXY" && npm config set https-proxy "$HTTPS_PROXY"; \
       fi

# Install dependencies — use npm install (more resilient than npm ci under proxy/TLS inspection)
# npm ci triggers a known "Exit handler never called" bug under certain proxy+TLS conditions
RUN npm install --prefer-offline --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine AS final
COPY --from=build /app/dist/pharm-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
