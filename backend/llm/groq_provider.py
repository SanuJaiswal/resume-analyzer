import os

from groq import AsyncGroq

from llm.llm_provider import LLMProvider


class GroqProvider(LLMProvider):

    def __init__(self):

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is missing")
            
        self.client = AsyncGroq(
            api_key=api_key,
            timeout=60
        )

        self.model = "llama-3.3-70b-versatile"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:

        completion = await self.client.chat.completions.create(
            model=self.model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        return completion.choices[0].message.content