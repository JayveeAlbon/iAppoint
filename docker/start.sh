#!/bin/sh
set -e

echo "=== iAppoint Starting ==="
cd /var/www/html

# 1. Permissions
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache
touch storage/logs/laravel.log && chmod 666 storage/logs/laravel.log

# 2. Package discovery (creates bootstrap/cache/packages.php + services.php)
#    Required before ANY artisan command — without it Laravel can't find providers
php -r "
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make('Illuminate\Foundation\PackageManifest')->build();
echo 'Package manifest built.' . PHP_EOL;
" 2>&1 || echo "WARN: manifest build failed, continuing..."

# 3. Clear any stale cache
php artisan config:clear  2>/dev/null || true
php artisan cache:clear   2>/dev/null || true
php artisan route:clear   2>/dev/null || true
php artisan view:clear    2>/dev/null || true

# 4. Migrations
echo "--- Running migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed"

# 5. Seed
echo "--- Seeding ---"
php artisan db:seed --force --no-interaction 2>&1 || echo "WARN: seed failed"

# 6. Storage link
php artisan storage:link --force 2>/dev/null || true

# 7. Scheduler
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

echo "--- Starting supervisord ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
