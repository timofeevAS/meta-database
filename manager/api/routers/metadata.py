from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from manager.schemas.metadata import Database 
from manager.services.metadata_db.repo import list_databases, get_database_address_by_name, list_tables, list_columns

from manager.services.metadata_db.writer import fill_metadata_from_dsn

router = APIRouter()

@router.get("/databases", response_model=List[Database])
def get_databases():
    dbs: List[Database] = list_databases()
    return dbs

@router.get("/databases/{name}/address", response_model=str)
def get_database_address(name: str):
    addr = get_database_address_by_name(name)
    return addr

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
    
class TableSimpleView(BaseModel):
    table_name: str
    columns: List[str]

class DatabaseMetadataInfo(BaseModel):
    database_name: str
    tables: List[TableSimpleView]

class MetadataInfoSimpleView(BaseModel):
    metadata: List[DatabaseMetadataInfo]

@router.get("/metadata/info", response_model=MetadataInfoSimpleView)
def get_metadata_info():
    metadata_info_simple_view: MetadataInfoSimpleView = MetadataInfoSimpleView(metadata=[])
    databases: List[Database] = list_databases()
    for db in databases:
        db_metadata_info: DatabaseMetadataInfo = DatabaseMetadataInfo(database_name=db.name, tables=[])
        tables = list_tables(db)
        for table in tables:
            columns = list_columns(table)
            columns_names: List[str] = [col.name for col in columns]
            db_metadata_info.tables.append(TableSimpleView(table_name=table.name, columns=columns_names))
        metadata_info_simple_view.metadata.append(db_metadata_info)
    return metadata_info_simple_view
