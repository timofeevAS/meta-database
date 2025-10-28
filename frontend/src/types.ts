export interface TableInfo {
  tableName: string;
  columns: string[];
}

export interface DatabaseMetadataInfo {
  databaseName: string;
  tables: TableInfo[];
}

export interface SelectFactoryProps {
  metadata: DatabaseMetadataInfo[];
  onUpdateHistory: () => void;
  onShowQuery: (result:any) => void;
}

export interface SavedQuery {
  databaseName: string;
  sqlQuery: string;
  createdAt: Date;
}

export interface QueryHistoryProps {
  history: SavedQuery[];
  onUpdateHistory: () => void;
  onShowQuery: (result:any) => void;
}