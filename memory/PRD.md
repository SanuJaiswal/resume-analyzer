# Resume Analyzer — Enterprise PRD

## Original Problem Statement
> Look at the resume analyzer basic web we have created. I want to take it to the enterprise level application. The current application is just a normal app like others using react, some basic gpt model, performing gpt scores. There are various apps in the market like this. I want our app to have something unique, modern and offer something no resume score web app offers currently to attract users and gain their trust. Think and let me know what to plan.

## North-Star Vision
Transform the basic Resume Analyzer into an **enterprise-grade Resume Intelligence Platform** that competes on **trust, depth, and explainability** — not just scoring.

## 5-Pillar Roadmap
1. **Explainable AI Scoring** *(Phase 1 — DONE)* — Every score has a *why*, with concrete evidence from the resume and JD.
2. **Multi-Agent AI Recruiter Panel** — Hiring Manager / Tech Lead / HR / Skeptic each grade independently; consensus + dissent view.
3. **Resume Authenticity & Defensibility Engine** — Flag unverifiable claims, AI-stuffing, vague metrics. Generate interview "interrogation questions" per bullet. Defensibility score.
4. **Live Job-Market Intelligence** — Real-time salary band, top open matches, skill demand heatmap (rising vs declining), "best 2 skills to add" recommender.
5. **Resume DNA Card + Enterprise Workspace** — Viral shareable career card; team/bulk mode with SSO, audit trail, PII redaction for recruiters/bootcamps/universities.

## Phase 1 — Explainable AI Scoring (DELIVERED — Jan 2026)

### Goal
Replace opaque category scores (a plain number) with rich, evidence-backed explanations users can trust.

### What was built
- **Backend (`/app/backend/server.py`)**
  - New Pydantic schema: `MatchedEvidence`, `MissingEvidence`, `CategoryScore`, `CategoryScores`, `ImprovedBullet`, `AnalysisResult`.
  - Updated `RESUME_ANALYZER_SYSTEM_PROMPT` to demand `category_scores` as an object per category containing `score`, `explanation`, `matched_evidence[]`, `missing_evidence[]`.
  - Five required categories: `technical_skills`, `experience`, `domain_fit`, `education`, `soft_skills`. Legacy key `domain_knowledge` is auto-renamed to `domain_fit`.
  - `_normalize_category_scores()` provides backward compatibility (accepts old `int` shape and upgrades it).
  - GPT response now validated by `AnalysisResult.model_validate()`. JSON / Validation failures return 502 with a friendly message.
- **Frontend**
  - New component: `/app/frontend/src/components/analyzer/WhyThisScore.js` — accordion-based section, one row per category, with reasoning panel + matched/missing evidence grid.
  - `AnalyzerCharts.js` radar chart updated to support both new (`{score, ...}`) and legacy (`number`) shapes.
  - Wired into `ResumeAnalyzer.js` results section under the existing charts.
  - Smooth Framer-Motion animations, color-coded score bars, accent colors per category, single-open accordion behaviour.
  - Loading state (existing skeleton) and error state (existing toast) preserved.

### Test Status
- Backend tested via curl: returns valid `AnalysisResult` JSON with all 5 categories populated.
- Frontend tested via Playwright screenshot: accordions render, expand/collapse, and display evidence correctly.

## Tech Stack
- Backend: FastAPI + Pydantic, `emergentintegrations` LlmChat (GPT-4o), pypdf, BeautifulSoup, httpx.
- Frontend: React, Tailwind, Framer Motion, Recharts, lucide-react.
- LLM: OpenAI **GPT-4o** via Emergent Universal LLM Key.

## Backlog (Prioritized)
- **P0** Phase 2 — Multi-Agent Recruiter Panel
- **P0** Phase 3 — Authenticity & Defensibility Engine
- **P1** Phase 4 — Live Market Intelligence (jobs feed + salary)
- **P1** User accounts (Emergent Google login) → enable saved history, dashboards
- **P2** Phase 5 — Resume DNA Card + Enterprise Workspace
- **P2** PDF / DOCX export of tailored resume with track-changes

## Next Action Items
- Await user direction for Phase 2 (Multi-Agent Recruiter Panel) or other pillar.
- (Optional) Migrate analysis history from in-browser to MongoDB once accounts are introduced.
