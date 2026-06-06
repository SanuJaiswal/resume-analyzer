import os

from llm.gemini_provider import GeminiProvider
from llm.groq_provider import GroqProvider


def get_llm():

    provider = os.getenv(
        "LLM_PROVIDER",
        "groq"
    )

    if provider == "groq":
        return GroqProvider()

    if provider == "gemini":
        return GeminiProvider()

    raise Exception(
        f"Unsupported provider: {provider}"
    )