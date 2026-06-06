# Deployment Guide

Deploy the Resume Analyzer in approximately 15 minutes using free tiers:

* Backend → Render
* Frontend → Netlify
* AI Provider → Groq

---

# Prerequisites

Before deploying:

1. Push your code to GitHub

2. Create accounts:

   * Render
   * Netlify
   * Groq

3. Generate a Groq API Key:
   https://console.groq.com/keys

---

# Step 1 — Deploy Backend on Render

1. Open Render Dashboard
2. Click **New → Web Service**
3. Connect your GitHub repository

Configure:

| Setting        | Value                                          |
| -------------- | ---------------------------------------------- |
| Name           | resume-analyzer-api                            |
| Root Directory | backend                                        |
| Runtime        | Python                                         |
| Build Command  | pip install -r requirements.txt                |
| Start Command  | uvicorn server:app --host 0.0.0.0 --port $PORT |
| Instance Type  | Free                                           |

---

## Environment Variables

Add:

```env
GROQ_API_KEY=your_groq_api_key
CORS_ORIGINS=*
```

Click **Create Web Service**.

Deployment typically takes 2–5 minutes.

---

## Verify Backend

Open:

```text
https://your-render-url.onrender.com/api/
```

Expected response:

```json
{
  "message": "Resume Analyzer API running"
}
```

---

# Step 2 — Deploy Frontend on Netlify

1. Open Netlify
2. Click **Add New Site → Import from GitHub**
3. Select your repository

Configure:

| Setting           | Value      |
| ----------------- | ---------- |
| Base Directory    | frontend   |
| Build Command     | yarn build |
| Publish Directory | build      |

---

## Frontend Environment Variable

Add:

```env
REACT_APP_API_URL=https://your-render-url.onrender.com
```

Deploy the site.

After deployment, copy the generated Netlify URL.

---

# Step 3 — Configure Production CORS

After obtaining your Netlify URL:

Render → Service → Environment

Update:

```env
CORS_ORIGINS=https://your-site.netlify.app
```

Redeploy the backend.

This prevents unauthorized domains from calling your API.

---

# Step 4 — End-to-End Testing

1. Open your Netlify site
2. Upload a resume PDF
3. Paste a Job Description
4. Click Analyze

Verify:

* Match score appears
* Category charts render
* Skills analysis loads
* Improved bullet suggestions appear
* JSON export works

---

# Optional: Custom Domain

Netlify → Site Settings → Domain Management

Add:

```text
resume.yourdomain.com
```

Netlify automatically provisions SSL certificates.

---

# Troubleshooting

| Problem                 | Solution                                                       |
| ----------------------- | -------------------------------------------------------------- |
| CORS Error              | Ensure CORS_ORIGINS exactly matches your Netlify domain        |
| Failed to Fetch         | Verify REACT_APP_API_URL is correct                            |
| Backend returns 500     | Check Render logs for API provider errors                      |
| GROQ_API_KEY missing    | Add environment variable and redeploy                          |
| Build fails on Render   | Verify requirements.txt exists inside backend/                 |
| Build fails on Netlify  | Ensure Base Directory = frontend and Publish Directory = build |
| Analysis takes too long | Check Groq API status and usage limits                         |

---

# Free Tier Notes

Render free instances may sleep after inactivity.

The first request after a period of inactivity may take 20–60 seconds while the backend wakes up.

For production usage, consider upgrading to a paid instance.

---

# Future Providers

The application uses a provider-based LLM architecture.

To switch providers later:

* OpenAI
* Gemini
* Claude
* Azure OpenAI

Only the provider implementation inside the `llm/` folder needs to change.
