# Better Bedwars Website — Complete Setup Guide

This guide walks you through setting up the entire Better Bedwars website from scratch, including Supabase database, Netlify deployment, file storage, and admin configuration.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1: Supabase Setup](#2-step-1-supabase-setup)
3. [Step 2: File Storage (Cloudflare R2 / AWS S3 / Supabase Storage)](#3-step-2-file-storage)
4. [Step 3: Netlify Setup](#4-step-3-netlify-setup)
5. [Step 4: Configure Environment Variables](#5-step-4-configure-environment-variables)
6. [Step 5: Update Frontend API Configuration](#6-step-5-update-frontend-api-configuration)
7. [Step 6: Deploy to Netlify](#7-step-6-deploy-to-netlify)
8. [Step 7: Create Admin User](#8-step-7-create-admin-user)
9. [Step 8: Log into Admin Dashboard](#9-step-8-log-into-admin-dashboard)
10. [Step 9: Configure Site Settings](#10-step-9-configure-site-settings)
11. [Step 10: Add Packs and Versions](#11-step-10-add-packs-and-versions)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Before you begin, you'll need accounts for these services (all have free tiers):

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | Database + Auth | 500MB database, 2GB storage |
| [Netlify](https://netlify.com) | Hosting + Serverless Functions | 100GB bandwidth, 125K functions/mo |
| [Cloudflare R2](https://cloudflare.com) or [AWS S3](https://aws.amazon.com/s3/) | File storage for ZIP/images | 10GB free (R2), 5GB free (S3) |

You'll also need:
- Git installed on your machine
- Node.js v18+ installed
- A code editor (VS Code recommended)
- A terminal (CMD, PowerShell, or Git Bash)

---

## 2. Step 1: Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click **"New project"**
3. Fill in:
   - **Name:** `better-bedwars` (or whatever you prefer)
   - **Database Password:** Generate a strong password and **save it somewhere safe**
   - **Region:** Choose the closest one to you (e.g., `London (europe-west2)`)
   - **Pricing Plan:** Free tier is fine to start
4. Click **"Create new project"**
5. Wait 1-2 minutes for the database to provision

### 2.2 Get Your Supabase Credentials

Once the project is created, you'll see the dashboard. Find these values:

1. Go to **Project Settings** → **API**
2. Copy these two values (you'll need them later):
   - **Project URL** (looks like: `https://abcdefghijklm.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
3. Go to **Project Settings** → **API** → scroll to **`service_role` key**
   - Click **"Reveal"** and copy this too (keep it secret — this is your admin key!)

### 2.3 Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents and paste it into the SQL editor
5. Click **"Run"** (or press `Ctrl + Enter`)
6. Wait for all queries to complete (you should see "Success" with no errors)

**What this does:**
- Creates all 9 database tables (packs, versions, downloads, site_settings, etc.)
- Sets up Row Level Security (public read, service-role write)
- Creates indexes for performance
- Inserts seed data (sample packs, staff, rules, site settings)

### 2.4 Create a Storage Bucket (for file uploads)

If you want to store ZIP files and images in Supabase Storage:

1. Go to **Storage** in the left sidebar
2. Click **"Create bucket"**
3. Name: `pack-files`
4. Check **"Public bucket"** (so downloads work without auth)
5. Click **"Create bucket"**

You can also use Cloudflare R2 or AWS S3 instead — see Section 3.

---

## 3. Step 2: File Storage

You have three options for storing ZIP files and images. Choose one:

### Option A: Supabase Storage (Simplest)

Already set up in Step 2.4. Just upload files:
1. Go to **Storage** → `pack-files`
2. Click **"Upload"** to add ZIP files or images
3. Copy the public URL of each file

### Option B: Cloudflare R2 (Recommended for large files)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Create a bucket called `better-bedwars`
3. Go to **Settings** → **Public Access** and enable it
4. Upload your ZIP files and images
5. Each file gets a URL like: `https://pub-xxxxx.r2.dev/pack-name.zip`

### Option C: AWS S3

1. Create an S3 bucket (e.g., `better-bedwars-files`)
2. Enable **Static website hosting** or use CloudFront
3. Upload files and make them public
4. Get the public URLs

---

## 4. Step 3: Netlify Setup

### 4.1 Install Netlify CLI (Optional but Recommended)

Open a terminal in the project folder:

```bash
npm install -g netlify-cli
```

### 4.2 Push to GitHub (or Git provider)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Better Bedwars website"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/better-bedwars.git
git push -u origin main
```

### 4.3 Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your `better-bedwars` repository
5. Configure build settings (Netlify will auto-detect these from `netlify.toml`):
   - **Build command:** leave blank (it's a static site)
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions` (auto-detected)
6. Click **"Deploy site"**

### 4.4 Initial Deploy

Netlify will automatically deploy your site. The first deploy will fail because we haven't set up environment variables yet. That's normal — we'll fix it next.

Your site will get a random URL like: `https://random-name-123456.netlify.app`

---

## 5. Step 4: Configure Environment Variables

### 5.1 Add Environment Variables in Netlify

1. In your Netlify dashboard, go to **Site settings** → **Environment variables**
2. Click **"Add variable"** and add these:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase project URL (from Step 2.2) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key (from Step 2.2) |
| `ADMIN_SECRET_KEY` | Create a strong random string (this protects your admin panel) |

To generate a strong `ADMIN_SECRET_KEY`:

```bash
# Run this in terminal to generate one:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5.2 Create a Local `.env` File (For Local Development)

Create a file called `.env` in the project root (this is for local testing with netlify dev):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET_KEY=your-generated-secret-key
```

**IMPORTANT:** Never commit this `.env` file to git! It's already in `.gitignore`.

---

## 6. Step 5: Update Frontend API Configuration

The frontend needs to know your Supabase URL and anon key to read data. There are two ways to do this:

### Method A: Using Netlify Inject (Recommended — Most Secure)

1. In Netlify dashboard, go to **Site settings** → **Build & deploy** → **Post processing** → **Snippet injection**
2. Add this snippet in the `<head>` section (before closing `</head>`):

```html
<script>
  window.SUPABASE_URL = 'https://your-project.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
```

3. Click **"Save"** and redeploy

**Why this is best:** Your anon key is injected server-side, never visible in your source code.

### Method B: Edit api.js Directly (Simpler for Testing)

Open `public/js/api.js` and replace the defaults:

```javascript
const SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key-here';
```

Replace `https://your-project.supabase.co` and `your-anon-key-here` with your actual values.

### Method C: Replace Placeholders in admin/index.html

In `public/admin/index.html`, search for `{{SUPABASE_URL}}` and `{{SUPABASE_ANON_KEY}}` and replace them with your actual values:

```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const anonKey = 'your-anon-key-here';
```

---

## 7. Step 6: Deploy to Netlify

### Option A: Automatic Deploy (Connected to Git)

Just push to your GitHub repository:

```bash
git add .
git commit -m "Update API configuration"
git push
```

Netlify will automatically redeploy.

### Option B: Manual Deploy via CLI

```bash
# Install netlify-cli if you haven't
npm install -g netlify-cli

# Deploy to production
netlify deploy --prod --dir=public --functions=netlify/functions

# Or deploy to draft URL for testing
netlify deploy --dir=public --functions=netlify/functions
```

### Option C: Drag & Drop (Easiest for Testing)

1. After building locally, go to Netlify dashboard
2. Go to **Sites** → **Drag and drop your site output folder here**
3. Drag the entire `public` folder onto the drop zone
4. **BUT** this won't deploy the serverless functions — use Option A or B for full functionality

### Verify Deployment

After deploying, visit your Netlify URL. You should see the Better Bedwars homepage with:
- ✅ Navigation bar working
- ✅ Announcement bar (if enabled)
- ✅ Footer with links
- ✅ Theme toggle working
- ✅ Features section displaying

---

## 8. Step 7: Create Admin User

You need to create an admin user in the database to log into the admin panel.

### Method A: Using Supabase SQL Editor

1. Go to your Supabase dashboard → **SQL Editor**
2. Create a new query and run:

```sql
-- Create an admin user
INSERT INTO admin_users (username, password_hash, display_name, role)
VALUES (
  'admin',                          -- username
  'your-password-here',             -- password (plain text for now - use bcrypt in production)
  'Admin',                          -- display name
  'superadmin'                      -- role: 'admin' or 'superadmin'
);
```

Replace `your-password-here` with a strong password.

**Important Security Note:** In production, you should hash the password with bcrypt. For now, this works because the function checks against the stored value. In a real deployment, modify `netlify/functions/admin-auth.js` to use proper password hashing.

### Method B: Using Supabase Dashboard (Table Editor)

1. Go to **Table Editor** in Supabase
2. Select the `admin_users` table
3. Click **"Insert row"**
4. Fill in:
   - `username`: `admin`
   - `password_hash`: `your-password`
   - `display_name`: `Admin`
   - `role`: `superadmin`
   - `is_active`: `true`
5. Click **"Save"**

---

## 9. Step 8: Log into Admin Dashboard

1. Go to `https://your-site.netlify.app/admin/login.html`
2. Enter the username and password you created in Step 7
3. Click **"Sign In"**
4. You'll be redirected to the admin dashboard

**What you'll see:**
- 📊 Dashboard with stats (packs, downloads, versions)
- 📦 Packs management (create, edit, delete packs)
- 🔖 Versions management (add versions to packs)
- ⚡ Site Settings (all editable fields)
- 📈 Analytics (download tracking)

---

## 10. Step 9: Configure Site Settings

From the admin dashboard, go to the **⚡ Site Settings** tab. Here's what each field does:

### General Settings
| Field | What it does |
|-------|-------------|
| **Site Name** | Shows in browser tab title and navigation |
| **Description** | Meta description for SEO |
| **Hero Title** | The big heading on the homepage |
| **Hero Subtitle** | Text below the hero heading |
| **Featured Pack ID** | Which pack shows as "featured" (e.g., `better-bedwars`) |

### Announcement Banner
| Field | What it does |
|-------|-------------|
| **Announcement Text** | The message shown in the top banner |
| **Type** | Color scheme (Info=blue, Warning=orange, Success=green, Danger=red) |
| **Enable** | Toggle the banner on/off |

### Social Links
Set your Discord, YouTube, GitHub URLs and contact email. These appear in the footer and across the site.

### Minecraft Server
| Field | What it does |
|-------|-------------|
| **Server IP** | Your Minecraft server IP (shown on server page) |
| **Server Name** | Your server's display name |

### Footer
| Field | What it does |
|-------|-------------|
| **Footer Text** | Copyright text at the bottom |
| **Footer Links** | JSON array of links. Example: `[{"label":"Privacy","url":"/privacy"},{"label":"Terms","url":"/terms"}]` |

### Branding Colors
Change the look and feel of the entire site. Use the color picker or type hex values directly.

**After making changes, click "💾 Save All Settings"** and refresh your main site to see the changes.

---

## 11. Step 10: Add Packs and Versions

### Add a Pack

1. Go to **📦 Packs** tab in admin
2. Click **"+ New Pack"**
3. Fill in:
   - **Pack ID:** URL-friendly slug (e.g., `my-awesome-pack`)
   - **Name:** Display name
   - **Description:** Full description (shown on pack page)
   - **Short Description:** Brief summary (shown in grid cards)
   - **Category:** Type of pack
   - **Author:** Creator name
   - **Minecraft Versions:** Comma separated (e.g., `1.8.9, 1.19, 1.20`)
   - **Icon URL:** Small icon image URL
   - **Banner URL:** Large banner image URL
   - **Screenshots:** JSON array of image URLs
   - **Featured:** Check to mark as featured
   - **Published:** Uncheck to hide from public
4. Click **"💾 Save Pack"**

### Add a Version

1. Go to **🔖 Versions** tab in admin
2. Click **"+ New Version"**
3. Fill in:
   - **Pack:** Select which pack this version belongs to
   - **Version Number:** e.g., `1.0.0`
   - **Minecraft Version:** e.g., `1.8.9 - 1.20`
   - **File URL:** Direct link to the ZIP file (in your storage)
   - **File Size:** Size in bytes (you can calculate: `node -e "console.log(require('fs').statSync('file.zip').size)"`)
   - **Changelog:** Markdown text describing what's new
   - **Mark as Latest:** Check if this is the newest version
4. Click **"💾 Save Version"**

### Upload Files to Storage

Before adding a version, you need to upload the ZIP file somewhere:

**Using Supabase Storage:**
1. Go to Supabase → **Storage** → `pack-files`
2. Click **"Upload"** and select your ZIP file
3. Click the file to copy its **public URL**
4. Use that URL in the Version's **File URL** field

**Using any other storage:** Just get a public URL for your file.

---

## 12. Troubleshooting

### ❌ Site loads but shows no data

**Problem:** The frontend can't reach Supabase.  
**Solution:** Check that:
- `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` are correctly set (using Netlify snippet injection or in api.js)
- Your Supabase project is not paused (free projects pause after 1 week of inactivity — wake it up in the dashboard)
- Your anon key is correct and has RLS access to read tables

### ❌ Admin login returns "Invalid credentials"

**Problem:** Can't log into admin panel.  
**Solution:**
- Verify the admin user exists in the `admin_users` table
- Check that `is_active` is set to `true`
- Make sure the password matches exactly what's in `password_hash`
- Verify the `ADMIN_SECRET_KEY` environment variable is set in Netlify

### ❌ Netlify Functions return 401 or 500

**Problem:** Serverless functions aren't working.  
**Solution:**
- Check Netlify deploy logs for function build errors
- Verify all environment variables are set in Netlify
- Make sure `SUPABASE_SERVICE_ROLE_KEY` has the correct permissions
- Check that `netlify/functions/` directory is in the root (not inside `public/`)

### ❌ "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" error

**Problem:** Environment variables not being read.  
**Solution:**
- Go to Netlify → **Site settings** → **Environment variables**
- Make sure the keys are spelled exactly: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Redeploy after adding variables
- Wait a few minutes for the environment to propagate

### ❌ Download counter not incrementing

**Problem:** Clicking download doesn't increase the counter.  
**Solution:**
- Check that `track-download` function is deployed
- Verify the function can reach Supabase (check function logs in Netlify)
- The function uses `supabase.rpc('increment_pack_downloads', ...)` — you may need to create this function in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION increment_pack_downloads(pack_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE packs SET download_count = download_count + 1 WHERE id = pack_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ❌ Images not loading

**Problem:** Screenshots and banners show broken images.  
**Solution:**
- Make sure your image URLs are publicly accessible
- If using Supabase storage, make sure the bucket is set to **Public**
- Check CORS settings if using Cloudflare R2

### ❌ Minecraft server status shows offline

**Problem:** Server IP box shows "Status unavailable".  
**Solution:**
- The site uses `api.mcsrvstat.us/2/YOUR_IP` to check status
- This API doesn't work with all server types (e.g., Bedrock servers)
- Make sure the server IP is correctly set in site settings
- The server needs to have query enabled in `server.properties`

### ❌ Mobile menu not working

**Problem:** Hamburger button doesn't open the menu.  
**Solution:**
- Check that the mobile nav elements exist in the HTML
- The JavaScript in `app.js` handles this automatically
- If you removed or renamed classes, update the selectors in `setupNavigation()`

---

## Quick Reference Cards

### All Environment Variables Needed

```
# Required for Netlify Functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Service role key (secret!)
ADMIN_SECRET_KEY=a1b2c3...               # Random hex string

# Required for Frontend (via snippet injection or api.js)
# (Not environment variables - set in the HTML/JS)
SUPABASE_URL (same as above)
SUPABASE_ANON_KEY=eyJ...                 # Anon public key
```

### Database Tables Overview

| Table | Purpose | Public Read |
|-------|---------|-------------|
| `site_settings` | All configurable site content | ✅ Yes |
| `packs` | Texture pack metadata | ✅ Yes (published only) |
| `versions` | Version history per pack | ✅ Yes |
| `downloads` | Download log | ❌ No (write-only) |
| `staff` | Server staff members | ✅ Yes (active only) |
| `rules` | Server rules | ✅ Yes |
| `server_features` | Server feature highlights | ✅ Yes |
| `admin_users` | Admin login credentials | ❌ No |
| `page_views` | Basic analytics | ❌ No |

### File Storage Summary

| File Type | Where to Store | URL Pattern |
|-----------|---------------|-------------|
| Pack ZIP files | Supabase Storage / Cloudflare R2 / S3 | `https://.../pack-name.zip` |
| Screenshots | Any image hosting | `https://.../screenshot.png` |
| Pack icons | Any image hosting | `https://.../icon.png` |
| Pack banners | Any image hosting | `https://.../banner.png` |

---

## Need Help?

If you run into issues:

1. **Check Netlify deploy logs** — they show exactly what went wrong
2. **Check Netlify function logs** — go to **Functions** in your site dashboard
3. **Check Supabase logs** — go to **Database** → **Query logs**
4. **Open browser dev tools** (`F12`) → **Console** tab for JavaScript errors
5. **Test your Supabase connection directly** — use the SQL Editor to verify tables exist

The website is designed to degrade gracefully — if the database is unreachable, it still shows a functional static page with the default content.