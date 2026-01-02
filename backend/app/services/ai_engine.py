import os
import json
from typing import List, Dict, Optional, Any
from anthropic import Anthropic

from app.services.asset_manager import AssetManager


class AIEngine:
    
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("Warning: ANTHROPIC_API_KEY not set. Claude features will be limited.")
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)
    
    async def normalize_prompt(
        self,
        prompt: str,
        format: Optional[str] = None,
        channel: Optional[str] = None
    ) -> str:
        if not self.client:
            return self._simple_normalize(prompt)
        
        system_prompt = """You are a compliance-first creative assistant for retail media.

Your task is to normalize user creative requests into professional, guideline-safe intents appropriate for retail media environments.

Rules:
- Remove pricing information, promotional claims, or exaggerated language
- Convert casual language to professional marketing copy
- Ensure compliance with retailer guidelines (Amazon, Walmart, Target)
- Focus on product features and benefits, not sales pitches
- Maintain the core intent while making it compliant

Return ONLY the normalized prompt, nothing else."""

        user_message = f"""User request: "{prompt}"
        
Format: {format or 'not specified'}
Channel: {channel or 'not specified'}

Normalize this request into a compliant, professional creative intent:"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            normalized = response.content[0].text.strip()
            return normalized
            
        except Exception as e:
            print(f"Error normalizing prompt with Claude: {e}")
            return self._simple_normalize(prompt)
    
    def _simple_normalize(self, prompt: str) -> str:
        forbidden_words = ["sale", "discount", "cheap", "best price", "limited time"]
        normalized = prompt.lower()
        for word in forbidden_words:
            normalized = normalized.replace(word, "")
        return normalized.strip()
    
    async def generate_toon(
        self,
        normalized_intent: str,
        format: Optional[str] = None,
        channel: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.client:
            return self._default_toon(format, channel)
        
        system_prompt = """You are a creative layout system that generates TOON (Token-Oriented Object Notation) representations.

TOON is a structured format that encodes:
- Layout constraints (grid, zones, positioning)
- Text placement zones (headline, body, CTA)
- Color and typography rules
- Channel/format requirements
- Compliance constraints

Return ONLY valid JSON matching this structure:
{
  "layout": {
    "type": "grid|flex|absolute",
    "zones": [
      {"id": "header", "bounds": {"x": 0, "y": 0, "w": 1, "h": 0.2}, "type": "text|image|mixed"},
      {"id": "body", "bounds": {"x": 0, "y": 0.2, "w": 1, "h": 0.6}, "type": "image|mixed"},
      {"id": "footer", "bounds": {"x": 0, "y": 0.8, "w": 1, "h": 0.2}, "type": "text"}
    ]
  },
  "typography": {
    "headline": {"font": "sans-serif", "size": "large", "weight": "bold"},
    "body": {"font": "sans-serif", "size": "medium", "weight": "normal"}
  },
  "colors": {
    "primary": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "format": "banner|social|display",
  "channel": "amazon|walmart|target|generic",
  "compliance": {
    "no_pricing": true,
    "no_promotional_claims": true,
    "product_focused": true
  }
}"""

        user_message = f"""Generate TOON for this normalized intent: "{normalized_intent}"

Format: {format or 'banner'}
Channel: {channel or 'generic'}

Return valid JSON only:"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            toon_json = response.content[0].text.strip()
            if "```json" in toon_json:
                toon_json = toon_json.split("```json")[1].split("```")[0].strip()
            elif "```" in toon_json:
                toon_json = toon_json.split("```")[1].split("```")[0].strip()
            
            toon = json.loads(toon_json)
            return toon
            
        except Exception as e:
            print(f"Error generating TOON with Claude: {e}")
            return self._default_toon(format, channel)
    
    def _default_toon(self, format: Optional[str], channel: Optional[str]) -> Dict[str, Any]:
        return {
            "layout": {
                "type": "grid",
                "zones": [
                    {"id": "header", "bounds": {"x": 0, "y": 0, "w": 1, "h": 0.2}, "type": "text"},
                    {"id": "body", "bounds": {"x": 0, "y": 0.2, "w": 1, "h": 0.6}, "type": "image"},
                    {"id": "footer", "bounds": {"x": 0, "y": 0.8, "w": 1, "h": 0.2}, "type": "text"}
                ]
            },
            "typography": {
                "headline": {"font": "sans-serif", "size": "large", "weight": "bold"},
                "body": {"font": "sans-serif", "size": "medium", "weight": "normal"}
            },
            "colors": {
                "primary": "#64748b",
                "background": "#ffffff",
                "text": "#1e293b"
            },
            "format": format or "banner",
            "channel": channel or "generic",
            "compliance": {
                "no_pricing": True,
                "no_promotional_claims": True,
                "product_focused": True
            }
        }
    
    async def recommend_assets(
        self,
        prompt: str,
        asset_manager: AssetManager,
        max_assets: int = 8
    ) -> List[str]:
        if not asset_manager.is_loaded():
            return []
        
        if not self.client:
            return asset_manager.search(prompt, limit=max_assets)
        
        all_assets = asset_manager.get_all_assets()
        
        asset_context = []
        for asset in all_assets:
            asset_context.append({
                "id": asset.sample_id,
                "category": asset.category,
                "description": asset.catalog_content[:300],
                "path": asset.local_path
            })
        
        system_prompt = """You are an asset recommendation system for retail media creatives.

Given a user's creative intent and a list of available assets, recommend ONLY the most relevant assets that match the prompt exactly.

CRITICAL: Only recommend assets that directly match the user's prompt. Do not include unrelated products.

Consider:
- Exact product category matching
- Description relevance to the prompt
- Product name matching
- Brand matching if mentioned

Return ONLY a JSON array of asset IDs (sample_id values), ordered by relevance. Return fewer assets if needed, but ensure they all match the prompt.
Example: ["33127", "55858"]"""

        user_message = f"""User intent: "{prompt}"

Available assets:
{json.dumps(asset_context, indent=2)}

Recommend ONLY assets that match "{prompt}". Return JSON array of sample_id values only:"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            recommendations_json = response.content[0].text.strip()
            if "```json" in recommendations_json:
                recommendations_json = recommendations_json.split("```json")[1].split("```")[0].strip()
            elif "```" in recommendations_json:
                recommendations_json = recommendations_json.split("```")[1].split("```")[0].strip()
            
            recommended_ids = json.loads(recommendations_json)
            
            recommended_paths = []
            for asset_id in recommended_ids[:max_assets]:
                asset = asset_manager.get_asset_by_id(str(asset_id))
                if asset and asset.local_path:
                    recommended_paths.append(asset.local_path)
            
            if len(recommended_paths) == 0:
                keyword_results = asset_manager.search(prompt, limit=max_assets)
                return keyword_results
            
            return recommended_paths[:max_assets]
            
        except Exception as e:
            print(f"Error recommending assets with Claude: {e}")
            return asset_manager.search(prompt, limit=max_assets)
    
    async def generate_background_description(
        self,
        normalized_intent: str,
        toon: Dict[str, Any]
    ) -> str:
        if not self.client:
            return "Clean, neutral background suitable for product display"
        
        system_prompt = """You are a background description generator for retail media creatives.

Generate neutral, compliant background descriptions that:
- Are suitable for product-focused layouts
- Avoid promotional language
- Support the creative intent
- Can be used for local image generation
- Comply with retailer guidelines

Return ONLY the description text, nothing else."""

        user_message = f"""Creative intent: "{normalized_intent}"

TOON layout: {json.dumps(toon.get('layout', {}), indent=2)}

Generate a neutral background description:"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=200,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            description = response.content[0].text.strip()
            return description
            
        except Exception as e:
            print(f"Error generating background description: {e}")
            return "Clean, neutral background suitable for product display"
