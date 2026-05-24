# Review — Fitness Tracker App

A full-featured fitness OS with workout tracking, nutrition logging, weight trend charts, sleep tracking, personal records, and an admin dashboard.

## Features
- 🔐 Login system (Admin + User roles)
- ⚡ Workout logger + Plan builder
- 🍽️ Nutrition tracker with macro bars
- ⚖️ Interactive weight trend chart (Chart.js)
- 😴 Sleep tracker with quality rating
- 🏆 Personal records board
- ⬛ Admin dashboard with analytics
- ✦ Claude AI assistant for all actions

## Login Credentials
| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| User  | user     | user123  |

---

## Deploy to Vercel (Free) — Step by Step

### Option A: Vercel CLI (recommended)

1. **Install Node.js** from https://nodejs.org if you haven't already

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Navigate to this folder**
   ```bash
   cd review-fitness
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Sign up / log in when prompted (free account)
   - Accept all defaults (project name, directory, settings)
   - Your app will be live at a `.vercel.app` URL instantly!

5. **For future updates**
   ```bash
   vercel --prod
   ```

---

### Option B: Drag & Drop via Vercel Dashboard (no CLI needed)

1. Go to **https://vercel.com** and sign up for free
2. Click **"Add New → Project"**
3. Choose **"Deploy from your computer"** or use the **"Deploy"** button
4. **Drag and drop** the entire `review-fitness` folder
5. Click **Deploy** — done! You get a free `.vercel.app` URL

---

### Option C: GitHub + Vercel (auto-deploys on push)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → **Import Git Repository**
3. Select your repo → Deploy
4. Every `git push` auto-deploys!

---

## File Structure
```
review-fitness/
├── index.html     ← Main HTML structure
├── style.css      ← All styles & theme
├── app.js         ← All logic, state, Claude API
├── vercel.json    ← Vercel config
└── README.md      ← This file
```

## Notes
- All data is stored in **localStorage** (browser-based, per device)
- The Claude AI chat feature requires the Anthropic API (works when deployed via Claude artifacts or with your own API key added to app.js)
- Admin dashboard shows aggregate stats and activity logs
