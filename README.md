# Resume Analyzer

An AI-powered resume intelligence platform that evaluates how well a resume matches a job description, identifies skill gaps, provides evidence-backed scoring, and rewrites resume bullets for stronger impact.

## Features

* Upload a PDF resume or paste resume text
* Paste a job description manually or import from a job posting URL
* AI-powered resume-to-JD matching analysis
* Overall match score with visual breakdown
* Category-wise scoring:

  * Technical Skills
  * Experience
  * Domain Fit
  * Education
  * Soft Skills
* Matched and missing skills detection
* Evidence-based analysis with detailed reasoning
* Resume bullet improvement suggestions
* Interactive charts and visualizations
* Export complete analysis as JSON
* Analysis history stored locally
* Dark and light mode support

## Tech Stack

### Frontend

* React
* Tailwind CSS
* Framer Motion
* Recharts
* Shadcn UI

### Backend

* FastAPI
* BeautifulSoup
* pypdf
* Pydantic

### AI Layer

* Provider-based LLM architecture
* Currently supports Groq (Llama 3.3 70B)
* Easily extensible to OpenAI, Gemini, Claude, or other providers

## Project Structure

```text
backend/
├── llm/
│   ├── llm_provider.py
│   ├── groq_provider.py
│   └── llm_factory.py
├── prompts/
│   └── resume_analyzer.py
├── server.py
└── requirements.txt

frontend/
├── src/
├── public/
└── package.json
```

## Local Development

### Backend

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Add GROQ_API_KEY

uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend

yarn install

cp .env.example .env
# Configure backend API URL

yarn start
```

Frontend:
http://localhost:3000

Backend:
http://localhost:8001

## Environment Variables

### Backend

```env
CORS_ORIGINS=*
GROQ_API_KEY=your_groq_api_key
```

### Frontend

```env
REACT_APP_API_URL=http://localhost:8001
```

## Roadmap

### Phase 1

* Explainable scoring
* Evidence-backed category analysis
* Resume bullet enhancement
* JSON export

### Phase 2

* ATS keyword coverage engine
* Weighted scoring system
* Mentioned vs demonstrated skill analysis
* Enhanced recruiter insights

### Phase 3

* Multi-resume comparison
* Personalized resume optimization
* Industry-specific scoring models
* Recruiter dashboard

## License

MIT
