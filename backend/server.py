from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import io
import re
import json
import asyncio
import logging
import uuid
import httpx
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field, ValidationError, conint
from pypdf import PdfReader
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Resume Analyzer API")
api_router = APIRouter(prefix="/api")


RESUME_ANALYZER_SYSTEM_PROMPT = """You are a senior tech recruiter and resume coach. You analyze how well a resume matches a job description with deep, explainable reasoning.

You ALWAYS respond with ONLY valid JSON in this EXACT structure (no markdown, no code fences, no commentary):
{
  "match_score": <int 0-100>,
  "verdict": "<one-line summary>",
  "matched_skills": ["skill1", ...],
  "missing_skills": ["skill1", ...],
  "category_scores": {
    "technical_skills": {
      "score": <int 0-100>,
      "explanation": "<2-3 sentence reasoning for THIS score, citing specifics from BOTH the resume and the JD>",
      "matched_evidence": [
        {
          "resume_text": "<short verbatim or near-verbatim phrase from the resume>",
          "jd_requirement": "<the specific JD requirement this satisfies>",
          "reason": "<why this resume phrase satisfies the JD requirement>"
        }
      ],
      "missing_evidence": [
        {
          "jd_requirement": "<a specific JD requirement NOT met by the resume>",
          "reason": "<why this is missing or weak in the resume>"
        }
      ]
    },
    "experience": { "score": <int>, "explanation": "...", "matched_evidence": [...], "missing_evidence": [...] },
    "domain_fit":  { "score": <int>, "explanation": "...", "matched_evidence": [...], "missing_evidence": [...] },
    "education":   { "score": <int>, "explanation": "...", "matched_evidence": [...], "missing_evidence": [...] },
    "soft_skills": { "score": <int>, "explanation": "...", "matched_evidence": [...], "missing_evidence": [...] }
  },
  "strengths": ["bullet1", "bullet2", "bullet3"],
  "gaps": ["bullet1", "bullet2", "bullet3"],
  "suggestions": ["actionable1", "actionable2", "actionable3", "actionable4"],
  "improved_bullets": [
    {"original": "<weak bullet from resume>", "improved": "<rewritten with metrics and JD keywords>"},
    {"original": "<weak bullet from resume>", "improved": "<rewritten with metrics and JD keywords>"}
  ]
}

Strict rules:
- ALL FIVE category keys must be present: technical_skills, experience, domain_fit, education, soft_skills. Never omit any.
- Each category MUST contain: score, explanation, matched_evidence (array), missing_evidence (array). Arrays may be empty but the keys must exist.
- matched_evidence: 1-4 items per category when possible. resume_text must be a short, recognizable phrase actually present (or paraphrased) in the resume.
- missing_evidence: 1-4 items per category when applicable. Empty array only if there are no meaningful gaps.
- explanation must be specific (not generic) - reference real items from the resume/JD.
- match_score: be realistic, not generous. 90+ only if truly exceptional match.
- category score must be internally consistent with its evidence (lots of missing_evidence => lower score).
- Keep matched_skills and missing_skills concise (3-12 items each).
- improved_bullets: pick 2-3 actual bullets from resume and rewrite stronger with metrics and JD keywords.
- Plain ASCII, no emojis, no markdown."""


# ---------- Pydantic schema ----------

class MatchedEvidence(BaseModel):
    resume_text: str = ""
    jd_requirement: str = ""
    reason: str = ""


class MissingEvidence(BaseModel):
    jd_requirement: str = ""
    reason: str = ""


class CategoryScore(BaseModel):
    score: conint(ge=0, le=100) = 0
    explanation: str = ""
    matched_evidence: List[MatchedEvidence] = Field(default_factory=list)
    missing_evidence: List[MissingEvidence] = Field(default_factory=list)


class CategoryScores(BaseModel):
    technical_skills: CategoryScore
    experience: CategoryScore
    domain_fit: CategoryScore
    education: CategoryScore
    soft_skills: CategoryScore


class ImprovedBullet(BaseModel):
    original: str = ""
    improved: str = ""


class AnalysisResult(BaseModel):
    match_score: conint(ge=0, le=100)
    verdict: str
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    category_scores: CategoryScores
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    improved_bullets: List[ImprovedBullet] = Field(default_factory=list)


# ---------- helpers ----------

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join((page.extract_text() or "") for page in reader.pages).strip()


def extract_jd_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    selectors = [
        '[class*="job-description"]', '[class*="jobDescription"]',
        '[class*="description"]', '[id*="job-description"]',
        '[data-testid*="jobDescription"]', 'main', 'article',
    ]
    for sel in selectors:
        node = soup.select_one(sel)
        if node:
            text = node.get_text(separator="\n", strip=True)
            if len(text) > 300:
                return text

    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip().rstrip("`").strip()
    return text


def _normalize_category_scores(raw: dict) -> dict:
    """Backward-compat: accept either old (int) or new (object) shape per category.
    Also accepts legacy key 'domain_knowledge' and maps it to 'domain_fit'.
    """
    if not isinstance(raw, dict):
        return raw

    cs = raw.get("category_scores")
    if not isinstance(cs, dict):
        return raw

    # legacy key rename
    if "domain_knowledge" in cs and "domain_fit" not in cs:
        cs["domain_fit"] = cs.pop("domain_knowledge")

    required = ["technical_skills", "experience", "domain_fit", "education", "soft_skills"]
    for key in required:
        val = cs.get(key)
        if isinstance(val, (int, float)):
            # upgrade old shape
            cs[key] = {
                "score": int(val),
                "explanation": "",
                "matched_evidence": [],
                "missing_evidence": [],
            }
        elif isinstance(val, dict):
            val.setdefault("score", 0)
            val.setdefault("explanation", "")
            val.setdefault("matched_evidence", [])
            val.setdefault("missing_evidence", [])
        else:
            cs[key] = {
                "score": 0,
                "explanation": "",
                "matched_evidence": [],
                "missing_evidence": [],
            }

    raw["category_scores"] = cs
    return raw


# ---------- routes ----------

class JobUrlRequest(BaseModel):
    url: str


@api_router.get("/")
async def root():
    return {"message": "Resume Analyzer API running"}


@api_router.post("/resume/fetch-job")
async def fetch_job_description(payload: JobUrlRequest):
    url = payload.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code in (401, 403):
                raise HTTPException(status_code=400, detail="This site blocks scraping (e.g. LinkedIn). Please paste the job description manually.")
            if resp.status_code >= 400:
                raise HTTPException(status_code=400, detail=f"Could not fetch the URL (status {resp.status_code}).")

            text = extract_jd_from_html(resp.text)
            if len(text) < 200:
                raise HTTPException(status_code=400, detail="Could not extract meaningful content. Please paste the job description manually.")

            text = text[:6000]
            return {"job_description": text, "char_count": len(text)}
    except httpx.RequestError as e:
        logger.error(f"Job URL fetch error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to reach the URL. Check the link and try again.")


@api_router.post("/resume/analyze")
async def analyze_resume(
    job_description: str = Form(...),
    resume_text: str = Form(default=""),
    resume_file: UploadFile = File(default=None),
):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    resume_content = resume_text.strip()
    if resume_file is not None:
        try:
            pdf_bytes = await resume_file.read()
            if pdf_bytes:
                resume_content = await asyncio.to_thread(extract_text_from_pdf, pdf_bytes)
        except Exception as e:
            logger.error(f"PDF parse failed: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not read the PDF. Please paste resume text instead.")

    if not resume_content:
        raise HTTPException(status_code=400, detail="Resume content is required.")
    if len(resume_content) < 80:
        raise HTTPException(status_code=400, detail="Resume content is too short. Please provide your full resume.")
    if len(job_description.strip()) < 30:
        raise HTTPException(status_code=400, detail="Job description is too short (min 30 chars).")

    resume_content = resume_content[:8000]
    job_description = job_description.strip()[:6000]

    response = ""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"resume-{uuid.uuid4()}",
            system_message=RESUME_ANALYZER_SYSTEM_PROMPT,
        ).with_model("openai", "gpt-4o")

        user_text = (
            f"=== JOB DESCRIPTION ===\n{job_description}\n\n"
            f"=== RESUME ===\n{resume_content}\n\n"
            f"Analyze the match. For EACH category, give a numeric score, a specific explanation, "
            f"and concrete matched_evidence + missing_evidence drawn from the actual resume and JD text above. "
            f"Respond with the required JSON only."
        )

        response = await chat.send_message(UserMessage(text=user_text))
        text = _strip_code_fence(response)
        raw = json.loads(text)
        raw = _normalize_category_scores(raw)

        validated = AnalysisResult.model_validate(raw)
        return validated.model_dump()

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {str(e)} | raw: {response[:400]}")
        raise HTTPException(status_code=502, detail="AI returned an unexpected format. Please try again.")
    except ValidationError as e:
        logger.error(f"Schema validation failed: {e.errors()} | raw: {response[:400]}")
        raise HTTPException(status_code=502, detail="AI response failed schema validation. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze. Please try again.")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
