#!/bin/sh
set -e

echo "=== iAppoint Starting (Docker) ==="

# Clear cached config (build-time cache has no real env vars)
php /var/www/html/artisan config:clear
php /var/www/html/artisan cache:clear

# Run migrations
echo "Running migrations..."
php /var/www/html/artisan migrate --force

# Cache config with real env vars now available
echo "Caching config..."
php /var/www/html/artisan config:cache
php /var/www/html/artisan route:cache
php /var/www/html/artisan view:cache

# Start supervisor (nginx + php-fpm + queue worker)
echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
