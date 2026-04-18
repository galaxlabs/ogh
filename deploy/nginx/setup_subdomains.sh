#!/usr/bin/env bash
set -e

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash deploy/nginx/setup_subdomains.sh you@example.com"
  exit 1
fi

EMAIL="$1"
CONF_SRC="/home/fg/ogh/deploy/nginx/openguidehub.server.conf"
CONF_DST="/etc/nginx/sites-available/openguidehub-subdomains.conf"
LINK_DST="/etc/nginx/sites-enabled/openguidehub-subdomains.conf"

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
ufw allow 'Nginx Full' || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true

cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" "$LINK_DST"
nginx -t
systemctl reload nginx

certbot --nginx \
  -d admin.openguidehub.org \
  -d api.openguidehub.org \
  -d health.openguidehub.org \
  --redirect \
  --agree-tos \
  -m "$EMAIL" \
  --non-interactive

nginx -t
systemctl reload nginx

echo
echo "Done. Test these URLs:"
echo "  https://admin.openguidehub.org/_/"
echo "  https://api.openguidehub.org/health"
echo "  https://health.openguidehub.org/"
