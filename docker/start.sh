#!/bin/sh

echo "=== iAppoint Starting ==="
echo "APP_ENV: ${APP_ENV} | PHP: $(php -r 'echo PHP_VERSION;')"

cd /var/www/html

# Fix storage permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

# Generate package manifest with real env vars available
# This runs package:discover which creates bootstrap/cache/services.php
# using only the packages actually installed (--no-dev was used)
echo "--- Generating package manifest ---"
php artisan package:discover --ansi 2>&1 || echo "WARN: package:discover failed"

# Run migrations
echo "--- Running migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# Seed default users
echo "--- Seeding ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# Storage link
php artisan storage:link --force 2>/dev/null || true

# Scheduler
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

# Keep-alive ping every 5 minutes to prevent Render free tier spin-down
(while true; do \
    sleep 270; \
    wget -q -O /dev/null http://localhost:8080/up 2>/dev/null || true; \
    wget -q -O /dev/null "${APP_URL}/up" 2>/dev/null || true; \
done) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
