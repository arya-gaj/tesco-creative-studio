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
    
    async def get_asset_position(
        self,
        canvas_elements: List[Dict[str, Any]],
        asset_url: str,
        asset_description: Optional[str] = None,
        asset_category: Optional[str] = None,
        canvas_width: int = 1080,
        canvas_height: int = 1920
    ) -> Dict[str, Any]:
        if not self.client:
            return self._default_position(canvas_elements, canvas_width, canvas_height)
        
        system_prompt = """You are a creative layout assistant for Instagram Stories (1080x1920 vertical format).

Given existing elements on the canvas and a new product asset with its description, determine the BEST UNIQUE position (x, y) and size (width, height) for strategic placement.

CRITICAL RULES:
- Canvas is 1080px wide x 1920px tall (vertical/portrait)
- AVOID overlapping with existing elements by at least 50px margin
- Each product MUST be placed in a DIFFERENT location - use variety in positioning
- Use rule of thirds: place products at 1/3 or 2/3 horizontal positions (360px, 720px)
- Vary vertical placement: top third (200-600px), middle third (600-1200px), or bottom third (1200-1700px)
- For product images: typical width 300-500px, maintain aspect ratio
- Consider the product type when placing:
  * Food items: often work well in middle-left or middle-right
  * Beverages: can be placed vertically centered or bottom third
  * Personal care: top or middle sections work well
  * Large products: use larger sizes (400-500px width)
  * Small products: use smaller sizes (250-350px width)
- Create visual balance: if one product is left, place next one right or center
- Ensure products are prominent but don't dominate the entire canvas
- Leave safe zones: avoid top 100px and bottom 200px for UI elements
- NEVER place two products in the same spot - always vary positions

Return ONLY valid JSON, no markdown, no code blocks, just the JSON object:
{
  "x": number,
  "y": number,
  "width": number,
  "height": number
}"""

        existing_elements = []
        for elem in canvas_elements:
            existing_elements.append({
                "type": elem.get("type", "unknown"),
                "x": elem.get("x", 0),
                "y": elem.get("y", 0),
                "width": elem.get("width", 0),
                "height": elem.get("height", 0)
            })
        
        asset_info = f"Asset URL: {asset_url}"
        if asset_description:
            asset_info += f"\nProduct Description: {asset_description}"
        if asset_category:
            asset_info += f"\nProduct Category: {asset_category}"
        
        user_message = f"""Canvas dimensions: {canvas_width}x{canvas_height}
Existing elements on canvas: {json.dumps(existing_elements, indent=2)}

{asset_info}

IMPORTANT: This product must be placed in a DIFFERENT location from existing elements. Analyze the product description to determine the best strategic position. Consider the product type, size, and create visual variety.

Determine optimal UNIQUE position and size for this specific product. Return JSON with x, y, width, height."""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            result_text = response.content[0].text.strip()
            
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
            
            result_json = json.loads(result_text)
            
            x = max(50, min(canvas_width - 150, int(result_json.get("x", canvas_width // 2 - 200))))
            y = max(100, min(canvas_height - 300, int(result_json.get("y", canvas_height // 2 - 200))))
            width = max(200, min(600, int(result_json.get("width", 400))))
            height = max(200, min(800, int(result_json.get("height", 400))))
            
            print(f"[AIEngine] Strategic position from Claude: x={x}, y={y}, w={width}, h={height}")
            
            return {
                "x": x,
                "y": y,
                "width": width,
                "height": height
            }
            
        except json.JSONDecodeError as e:
            print(f"Error parsing Claude JSON response: {e}")
            print(f"Response text: {result_text[:200]}")
            return self._default_position(canvas_elements, canvas_width, canvas_height)
        except Exception as e:
            print(f"Error getting asset position with Claude: {e}")
            import traceback
            traceback.print_exc()
            return self._default_position(canvas_elements, canvas_width, canvas_height)
    
    def _default_position(self, canvas_elements: List[Dict[str, Any]], canvas_width: int, canvas_height: int) -> Dict[str, Any]:
        if not canvas_elements:
            return {
                "x": canvas_width // 3 - 200,
                "y": canvas_height // 2 - 200,
                "width": 400,
                "height": 400
            }
        
        occupied_areas = []
        for elem in canvas_elements:
            occupied_areas.append({
                "x1": elem.get("x", 0) - 50,
                "y1": elem.get("y", 0) - 50,
                "x2": elem.get("x", 0) + elem.get("width", 0) + 50,
                "y2": elem.get("y", 0) + elem.get("height", 0) + 50
            })
        
        positions_to_try = [
            (canvas_width // 3 - 200, 300),
            (canvas_width * 2 // 3 - 200, 400),
            (canvas_width // 2 - 200, 600),
            (canvas_width // 4, canvas_height // 2 - 200),
            (canvas_width * 3 // 4 - 400, canvas_height // 2 - 200),
            (canvas_width // 3 - 200, canvas_height * 2 // 3 - 400),
            (canvas_width * 2 // 3 - 200, canvas_height // 3),
            (100, canvas_height // 2 - 200),
            (canvas_width - 500, canvas_height // 2 - 200),
        ]
        
        for x, y in positions_to_try:
            overlaps = False
            for area in occupied_areas:
                if not (x + 400 < area["x1"] or x > area["x2"] or y + 400 < area["y1"] or y > area["y2"]):
                    overlaps = True
                    break
            if not overlaps:
                return {
                    "x": max(50, min(canvas_width - 450, x)),
                    "y": max(100, min(canvas_height - 500, y)),
                    "width": 400,
                    "height": 400
                }
        
        import random
        attempts = 0
        while attempts < 20:
            x = random.randint(100, canvas_width - 500)
            y = random.randint(200, canvas_height - 600)
            overlaps = False
            for area in occupied_areas:
                if not (x + 400 < area["x1"] or x > area["x2"] or y + 400 < area["y1"] or y > area["y2"]):
                    overlaps = True
                    break
            if not overlaps:
                return {
                    "x": x,
                    "y": y,
                    "width": 400,
                    "height": 400
                }
            attempts += 1
        
        last_element = canvas_elements[-1]
        x = (last_element.get("x", 200) + last_element.get("width", 400) + 100) % (canvas_width - 450)
        y = (last_element.get("y", 200) + 100) % (canvas_height - 500)
        
        return {
            "x": max(50, min(canvas_width - 450, x)),
            "y": max(100, min(canvas_height - 500, y)),
            "width": 400,
            "height": 400
        }
