import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional


class BlockchainLedger:
    
    def __init__(self):
        self.ledger: list[Dict[str, Any]] = []
        self.block_counter = 0
    
    async def commit(
        self,
        hash_value: str,
        compliance_summary: Dict[str, Any],
        canvas_state: Dict[str, Any]
    ) -> Optional[str]:
        block = {
            "block_id": f"BLOCK_{self.block_counter:06d}",
            "timestamp": datetime.utcnow().isoformat(),
            "hash": hash_value,
            "compliance_summary": compliance_summary,
            "canvas_state_hash": self._hash_canvas_state(canvas_state),
            "previous_hash": self._get_previous_hash(),
            "verified": compliance_summary.get("compliant", False)
        }
        
        self.ledger.append(block)
        self.block_counter += 1
        
        print(f"Committed to ledger: {block['block_id']} (Hash: {hash_value[:16]}...)")
        
        return block["block_id"]
    
    def _hash_canvas_state(self, canvas_state: Dict[str, Any]) -> str:
        canvas_json = json.dumps(canvas_state, sort_keys=True)
        return hashlib.sha256(canvas_json.encode()).hexdigest()
    
    def _get_previous_hash(self) -> Optional[str]:
        if len(self.ledger) == 0:
            return None
        return self.ledger[-1]["hash"]
    
    def get_block(self, block_id: str) -> Optional[Dict[str, Any]]:
        for block in self.ledger:
            if block["block_id"] == block_id:
                return block
        return None
    
    def verify_hash(self, hash_value: str) -> bool:
        for block in self.ledger:
            if block["hash"] == hash_value:
                return True
        return False
    
    def get_ledger_summary(self) -> Dict[str, Any]:
        return {
            "total_blocks": len(self.ledger),
            "latest_block_id": self.ledger[-1]["block_id"] if self.ledger else None,
            "verified_count": sum(1 for b in self.ledger if b.get("verified", False))
        }
