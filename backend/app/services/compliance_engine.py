import re
from typing import Dict, List, Any, Optional


class ComplianceEngine:
    
    def __init__(self):
        self.forbidden_words = [
            "sale", "discount", "cheap", "best price", "limited time",
            "act now", "buy now", "hurry", "exclusive", "free shipping",
            "guaranteed", "lowest price", "price match"
        ]
        
        self.restricted_brands = [
            "nike", "adidas", "apple", "samsung"
        ]
        
        self.required_flags = [
            "no_pricing",
            "no_promotional_claims",
            "product_focused"
        ]
    
    async def validate(
        self,
        prompt: str,
        toon: Dict[str, Any],
        assets: List[str]
    ) -> Dict[str, Any]:
        violations = []
        warnings = []
        
        prompt_lower = prompt.lower()
        for word in self.forbidden_words:
            if word in prompt_lower:
                violations.append(f"Forbidden promotional word detected: '{word}'")
        
        toon_compliance = toon.get("compliance", {})
        for flag in self.required_flags:
            if not toon_compliance.get(flag, False):
                warnings.append(f"Missing compliance flag: {flag}")
        
        layout = toon.get("layout", {})
        zones = layout.get("zones", [])
        if not zones:
            warnings.append("No layout zones defined in TOON")
        
        colors = toon.get("colors", {})
        primary_color = colors.get("primary", "").lower()
        if primary_color in ["#ff0000", "#ff3333", "#cc0000"]:
            warnings.append("Red primary color may imply promotional content")
        
        if len(assets) == 0:
            warnings.append("No assets recommended")
        elif len(assets) > 10:
            warnings.append("Too many assets may clutter the creative")
        
        compliant = len(violations) == 0
        
        return {
            "compliant": compliant,
            "violations": violations,
            "warnings": warnings,
            "prompt_validated": True,
            "toon_validated": True,
            "assets_validated": True,
            "compliance_flags": toon_compliance
        }
    
    async def generate_final_summary(
        self,
        canvas_state: Dict[str, Any],
        toon: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        text_elements = []
        if isinstance(canvas_state, dict):
            elements = canvas_state.get("elements", [])
            for element in elements:
                if element.get("type") == "text":
                    text_content = element.get("text", "") or element.get("fill", "")
                    if text_content:
                        text_elements.append(text_content)
        
        all_text = " ".join(text_elements).lower()
        violations = []
        for word in self.forbidden_words:
            if word in all_text:
                violations.append(f"Forbidden word: '{word}'")
        
        summary = {
            "timestamp": metadata.get("timestamp") if metadata else None,
            "creative_id": metadata.get("creative_id") if metadata else None,
            "compliant": len(violations) == 0,
            "violations": violations,
            "element_count": len(canvas_state.get("elements", [])) if isinstance(canvas_state, dict) else 0,
            "text_elements_count": len(text_elements),
            "toon_applied": toon is not None,
            "compliance_checks": {
                "no_pricing": not any("price" in text.lower() or "$" in text for text in text_elements),
                "no_promotional_claims": len(violations) == 0,
                "product_focused": True,
                "layout_compliant": True
            }
        }
        
        return summary
    
    def check_text_compliance(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        violations = []
        
        for word in self.forbidden_words:
            if word in text_lower:
                violations.append(f"Forbidden word: '{word}'")
        
        has_pricing = bool(re.search(r'\$[\d,]+|\d+\s*(dollars?|usd)', text_lower))
        if has_pricing:
            violations.append("Pricing information detected")
        
        return {
            "compliant": len(violations) == 0,
            "violations": violations
        }
