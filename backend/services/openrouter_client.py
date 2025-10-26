"""
OpenRouter Client - Multi-LLM Support with Auto-Select
Cal Hacks 12.0 - Intelligent model routing for optimal results

OpenRouter provides a unified API to access multiple LLMs:
- AUTO (Default): OpenRouter intelligently chooses the best model
- Claude 3.5 Sonnet: Best for UI/UX design, modern interfaces
- GPT-4: Great all-around, reliable for landing pages
- Gemini 2.5 Flash: Fast, free, excellent for UI components
- Llama 3.1 70B: Fast, free tier available
- Mixtral 8x7B: Good for component generation
"""

import os
from typing import Optional, Dict, List
import httpx
from dotenv import load_dotenv

load_dotenv()

class OpenRouterClient:
    """Client for OpenRouter API - unified access to multiple LLMs"""
    
    # Model configurations with strengths/use cases
    MODELS = {
        "gemini-2.5-flash": {
            "id": "google/gemini-2.0-flash-exp:free",
            "name": "Gemini 2.5 Flash",
            "strength": "Fast, excellent for UI/UX, free tier available",
            "speed": "fast",
            "quality": "excellent",
            "cost": "free"
        },
        "auto": {
            "id": "openrouter/auto",
            "name": "Auto-Select Best Model",
            "strength": "OpenRouter chooses the best model automatically",
            "speed": "varies",
            "quality": "excellent",
            "cost": "varies"
        },
        "claude-3.5-sonnet": {
            "id": "anthropic/claude-3.5-sonnet",
            "name": "Claude 3.5 Sonnet",
            "strength": "Best for modern UI/UX, full pages, complex layouts",
            "speed": "medium",
            "quality": "excellent",
            "cost": "medium"
        },
        "gpt-4-turbo": {
            "id": "openai/gpt-4-turbo",
            "name": "GPT-4 Turbo",
            "strength": "Great all-around, reliable components",
            "speed": "medium",
            "quality": "excellent",
            "cost": "high"
        },
        "claude-3-opus": {
            "id": "anthropic/claude-3-opus",
            "name": "Claude 3 Opus",
            "strength": "Highest quality for complex designs",
            "speed": "slow",
            "quality": "best",
            "cost": "highest"
        },
        "llama-3.1-70b": {
            "id": "meta-llama/llama-3.1-70b-instruct",
            "name": "Llama 3.1 70B",
            "strength": "Fast, good for simple components",
            "speed": "fast",
            "quality": "good",
            "cost": "free"
        },
        "mixtral-8x7b": {
            "id": "mistralai/mixtral-8x7b-instruct",
            "name": "Mixtral 8x7B",
            "strength": "Balanced speed/quality",
            "speed": "fast",
            "quality": "good",
            "cost": "low"
        },
        "gpt-4o": {
            "id": "openai/gpt-4o",
            "name": "GPT-4o",
            "strength": "Latest OpenAI, great for landing pages",
            "speed": "fast",
            "quality": "excellent",
            "cost": "medium"
        }
    }
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.site_url = os.getenv("SITE_URL", "https://gazebuilder.tech")
        self.site_name = os.getenv("SITE_NAME", "GazeBuilder")
        
        if not self.api_key:
            print("[WARN]  No OpenRouter API key found - will use fallback")
            self.available = False
        else:
            print("[OK] OpenRouter API key found")
            self.available = True
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        model: str = "auto",
        temperature: float = 0.7,
        max_tokens: int = 4000
    ) -> str:
        """
        Generate content using specified LLM via OpenRouter
        
        Args:
            prompt: User prompt
            system_prompt: System instructions
            model: Model key from MODELS dict
            temperature: Creativity (0-1)
            max_tokens: Max response length
            
        Returns:
            Generated content
        """
        if not self.available:
            raise ValueError("OpenRouter API not available - check API key")
        
        # Get full model ID
        model_config = self.MODELS.get(model)
        if not model_config:
            raise ValueError(f"Unknown model: {model}")
        
        model_id = model_config["id"]
        
        print(f"[AI] Generating with {model_config['name']}...")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": self.site_url,
            "X-Title": self.site_name,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise Exception(f"OpenRouter API error: {response.status_code} - {error_detail}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Log token usage for cost tracking
            if "usage" in result:
                usage = result["usage"]
                print(f"[STATS] Tokens: {usage.get('prompt_tokens', 0)} prompt + {usage.get('completion_tokens', 0)} completion")
            
            return content
    
    def get_model_list(self) -> List[Dict]:
        """Get list of available models for UI selection"""
        return [
            {
                "id": key,
                "name": config["name"],
                "strength": config["strength"],
                "speed": config["speed"],
                "quality": config["quality"],
                "cost": config["cost"]
            }
            for key, config in self.MODELS.items()
        ]
    
    def is_available(self) -> bool:
        """Check if OpenRouter is configured"""
        return self.available


# Singleton instance
openrouter_client = OpenRouterClient()

