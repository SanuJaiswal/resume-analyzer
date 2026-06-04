# Resume Analyzer

An AI-powered tool that scores how well a resume matches a job description, surfaces skill gaps, and rewrites weak bullet points using GPT-4o.

## Tech Stack

- **Frontend**: React (CRA), Tailwind CSS, Framer Motion, Recharts, Shadcn UI
- **Backend**: FastAPI (Python), BeautifulSoup, pypdf
- **AI**: OpenAI GPT-4o via Emergent Universal LLM Key

## Features

- Upload PDF resume or paste text
- Paste a job URL (auto-scrapes JD) or paste manually
- Match score with animated ring
- Category breakdown radar chart
- Skills coverage bar chart
- Matched / missing skills
- AI-rewritten resume bullets
- Export results as JSON
- Recent history (browser localStorage)
- Dark / light mode

## Local Development

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your keys
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env        # set backend URL
yarn start
```

App runs at `http://localhost:3000`.

## Deployment

See `DEPLOYMENT.md` for step-by-step instructions (Render + Netlify).

## License
MIT
