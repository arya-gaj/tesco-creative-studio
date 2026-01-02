import csv
import re
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class Asset:
    sample_id: str
    catalog_content: str
    category: str
    price: Optional[float]
    image_link: Optional[str]
    local_path: str
    
    def to_dict(self) -> Dict:
        return {
            "sample_id": self.sample_id,
            "catalog_content": self.catalog_content,
            "category": self.category,
            "price": self.price,
            "image_link": self.image_link,
            "local_path": self.local_path
        }


class AssetManager:
    
    def __init__(self, csv_path: Path, asset_library_dir: Path):
        self.csv_path = csv_path
        self.asset_library_dir = asset_library_dir
        self.assets: List[Asset] = []
        self._loaded = False
        
    def load(self) -> bool:
        if not self.csv_path.exists():
            print(f"Warning: Asset index CSV not found at {self.csv_path}")
            return False
        
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    catalog_content = row.get('catalog_content', '').replace('\n', ' ')
                    
                    asset = Asset(
                        sample_id=row.get('sample_id', ''),
                        catalog_content=catalog_content,
                        category=row.get('category', ''),
                        price=float(row['price']) if row.get('price') and row['price'].strip() else None,
                        image_link=row.get('image_link', ''),
                        local_path=row.get('local_path', '').replace('\\', '/')
                    )
                    self.assets.append(asset)
            
            self._loaded = True
            print(f"Loaded {len(self.assets)} assets from {self.csv_path}")
            return True
            
        except Exception as e:
            print(f"Error loading asset index: {e}")
            return False
    
    def is_loaded(self) -> bool:
        if not self._loaded:
            self.load()
        return self._loaded
    
    def get_asset_count(self) -> int:
        return len(self.assets)
    
    def get_asset_by_id(self, sample_id: str) -> Optional[Asset]:
        for asset in self.assets:
            if asset.sample_id == sample_id:
                return asset
        return None
    
    def get_assets_by_category(self, category: str) -> List[Asset]:
        return [asset for asset in self.assets if asset.category.lower() == category.lower()]
    
    def search(self, query: str, limit: int = 10) -> List[str]:
        query_lower = query.lower()
        query_tokens = set(re.findall(r'\b\w+\b', query_lower))
        
        scored = []
        for asset in self.assets:
            text = f"{asset.catalog_content} {asset.category}".lower()
            text_tokens = set(re.findall(r'\b\w+\b', text))
            
            score = len(query_tokens & text_tokens)
            if score > 0:
                scored.append((score, asset.local_path))
        
        scored.sort(reverse=True)
        results = [path for _, path in scored[:limit]]
        
        if len(results) == 0:
            return [asset.local_path for asset in self.assets[:limit]]
        
        return results
    
    def tokenize(self, text: str) -> set:
        return set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    
    def get_all_assets(self) -> List[Asset]:
        return self.assets.copy()
