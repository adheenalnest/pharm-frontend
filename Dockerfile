FROM node:22-alpine AS build
# Trust corporate Sophos SSL inspection CA
COPY ["sophos-root-ca.crt", "/tmp/sophos-root-ca.crt"]
COPY ["sophos-ssl-ca.crt", "/tmp/sophos-ssl-ca.crt"]
RUN cat /tmp/sophos-root-ca.crt /tmp/sophos-ssl-ca.crt > /usr/local/corporate-ca.pem \
    && cat /tmp/sophos-root-ca.crt /tmp/sophos-ssl-ca.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/corporate-ca.pem
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS final
COPY --from=build /app/dist/pharm-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
