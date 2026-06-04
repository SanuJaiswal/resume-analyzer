# Deployment Guide

Deploy this app in **~15 minutes** using free tiers:
- **Backend** → Render (free)
- **Frontend** → Netlify (free)
- **LLM** → Emergent Universal Key (free credits) or your own OpenAI key

---

## Prerequisites
1. Code pushed to a GitHub repo (private or public)
2. Free accounts on:
   - https://render.com
   - https://netlify.com

---

## Step 1 — Deploy Backend on Render

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| Name | `resume-analyzer-api` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/` |
| Start Command | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

4. Add **Environment Variables**:
```
EMERGENT_LLM_KEY=sk-emergent-3685fBdC4B1DeFb7f0
CORS_ORIGINS=*
```
(We'll lock CORS after Netlify is live.)

5. Click **Create Web Service**. Wait ~3 min for first build.
6. Copy your URL: `https://resume-analyzer-api-xxxx.onrender.com`
7. Test: open `https://<your-url>/api/` — should return `{"message": "Portfolio API running"}`

> **Free tier note**: Render free instances sleep after 15 min. First request takes ~30s to wake. Use https://uptimerobot.com to ping `/api/` every 5 min to keep warm.

---

## Step 2 — Deploy Frontend on Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import from GitHub**
2. Choose the same repo
3. Configure:

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `yarn build` |
| Publish directory | `build` |

4. Add **Environment Variable** (Site settings → Environment variables):
```
REACT_APP_BACKEND_URL=https://resume-analyzer-api-xxxx.onrender.com
```

5. Click **Deploy**. Wait ~2 min.
6. Copy your Netlify URL.

---

## Step 3 — Lock down CORS

1. Render → your backend → **Environment** tab
2. Update `CORS_ORIGINS` to your exact Netlify URL:
```
CORS_ORIGINS=https://your-site.netlify.app
```
3. **Manual Deploy** → wait for restart

---

## Step 4 — Test

1. Open your Netlify URL
2. Click **Try with sample data** → **Analyze Match**
3. Results within ~15s ✅

---

## Custom Domain (Optional)

Netlify → Site settings → Domain management → Add custom domain. Free SSL via Let's Encrypt is automatic.

Example: `resume-analyzer.yourname.com`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `CORS error` in browser | `CORS_ORIGINS` on Render must exactly match Netlify URL (no trailing slash) |
| `Failed to fetch` | Check `REACT_APP_BACKEND_URL` on Netlify |
| Backend hangs on first request | Cold start. Use UptimeRobot |
| `EMERGENT_LLM_KEY not configured` | Add on Render → Manual Deploy |
| Build fails on Render | Make sure `requirements.txt` is in `backend/` |
| Build fails on Netlify | Base = `frontend`, Publish = `build` (not `frontend/build`) |
