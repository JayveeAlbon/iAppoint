<p align="center">
  <img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="300" alt="Laravel Logo" />
</p>

<h1 align="center">iAppoint — Appointment Management System</h1>

<p align="center">
  A web-based appointment scheduling system built with Laravel 12 + React (Inertia.js).<br/>
  Allows students to book appointments with faculty members, with admin oversight and reporting.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-red?logo=laravel" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/PHP-8.2+-purple?logo=php" alt="PHP 8.2" />
  <img src="https://img.shields.io/badge/Inertia.js-2.0-violet" alt="Inertia" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-teal?logo=tailwindcss" alt="Tailwind" />
  <img src="https://github.com/JayveeAlbon/iAppoint/actions/workflows/deploy.yml/badge.svg" alt="Deploy to Render" />
</p>

<p align="center">
  <a href="https://render.com/deploy?repo=https://github.com/JayveeAlbon/iAppoint">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
</p>

---

## Features

- **Student** — Book appointments with faculty, view status, receive email notifications
- **Faculty** — Manage availability schedules, approve/reject appointments, set status
- **Admin** — Full user management, appointment oversight, audit logs, reports/analytics
- **Google OAuth** — Sign in with Google
- **Real-time feedback** — Appointment feedback system after completion
- **Messaging** — In-app conversation between users
- **Maps** — Leaflet-powered location support
- **Charts** — Analytics dashboard with Recharts

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 18, TypeScript, Inertia.js 2 |
| Styling | Tailwind CSS 3, MUI v9 |
| Build | Vite 7 |
| Database | MySQL 8 / SQLite (dev) |
| Auth | Laravel Breeze + Google OAuth (Sanctum) |
| Queue | Database driver |
| Cache | Database driver |

---

## Automatic Deployment (Render)

Every push to `main` automatically deploys to Render via GitHub Actions.

### One-time setup on Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect `JayveeAlbon/iAppoint` — Render reads `render.yaml` and creates the web service + MySQL database automatically
3. In your Render web service → **Settings** → **Deploy Hook** — copy the URL
4. In GitHub → **Settings** → **Secrets and variables** → **Actions** → add secret:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: the deploy hook URL from Render

After that, every `git push main` triggers an automatic deploy.

---

## Local Development Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL 8 (or use SQLite for quick start)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/JayveeAlbon/iAppoint.git
cd iAppoint

# 2. Install PHP dependencies
composer install

# 3. Copy environment file and generate app key
cp .env.example .env
php artisan key:generate

# 4. Configure your database in .env
# DB_CONNECTION=mysql
# DB_DATABASE=iappoint
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Run migrations and seed
php artisan migrate --seed

# 6. Install Node dependencies and build assets
npm install
npm run build

# 7. Start the development server
composer run dev
```

The app will be available at `http://localhost:8000`.

### Access from another laptop on your local network

1. Connect both computers to the same Wi-Fi or local network.
2. On the computer running the app, run `ipconfig` and note its IPv4 address (for example, `192.168.1.25`).
3. Set `APP_URL=http://192.168.1.25:8000` and `VITE_HMR_HOST=192.168.1.25` in `.env`.
4. Restart `composer run dev`, then open `http://192.168.1.25:8000` on the other device.

### Google OAuth Setup (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable "Google Identity"
3. Create OAuth 2.0 credentials
4. Add `http://localhost:8000/auth/google/callback` as an authorized redirect URI
5. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into your `.env`

---

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions for:
- Railway (recommended, free tier)
- Render
- Fly.io

---

## Environment Variables

Copy `.env.example` and fill in the values. Key variables for production:

| Variable | Description |
|---|---|
| `APP_KEY` | Generated with `php artisan key:generate` |
| `APP_URL` | Your public domain (e.g. `https://iappoint.onrender.com`) |
| `APP_ENV` | Set to `production` |
| `APP_DEBUG` | Set to `false` in production |
| `DB_*` | Your MySQL database credentials |
| `MAIL_*` | SMTP credentials (e.g. Mailtrap, SendGrid) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          # Admin-specific controllers
│   │   ├── Auth/           # Authentication controllers
│   │   └── ...             # Feature controllers
│   ├── Middleware/
│   └── Requests/
├── Models/                 # Eloquent models
├── Notifications/          # Email/database notifications
├── Policies/               # Authorization policies
├── Providers/
└── Services/               # Business logic services

resources/
├── js/
│   ├── Components/         # Reusable React components
│   ├── Layouts/            # Page layouts
│   └── Pages/              # Inertia page components
└── views/                  # Blade templates (emails, etc.)

database/
├── migrations/
└── seeders/
```

---

## License

This project is for academic/institutional use.
