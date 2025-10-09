from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from manager.schemas.metadata import Database 
from manager.services.metadata_db.repo import list_databases

from manager.services.metadata_db.writer import fill_metadata_from_dsn

router = APIRouter()

@router.get("/databases", response_model=List[Database])
def get_databases():
    dbs: List[Database] = list_databases()
    return dbs

class FillRequest(BaseModel):
    dsn: str

@router.post("/metadata/fill")
def fill_metadata(req: FillRequest):
    try:
        fill_metadata_from_dsn(req.dsn)
        return {"status": "ok", "dsn": req.dsn}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))