#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# iAppoint — Production Setup Script
# Run once on a fresh server/container to bootstrap the app
# Usage: bash scripts/setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      iAppoint — Production Setup         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 1. Install PHP dependencies (no dev packages)
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# 2. Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📋 Copying .env.example to .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env and fill in your database, mail, and OAuth credentials!"
fi

# 3. Generate application key
echo "🔑 Generating application key..."
php artisan key:generate --force

# 4. Install Node dependencies and build frontend
echo "📦 Installing Node.js dependencies..."
npm ci

echo "🔨 Building frontend assets..."
npm run build

# 5. Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# 6. Cache configuration for performance
echo "⚡ Caching config, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Set storage permissions
echo "📁 Setting storage permissions..."
chmod -R 775 storage bootstrap/cache
php artisan storage:link

echo ""
echo "✅ Setup complete! Your iAppoint app is ready."
echo ""
echo "Next steps:"
echo "  • Make sure your .env has correct DB, MAIL, and GOOGLE_* values"
echo "  • Visit your app URL to verify it's running"
echo "  • Default admin account: see database/seeders/"
echo ""
