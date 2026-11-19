#!/bin/sh

echo "=== iAppoint Starting ==="
echo "APP_ENV:       ${APP_ENV}"
echo "DB_CONNECTION: ${DB_CONNECTION}"
echo "DB_HOST:       ${DB_HOST}"
echo "DB_PORT:       ${DB_PORT}"
echo "DB_DATABASE:   ${DB_DATABASE}"
echo "APP_URL:       ${APP_URL}"
echo "PHP version:   $(php -r 'echo PHP_VERSION;')"

cd /var/www/html

# Fix storage permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log
chmod 666 storage/logs/laravel.log

# Backup the committed services.php BEFORE migrations can overwrite it
# php artisan migrate triggers package:discover which regenerates services.php
# but without a full env the regenerated version is broken
cp bootstrap/cache/services.php /tmp/services.php.bak 2>/dev/null || true
cp bootstrap/cache/packages.php /tmp/packages.php.bak 2>/dev/null || true

# Run migrations
echo "--- Running migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# Restore the correct services.php after migrations may have overwritten it
cp /tmp/services.php.bak bootstrap/cache/services.php 2>/dev/null || true
cp /tmp/packages.php.bak bootstrap/cache/packages.php 2>/dev/null || true

# Seed default users
echo "--- Seeding ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# Storage link
php artisan storage:link --force 2>/dev/null || true

# Scheduler
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

# Keep-alive: ping every 5 minutes to prevent Render free tier spin-down
(while true; do \
    sleep 270; \
    wget -q -O /dev/null http://localhost:8080/up 2>/dev/null || true; \
    wget -q -O /dev/null "${APP_URL}/up" 2>/dev/null || true; \
done) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
