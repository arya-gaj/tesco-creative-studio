import os
import re
import csv
import hashlib
import json
import base64
from pathlib import Path
from typing import List, Dict, Optional, Any
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from app.services.ai_engine import AIEngine
from app.services.asset_manager import AssetManager
from app.services.compliance_engine import ComplianceEngine
from app.services.toon_parser import TOONParser
from app.services.blockchain import BlockchainLedger

app = FastAPI(
    title="Retail Media Creative Builder API",
    description="Compliance-first AI orchestration engine for retail media creative assembly",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent.parent
ASSET_LIBRARY_DIR = BASE_DIR / "asset-library"
ASSET_INDEX_CSV = BASE_DIR / "asset-index.csv"

asset_manager = AssetManager(ASSET_INDEX_CSV, ASSET_LIBRARY_DIR)
ai_engine = AIEngine()
compliance_engine = ComplianceEngine()
toon_parser = TOONParser()
blockchain = BlockchainLedger()

if ASSET_LIBRARY_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSET_LIBRARY_DIR)), name="assets")


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="User's creative request prompt")
    format: Optional[str] = Field(None, description="Creative format (e.g., 'banner', 'social', 'display')")
    channel: Optional[str] = Field(None, description="Channel (e.g., 'amazon', 'walmart', 'target')")


class GenerateResponse(BaseModel):
    assets: List[str] = Field(..., description="List of recommended asset paths")
    toon: Dict[str, Any] = Field(..., description="TOON representation of the creative structure")
    normalized_intent: str = Field(..., description="Normalized, guideline-safe intent")
    compliance_summary: Dict[str, Any] = Field(..., description="Compliance validation summary")
    background_description: Optional[str] = Field(None, description="Neutral background/layout description")
    image_base64: Optional[str] = Field(None, description="Generated poster image as base64")


class VerifyRequest(BaseModel):
    canvas_state: Dict[str, Any] = Field(..., description="Current canvas state with all elements")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    toon: Optional[Dict[str, Any]] = Field(None, description="TOON representation if available")


class VerifyResponse(BaseModel):
    hash: str = Field(..., description="SHA-256 hash of the compliance summary")
    block_id: Optional[str] = Field(None, description="Hyperledger Fabric block ID")
    compliance_summary: Dict[str, Any] = Field(..., description="Final compliance summary")
    verified: bool = Field(..., description="Whether compliance verification passed")
    message: str = Field(..., description="Verification status message")


@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "retail-media-creative-builder",
        "assets_loaded": asset_manager.is_loaded(),
        "asset_count": asset_manager.get_asset_count() if asset_manager.is_loaded() else 0
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate_creative(request: GenerateRequest):
    try:
        normalized_intent = await ai_engine.normalize_prompt(
            prompt=request.prompt,
            format=request.format,
            channel=request.channel
        )
        
        toon = await ai_engine.generate_toon(
            normalized_intent=normalized_intent,
            format=request.format,
            channel=request.channel
        )
        
        recommended_assets = await ai_engine.recommend_assets(
            prompt=normalized_intent,
            asset_manager=asset_manager,
            max_assets=8
        )
        
        background_description = await ai_engine.generate_background_description(
            normalized_intent=normalized_intent,
            toon=toon
        )
        
        compliance_summary = await compliance_engine.validate(
            prompt=normalized_intent,
            toon=toon,
            assets=recommended_assets
        )
        
        asset_paths = []
        for asset in recommended_assets:
            clean_path = asset.replace("assets/", "").lstrip("/")
            asset_paths.append(f"/assets/{clean_path}")
        
        img = Image.new('RGB', (1080, 1920), color='#f8fafc')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
            except:
                font = ImageFont.load_default()
        
        text = normalized_intent[:50] + "..." if len(normalized_intent) > 50 else normalized_intent
        
        x = 50
        y = 200
        
        draw.rectangle([x - 20, y - 20, 1030, y + 150], fill='white', outline='#64748b', width=3)
        draw.text((x, y), text, fill='#64748b', font=font)
        
        if background_description:
            desc_text = background_description[:100] + "..." if len(background_description) > 100 else background_description
            try:
                desc_font = ImageFont.truetype("arial.ttf", 40)
            except:
                try:
                    desc_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
                except:
                    desc_font = ImageFont.load_default()
            
            desc_x = 50
            desc_y = y + 200
            
            draw.text((desc_x, desc_y), desc_text, fill='#94a3b8', font=desc_font)
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        print(f"[Backend] Generated poster image, size: {len(img_base64)} chars")
        
        return GenerateResponse(
            assets=asset_paths,
            toon=toon,
            normalized_intent=normalized_intent,
            compliance_summary=compliance_summary,
            background_description=background_description,
            image_base64=img_base64
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )


@app.post("/verify", response_model=VerifyResponse)
async def verify_and_commit(request: VerifyRequest):
    try:
        if not request.canvas_state:
            raise HTTPException(status_code=400, detail="Canvas state is required")
        
        compliance_summary = await compliance_engine.generate_final_summary(
            canvas_state=request.canvas_state,
            toon=request.toon,
            metadata=request.metadata
        )
        
        summary_json = json.dumps(compliance_summary, sort_keys=True)
        hash_value = hashlib.sha256(summary_json.encode()).hexdigest()
        
        block_id = await blockchain.commit(
            hash_value=hash_value,
            compliance_summary=compliance_summary,
            canvas_state=request.canvas_state
        )
        
        verified = compliance_summary.get("compliant", False)
        
        return VerifyResponse(
            hash=hash_value,
            block_id=block_id,
            compliance_summary=compliance_summary,
            verified=verified,
            message="Creative verified and committed to ledger" if verified else "Compliance issues detected"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@app.get("/assets/search")
async def search_assets(q: str, limit: int = 10):
    if not asset_manager.is_loaded():
        raise HTTPException(status_code=503, detail="Asset index not loaded")
    
    results = asset_manager.search(q, limit=limit)
    return {"assets": results, "count": len(results)}


if __name__ == "__main__":
    import uvicorn
    print("Starting backend on http://localhost:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
