# ─────────────────────────────────────────────────────────────────────────────
# Build stage is intentionally removed from Docker.
# npm install and ng build run on the Jenkins host (where Sophos CA is already
# trusted by the OS), and the compiled dist/ folder is copied in here.
# This avoids the "npm error Exit handler never called" crash that occurs when
# npm makes hundreds of parallel HTTPS connections through Sophos SSL inspection
# inside an Alpine container.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY dist/pharm-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
