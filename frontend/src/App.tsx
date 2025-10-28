import { useEffect, useState } from 'react'
import { ManagerDB } from './ManagerDB'
import { SelectFactory } from './SelectFactory'
import { QueryHistory } from './QueryHistory'

import type { DatabaseMetadataInfo, TableInfo, SavedQuery } from './types'
import { QueryResultModal } from './QueryResultModal'

export default function App() {
  const [databases, setDatabases] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<DatabaseMetadataInfo[]>([])
  const [queryHistory, setQueryHistory] = useState<SavedQuery[]>([])
  const [queryData, setQueryData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false);


  useEffect(() => {
    // Simple example: fetch from FastAPI /api
    fetch('/api/databases')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => setDatabases(data.map((d: { name: string }) => d.name)))
      .catch((e) => setError(String(e)))

    fetch('/api/metadata/info')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: { metadata: { database_name: string; tables: { table_name: string; columns: string[] }[] }[] }) => {
        console.log("/api/metadata/info:", data.metadata);

        const formatted = data.metadata.map((db): DatabaseMetadataInfo => ({
          databaseName: db.database_name,
          tables: db.tables.map((t): TableInfo => ({
            tableName: t.table_name,
            columns: t.columns
          }))
        }));

        setMetadata(formatted);
      })
      .catch((e) => setError(String(e)));

    fetch('/api/metadata/query_list')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: { database_name: string; sql_query: string; created_at: string }[]) => {
        console.log("/api/metadata/query_list:", data);

        const formatted = data.map((q): SavedQuery => ({
          databaseName: q.database_name,
          sqlQuery: q.sql_query,
          createdAt: new Date(q.created_at),
        }));
        console.log(formatted);
        setQueryHistory(formatted);
      })
      .catch((e) => setError(String(e)));
  }, [])

  function fetchQueryList(): void {
    fetch('/api/metadata/query_list')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: { database_name: string; sql_query: string; created_at: string }[]) => {
        console.log("/api/metadata/query_list:", data);

        const formatted = data.map((q): SavedQuery => ({
          databaseName: q.database_name,
          sqlQuery: q.sql_query,
          createdAt: new Date(q.created_at),
        }));
        console.log(formatted);
        setQueryHistory(formatted);
      })
      .catch((e) => setError(String(e)));
  }

  function showQueryResult(result:any) {
    setModalOpen(true);
    setQueryData(result)
  }

  return (
    <div>
      <ManagerDB />
      {metadata.length > 0 && <SelectFactory metadata={metadata} onUpdateHistory={fetchQueryList} onShowQuery={showQueryResult} />}
      {queryHistory.length > 0 && <QueryHistory history={queryHistory} onUpdateHistory={fetchQueryList} onShowQuery={showQueryResult}/>}

      <QueryResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={queryData}
      />
    </div>
  )
}