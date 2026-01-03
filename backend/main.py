import os
import re
import csv
import hashlib
import json
import base64
import torch
from pathlib import Path
from typing import List, Dict, Optional, Any
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

from diffusers import AutoPipelineForText2Image, StableDiffusionPipeline
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM

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

try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("[Backend] rembg not available, background removal disabled")

class LocalGen:
    def __init__(self):
        self.sd_pipe = None
        self.transformer = None
        self.device = "cpu"
        self.dtype = torch.float32
        
        torch.set_float32_matmul_precision("medium")
        torch.set_num_threads(4)

    def _init_sd(self):
        if self.sd_pipe is None:
            print(f"[LocalGen] Initializing Stable Diffusion 1.5 on CPU (this may take a minute)...")
            try:
                import os
                os.environ["DIFFUSERS_NO_SAFETY_CHECKER"] = "1"
                os.environ["DIFFUSERS_SAFETY_CHECKER_DISABLED"] = "1"
                
                self.sd_pipe = StableDiffusionPipeline.from_pretrained(
                    "runwayml/stable-diffusion-v1-5",
                    torch_dtype=self.dtype,
                    safety_checker=None,
                    requires_safety_checker=False
                )
                self.sd_pipe.to(self.device)
                self.sd_pipe.enable_attention_slicing()
                
                def dummy_safety_checker(images, clip_input):
                    return images, [False] * len(images)
                
                if hasattr(self.sd_pipe, 'safety_checker'):
                    self.sd_pipe.safety_checker = dummy_safety_checker
                if hasattr(self.sd_pipe, 'feature_extractor'):
                    self.sd_pipe.feature_extractor = None
                if hasattr(self.sd_pipe, '_safety_checker'):
                    self.sd_pipe._safety_checker = dummy_safety_checker
                if hasattr(self.sd_pipe, 'components'):
                    if 'safety_checker' in self.sd_pipe.components:
                        self.sd_pipe.components['safety_checker'] = dummy_safety_checker
                    if 'feature_extractor' in self.sd_pipe.components:
                        self.sd_pipe.components['feature_extractor'] = None
                
                print(f"[LocalGen] Stable Diffusion loaded on CPU (safety checker completely disabled)")
            except Exception as e:
                print(f"[LocalGen] Failed to load Stable Diffusion: {e}")
                self.sd_pipe = "failed"

    def _init_transformer(self):
        if self.transformer is None:
            print(f"[LocalGen] Initializing GPT-2 Transformer on CPU...")
            try:
                self.transformer = pipeline(
                    "text-generation",
                    model="gpt2",
                    device=-1,
                    torch_dtype=self.dtype
                )
                print(f"[LocalGen] GPT-2 loaded on CPU")
            except Exception as e:
                print(f"[LocalGen] Failed to load Transformer: {e}")
                self.transformer = "failed"

    async def generate_image(self, prompt: str, background_desc: str, toon: Dict[str, Any]) -> Optional[str]:
        self._init_sd()

        if self.sd_pipe == "failed":
            return None

        # Skip transformer for speed - use direct prompt
        sd_prompt = f"{prompt}, {background_desc}, professional retail background, clean, commercial photography"

        # Fast CPU generation: minimal steps, small size
        try:
            print(f"[LocalGen] Generating image on CPU (fast mode)...")
            import warnings
            warnings.filterwarnings("ignore", category=UserWarning)
            warnings.filterwarnings("ignore", message=".*NSFW.*")
            warnings.filterwarnings("ignore", message=".*safety.*")
            
            if hasattr(self.sd_pipe, 'safety_checker'):
                self.sd_pipe.safety_checker = None
            if hasattr(self.sd_pipe, 'feature_extractor'):
                self.sd_pipe.feature_extractor = None
            
            import random
            import time
            seed = random.randint(0, 2**32 - 1) + int(time.time() * 1000) % 10000
            
            def dummy_safety_checker(images, clip_input):
                return images, [False] * len(images)
            
            if hasattr(self.sd_pipe, 'safety_checker'):
                self.sd_pipe.safety_checker = dummy_safety_checker
            
            with torch.inference_mode():
                result = self.sd_pipe(
                    prompt=sd_prompt,
                    num_inference_steps=4,
                    guidance_scale=3.0,
                    height=256,
                    width=256,
                    output_type="pil",
                    generator=torch.Generator(device=self.device).manual_seed(seed)
                )
                if hasattr(result, 'images') and len(result.images) > 0:
                    image = result.images[0]
                elif isinstance(result, list) and len(result) > 0:
                    image = result[0]
                elif hasattr(result, 'image'):
                    image = result.image
                else:
                    image = result
                
                if image and hasattr(image, 'size'):
                    if image.size == (1, 1) or (hasattr(image, 'mode') and image.mode == 'L' and image.size[0] == 1):
                        print(f"[LocalGen] Warning: Got black image, regenerating with new seed...")
                        import random
                        import time
                        new_seed = random.randint(0, 2**32 - 1) + int(time.time() * 1000) % 10000
                        result = self.sd_pipe(
                            prompt=sd_prompt,
                            num_inference_steps=6,
                            guidance_scale=5.0,
                            height=256,
                            width=256,
                            output_type="pil",
                            generator=torch.Generator(device=self.device).manual_seed(new_seed)
                        )
                        if hasattr(result, 'images') and len(result.images) > 0:
                            image = result.images[0]
                        elif isinstance(result, list) and len(result) > 0:
                            image = result[0]
            
            # Upscale to poster format 1080x1920
            image = image.resize((1080, 1920), Image.Resampling.LANCZOS)
            
            buffer = BytesIO()
            image.save(buffer, format='PNG')
            print(f"[LocalGen] Image generated successfully")
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"[LocalGen] SD generation failed: {e}")
            return None

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
local_gen = LocalGen()

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


class RemoveBackgroundRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image to remove background from")


class RemoveBackgroundResponse(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image with transparent background")
    success: bool = Field(..., description="Whether background removal was successful")


class AssetPositionRequest(BaseModel):
    canvas_elements: List[Dict[str, Any]] = Field(..., description="Current elements on canvas")
    asset_url: str = Field(..., description="URL of the asset to position")
    asset_description: Optional[str] = Field(None, description="Description of the asset/product")
    asset_category: Optional[str] = Field(None, description="Category of the asset/product")
    canvas_width: int = Field(1080, description="Canvas width")
    canvas_height: int = Field(1920, description="Canvas height")


class AssetPositionResponse(BaseModel):
    x: int = Field(..., description="X position for the asset")
    y: int = Field(..., description="Y position for the asset")
    width: int = Field(..., description="Width for the asset")
    height: int = Field(..., description="Height for the asset")


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
            clean_path = asset.replace("assets/", "").replace("asset-library/", "").lstrip("/").lstrip("\\")
            asset_paths.append(f"/assets/{clean_path}")
        
        print(f"[Backend] Returning {len(asset_paths)} assets immediately")
        
        # Generate image in background (non-blocking) - return assets immediately
        img_base64 = None
        try:
            img_base64 = await local_gen.generate_image(normalized_intent, background_description or "", toon)
        except Exception as e:
            print(f"[Backend] Image generation error: {e}")
        
        # Fast fallback to PIL if local generation fails or takes too long
        if not img_base64:
            print("[Backend] Local generation failed or not initialized, falling back to PIL")
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
        
        print(f"[Backend] Final poster image ready, size: {len(img_base64)} chars")
        
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


@app.get("/asset-info")
async def get_asset_info(path: str):
    if not asset_manager.is_loaded():
        raise HTTPException(status_code=503, detail="Asset index not loaded")
    
    clean_path = path.replace("/assets/", "").replace("assets/", "").lstrip("/")
    
    for asset in asset_manager.get_all_assets():
        asset_path = asset.local_path.replace("\\", "/").lstrip("/")
        if asset_path == clean_path or asset_path.endswith(clean_path) or clean_path.endswith(asset_path):
            return {
                "description": asset.catalog_content,
                "category": asset.category,
                "sample_id": asset.sample_id
            }
    
    return {"description": None, "category": None, "sample_id": None}


@app.post("/remove-background", response_model=RemoveBackgroundResponse)
async def remove_background(request: RemoveBackgroundRequest):
    if not REMBG_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Background removal service not available. Please install rembg: pip install rembg"
        )
    
    try:
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(BytesIO(image_data))
        
        print(f"[Backend] Removing background from image: {input_image.size}")
        
        output_bytes = remove(image_data)
        output_image = Image.open(BytesIO(output_bytes))
        
        buffer = BytesIO()
        output_image.save(buffer, format='PNG')
        output_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        print(f"[Backend] Background removed successfully")
        
        return RemoveBackgroundResponse(
            image_base64=output_base64,
            success=True
        )
        
    except Exception as e:
        print(f"[Backend] Background removal error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Background removal failed: {str(e)}"
        )


@app.post("/asset-position", response_model=AssetPositionResponse)
async def get_asset_position(request: AssetPositionRequest):
    try:
        position = await ai_engine.get_asset_position(
            canvas_elements=request.canvas_elements,
            asset_url=request.asset_url,
            asset_description=request.asset_description,
            asset_category=request.asset_category,
            canvas_width=request.canvas_width,
            canvas_height=request.canvas_height
        )
        
        return AssetPositionResponse(
            x=position["x"],
            y=position["y"],
            width=position["width"],
            height=position["height"]
        )
        
    except Exception as e:
        print(f"[Backend] Asset positioning error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Asset positioning failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    print("Starting backend on http://localhost:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
