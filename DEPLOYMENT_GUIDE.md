# iAppoint — Complete Deployment Guide

This guide walks you through deploying iAppoint from your local machine to GitHub and then to a public hosting platform so **anyone can access it via a URL**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Push Code to GitHub](#2-push-code-to-github)
3. [Deploy to Railway](#3-deploy-to-railway-recommended)
4. [Deploy to Render](#4-deploy-to-render)
5. [Deploy to Fly.io](#5-deploy-to-flyio)
6. [Set Up Auto-Deploy (CI/CD)](#6-set-up-auto-deploy-cicd)
7. [Configure Google OAuth for Production](#7-configure-google-oauth-for-production)
8. [Configure Email (Mail)](#8-configure-email-for-production)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Install these tools on your Windows machine before starting:

| Tool | Download Link | Why |
|---|---|---|
| **Git** | https://git-scm.com/download/win | Push code to GitHub |
| **GitHub CLI** (optional) | https://cli.github.com/ | Create GitHub repos from terminal |
| **Node.js 20** | https://nodejs.org/en/download | Build frontend |
| **PHP 8.2** | https://windows.php.net/download/ | Run Laravel locally |

After installing Git, open a new terminal and verify:
```
git --version
```

---

## 2. Push Code to GitHub

### Step 1 — Create a GitHub account
Go to https://github.com/signup and create a free account.

### Step 2 — Create a new repository
1. Go to https://github.com/new
2. Repository name: `iappoint`
3. Set to **Private** (recommended) or **Public**
4. Do NOT check "Add a README" (we already have one)
5. Click **Create repository**

### Step 3 — Initialize Git and push from your project folder

Open PowerShell in your project folder (`c:\iAppoint System (2)\iAppoint`) and run these commands **one at a time**:

```powershell
# Initialize a git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit — iAppoint system"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/iappoint.git

# Push to GitHub
git branch -M main
git push -u origin main
```

> **Note:** Your `.env` file is in `.gitignore` so it will NOT be pushed (your real passwords stay safe).

---

## 3. Deploy to Railway (Recommended)

Railway is the easiest option — free tier available, supports PHP + MySQL.

**Time to complete: ~10 minutes**

### Step 1 — Create a Railway account
Go to https://railway.app and sign up with your GitHub account.

### Step 2 — Create a new project
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Authorize Railway to access your GitHub account
4. Select your `iappoint` repository

### Step 3 — Add a MySQL database
1. Inside your Railway project, click **+ Add Service**
2. Select **Database → MySQL**
3. Railway will automatically link the `DATABASE_URL` to your app

### Step 4 — Set environment variables
In Railway, go to your web service → **Variables** tab and add:

```
APP_NAME=iAppoint
APP_ENV=production
APP_DEBUG=false
APP_URL=https://YOUR-APP-NAME.up.railway.app

DB_CONNECTION=mysql
# DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
# are auto-set by Railway when you link the MySQL service

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

LOG_CHANNEL=stderr

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your_mailgun_username
MAIL_PASSWORD=your_mailgun_password
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=iAppoint

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 5 — Deploy
Railway will automatically detect `railway.json` and `nixpacks.toml` in your project and start building. Watch the build logs — when it says **"Deploy succeeded"**, your app is live!

### Step 6 — Get your public URL
Go to your service → **Settings** → **Domains** → click **Generate Domain**.
Your app URL will be something like `https://iappoint-production.up.railway.app`.

### Step 7 — Update APP_URL
Set `APP_URL` in Railway Variables to your actual generated URL.

---

## 4. Deploy to Render

**Time to complete: ~15 minutes**

### Step 1 — Create a Render account
Go to https://render.com and sign up with your GitHub account.

### Step 2 — Deploy using render.yaml (Blueprint)
1. Go to https://dashboard.render.com/blueprints
2. Click **New Blueprint Instance**
3. Connect your GitHub repo (`iappoint`)
4. Render will detect `render.yaml` automatically and create:
   - A web service for the Laravel app
   - A MySQL database

### Step 3 — Set secret environment variables
After the blueprint deploys, go to your web service → **Environment** and add these manually (they contain secrets):

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MAIL_USERNAME=your_mail_username
MAIL_PASSWORD=your_mail_password
```

### Step 4 — Trigger a deploy
Click **Manual Deploy → Deploy latest commit**.

### Step 5 — Get your URL
Your app will be at `https://iappoint.onrender.com` (or similar).

> **Free tier note:** Render's free web services spin down after 15 minutes of inactivity. The first request after idle takes ~30 seconds. Upgrade to "Starter" plan ($7/mo) for always-on.

---

## 5. Deploy to Fly.io

Fly.io uses Docker and has a generous free tier.

**Time to complete: ~20 minutes**

### Step 1 — Install Fly CLI
```powershell
# Windows (PowerShell, run as Administrator)
iwr https://fly.io/install.ps1 -useb | iex
```

### Step 2 — Create a Fly.io account and login
```powershell
flyctl auth signup
# or if you already have an account:
flyctl auth login
```

### Step 3 — Launch the app
In your project folder, run:
```powershell
flyctl launch --no-deploy
```
- When asked for app name, enter: `iappoint` (or any unique name)
- When asked for region, choose: `sin` (Singapore) or your nearest region
- When asked to set up a database, say **Yes** to create a MySQL/Postgres database

### Step 4 — Set environment secrets
```powershell
flyctl secrets set APP_KEY="$(php artisan key:generate --show)"
flyctl secrets set APP_ENV="production"
flyctl secrets set APP_DEBUG="false"
flyctl secrets set DB_CONNECTION="mysql"
flyctl secrets set DB_HOST="your-fly-db-host"
flyctl secrets set DB_DATABASE="iappoint"
flyctl secrets set DB_USERNAME="iappoint"
flyctl secrets set DB_PASSWORD="your-db-password"
flyctl secrets set GOOGLE_CLIENT_ID="your-google-client-id"
flyctl secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"
flyctl secrets set MAIL_MAILER="smtp"
flyctl secrets set MAIL_HOST="smtp.mailgun.org"
flyctl secrets set MAIL_USERNAME="your-mail-user"
flyctl secrets set MAIL_PASSWORD="your-mail-password"
```

### Step 5 — Deploy
```powershell
flyctl deploy
```

### Step 6 — Open your app
```powershell
flyctl open
```

Your app will be at `https://iappoint.fly.dev`.

---

## 6. Set Up Auto-Deploy (CI/CD)

Once you've deployed manually once, set up automatic deployments so every `git push` to `main` automatically deploys.

The file `.github/workflows/deploy.yml` already exists in your project. You just need to add secrets to GitHub.

### For Railway

1. Go to Railway → your project → **Account Settings → Tokens**
2. Create a new token, copy it
3. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
4. Add new secret: `RAILWAY_TOKEN` = (paste your Railway token)
5. In GitHub repo → **Settings → Variables → Actions**, add: `DEPLOY_TARGET` = `railway`

Now every push to `main` will auto-deploy to Railway!

### For Render

1. Go to Render → your service → **Settings** → scroll to **Deploy Hook**
2. Copy the deploy hook URL
3. Go to your GitHub repo → **Settings → Secrets → Actions**
4. Add new secret: `RENDER_DEPLOY_HOOK_URL` = (paste the URL)
5. In GitHub Variables, set: `DEPLOY_TARGET` = `render`

### For Fly.io

1. Run: `flyctl tokens create deploy -x 999999h`
2. Copy the token
3. Go to GitHub repo → **Settings → Secrets → Actions**
4. Add new secret: `FLY_API_TOKEN` = (paste the token)
5. In GitHub Variables, set: `DEPLOY_TARGET` = `fly`

---

## 7. Configure Google OAuth for Production

After deploying, update your Google OAuth credentials:

1. Go to https://console.cloud.google.com/
2. Select your project → **APIs & Services → Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   - `https://YOUR-PRODUCTION-URL/auth/google/callback`
5. Save changes
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your hosting platform's environment variables

---

## 8. Configure Email for Production

The default `.env` uses `MAIL_MAILER=log` (no real emails). For production, you need a real mail provider.

### Option A — Mailtrap (for testing, free)
1. Go to https://mailtrap.io and create a free account
2. Go to **Email Testing → Inboxes** → click your inbox → **SMTP Settings**
3. Set in your environment:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=sandbox.smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your_mailtrap_username
   MAIL_PASSWORD=your_mailtrap_password
   ```

### Option B — Mailgun (for real emails, free up to 1000/mo)
1. Sign up at https://mailgun.com
2. Add and verify your domain
3. Get SMTP credentials from Mailgun dashboard
4. Set `MAIL_HOST=smtp.mailgun.org`, port `587`

### Option C — Gmail SMTP (quick and free)
1. Enable 2FA on your Google account
2. Generate an **App Password**: https://myaccount.google.com/apppasswords
3. Set:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-gmail@gmail.com
   MAIL_PASSWORD=your-app-password
   ```

---

## 9. Troubleshooting

### "500 Server Error" after deploy
- Check `APP_KEY` is set — run `php artisan key:generate` and copy the output
- Make sure `APP_ENV=production` and `APP_DEBUG=false`
- Check database connection credentials

### Migrations fail
- Verify `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` are correct
- Run manually: `php artisan migrate --force`

### Assets (CSS/JS) not loading
- Make sure `npm run build` ran during deployment
- Check `APP_URL` matches your actual domain exactly (including `https://`)
- Run `php artisan config:cache` and redeploy

### Google login not working
- Verify the redirect URI in Google Console matches exactly: `https://YOUR-DOMAIN/auth/google/callback`
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in the platform env vars

### Queue jobs not processing
- Make sure `QUEUE_CONNECTION=database` is set
- The Docker/Fly.io setup runs a queue worker via supervisord automatically
- On Railway/Render, add a separate worker service running: `php artisan queue:work`

---

## Quick Reference — Files Created for Deployment

| File | Purpose |
|---|---|
| `railway.json` | Railway deployment config |
| `nixpacks.toml` | Railway build steps |
| `render.yaml` | Render Blueprint (web + database) |
| `Dockerfile` | Docker image for Fly.io |
| `fly.toml` | Fly.io app config |
| `docker/nginx.conf` | Nginx web server config inside Docker |
| `docker/supervisord.conf` | Process manager (nginx + php-fpm + queue) |
| `.github/workflows/ci.yml` | Auto test on every push/PR |
| `.github/workflows/deploy.yml` | Auto deploy on push to main |
| `scripts/setup.sh` | One-command production bootstrap script |
| `.env.example` | Environment variable template |
| `.env.ci` | CI-only environment (safe to commit, no real secrets) |
