#!/bin/sh

echo "=== iAppoint Starting ==="
cd /var/www/html

# Fix storage + cache permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

# Run migrations in background so they don't block nginx/php-fpm startup
(
    echo "--- Waiting for DB then migrating ---"
    sleep 10
    php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"
    php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"
    php artisan storage:link --force 2>/dev/null || true
    echo "--- Setup complete ---"
) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
