from typing import List
from fastapi import APIRouter

from manager.schemas.metadata import Database 
from manager.services.metadata_db.repo import list_databases

router = APIRouter()

@router.get("/databases", response_model=List[Database])
def get_databases():
    dbs: List[Database] = list_databases()
    return dbs
