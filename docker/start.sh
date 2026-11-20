#!/bin/sh

echo "=== iAppoint Starting ==="
cd /var/www/html

# Fix storage + cache permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

# Migrations
echo "--- Migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# Seed
echo "--- Seeding ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# Storage link
php artisan storage:link --force 2>/dev/null || true

# Scheduler
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

# Keep-alive
(while true; do sleep 270; wget -q -O /dev/null http://localhost:8080/up 2>/dev/null || true; done) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
