# Where to? — a single static file served by nginx.
# No build stage, no package manager, nothing to install at image build time.
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="Where to?" \
      org.opencontainers.image.description="A calm launcher that sends you to a random site from your own list." \
      org.opencontainers.image.source="https://github.com/whereisxuezugi/Whereto" \
      org.opencontainers.image.licenses="MIT"

# Server config: security headers, gzip, health endpoint.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The whole app is one file. The sample config is optional and never auto-loaded.
COPY index.html /usr/share/nginx/html/index.html
COPY sample-config.json /usr/share/nginx/html/sample-config.json

EXPOSE 80

# wget ships with the alpine nginx image, so this needs no extra packages.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
