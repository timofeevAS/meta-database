import { useEffect, useState } from 'react'
import { ManagerDB } from './ManagerDB'
import { SelectFactory } from './SelectFactory'

import { type DatabaseMetadataInfo, type SelectFactoryProps, type TableInfo } from './types'

export default function App() {
  const [databases, setDatabases] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SelectFactoryProps>({ metadata: [] })

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

        setMetadata({ metadata: formatted });
      })
      .catch((e) => setError(String(e)));
  }, [])

  return (
    <div>
      <ManagerDB />
      {metadata.metadata.length > 0 && <SelectFactory {...metadata} />}
    </div>
  )
}