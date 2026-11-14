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
echo "--- Fixing storage permissions ---"
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log
chmod 666 storage/logs/laravel.log

# Clear ALL cached config from build time before anything else
echo "--- Clearing build-time cache ---"
php artisan config:clear  2>/dev/null || true
php artisan cache:clear   2>/dev/null || true
php artisan route:clear   2>/dev/null || true
php artisan view:clear    2>/dev/null || true

# Test database connection
echo "--- Testing database connection ---"
php -r "
try {
    \$pdo = new PDO(
        '${DB_CONNECTION}:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}',
        '${DB_USERNAME}',
        '${DB_PASSWORD}'
    );
    echo 'DB connection OK' . PHP_EOL;
} catch (Exception \$e) {
    echo 'DB connection FAILED: ' . \$e->getMessage() . PHP_EOL;
}
" || true

# Run migrations
echo "--- Running migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# Seed default users
echo "--- Seeding default users ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# Cache config/routes/views
echo "--- Caching config ---"
php artisan config:cache  || echo "WARN: config:cache failed"
php artisan route:cache   || echo "WARN: route:cache failed"
php artisan view:cache    || echo "WARN: view:cache failed"

# Ensure storage link exists
php artisan storage:link --force 2>/dev/null || true

# Start the Laravel scheduler in the background (runs every minute, checks every 15 min for reminders)
echo "--- Starting scheduler ---"
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

echo "--- Starting supervisord (nginx + php-fpm + queue) ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
