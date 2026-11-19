#!/bin/sh

echo "=== iAppoint Starting ==="
echo "APP_ENV: ${APP_ENV} | PHP: $(php -r 'echo PHP_VERSION;')"

cd /var/www/html

# Fix storage + cache permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

# Generate package manifest (creates services.php with production packages only)
# This must run BEFORE any other artisan command
echo "--- Package discovery ---"
php artisan package:discover --ansi 2>&1 || true

# Migrations
echo "--- Migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# Seed
echo "--- Seeding ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# Storage link
php artisan storage:link --force 2>/dev/null || true

# Scheduler background
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

# Keep-alive ping every 5 min
(while true; do sleep 270; wget -q -O /dev/null http://localhost:8080/up 2>/dev/null || true; done) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
