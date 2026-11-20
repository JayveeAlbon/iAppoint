#!/bin/sh

echo "=== iAppoint Starting ==="
cd /var/www/html

# Fix storage + cache permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

echo "--- Starting supervisord (nginx + php-fpm) ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
