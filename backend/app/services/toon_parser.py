from typing import Dict, Any, Optional
import json


class TOONParser:
    
    def __init__(self):
        self.required_fields = ["layout", "typography", "colors", "format", "compliance"]
    
    def parse(self, toon_data: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(toon_data, dict):
            raise ValueError("TOON must be a dictionary")
        
        parsed = {
            "layout": self._parse_layout(toon_data.get("layout", {})),
            "typography": self._parse_typography(toon_data.get("typography", {})),
            "colors": self._parse_colors(toon_data.get("colors", {})),
            "format": toon_data.get("format", "banner"),
            "channel": toon_data.get("channel", "generic"),
            "compliance": self._parse_compliance(toon_data.get("compliance", {}))
        }
        
        return parsed
    
    def _parse_layout(self, layout: Dict[str, Any]) -> Dict[str, Any]:
        layout_type = layout.get("type", "grid")
        zones = layout.get("zones", [])
        
        validated_zones = []
        for zone in zones:
            if isinstance(zone, dict):
                validated_zone = {
                    "id": zone.get("id", f"zone_{len(validated_zones)}"),
                    "bounds": zone.get("bounds", {"x": 0, "y": 0, "w": 1, "h": 1}),
                    "type": zone.get("type", "mixed")
                }
                validated_zones.append(validated_zone)
        
        if not validated_zones:
            validated_zones = [
                {"id": "header", "bounds": {"x": 0, "y": 0, "w": 1, "h": 0.2}, "type": "text"},
                {"id": "body", "bounds": {"x": 0, "y": 0.2, "w": 1, "h": 0.6}, "type": "image"},
                {"id": "footer", "bounds": {"x": 0, "y": 0.8, "w": 1, "h": 0.2}, "type": "text"}
            ]
        
        return {
            "type": layout_type,
            "zones": validated_zones
        }
    
    def _parse_typography(self, typography: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "headline": {
                "font": typography.get("headline", {}).get("font", "sans-serif"),
                "size": typography.get("headline", {}).get("size", "large"),
                "weight": typography.get("headline", {}).get("weight", "bold")
            },
            "body": {
                "font": typography.get("body", {}).get("font", "sans-serif"),
                "size": typography.get("body", {}).get("size", "medium"),
                "weight": typography.get("body", {}).get("weight", "normal")
            }
        }
    
    def _parse_colors(self, colors: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "primary": colors.get("primary", "#64748b"),
            "background": colors.get("background", "#ffffff"),
            "text": colors.get("text", "#1e293b")
        }
    
    def _parse_compliance(self, compliance: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "no_pricing": compliance.get("no_pricing", True),
            "no_promotional_claims": compliance.get("no_promotional_claims", True),
            "product_focused": compliance.get("product_focused", True)
        }
    
    def validate(self, toon_data: Dict[str, Any]) -> tuple:
        errors = []
        
        if not isinstance(toon_data, dict):
            return False, ["TOON must be a dictionary"]
        
        for field in self.required_fields:
            if field not in toon_data:
                errors.append(f"Missing required field: {field}")
        
        if "layout" in toon_data:
            zones = toon_data["layout"].get("zones", [])
            if not isinstance(zones, list):
                errors.append("Layout zones must be a list")
            else:
                for i, zone in enumerate(zones):
                    if not isinstance(zone, dict):
                        errors.append(f"Zone {i} must be a dictionary")
                    elif "bounds" not in zone:
                        errors.append(f"Zone {i} missing bounds")
        
        return len(errors) == 0, errors
    
    def to_json(self, toon_data: Dict[str, Any]) -> str:
        return json.dumps(toon_data, indent=2)
    
    def from_json(self, json_str: str) -> Dict[str, Any]:
        return self.parse(json.loads(json_str))
