import os

from google import genai

from llm.llm_provider import LLMProvider


class GeminiProvider(LLMProvider):

    def __init__(self):

        self.client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:

        prompt = f"""
{system_prompt}

{user_prompt}
"""

        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text