import { useEffect, useState } from 'react'
import { ManagerDB } from './ManagerDB'

export default function App() {
  const [databases, setDatabases] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple example: fetch from FastAPI /api
    fetch('/api/databases')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => setDatabases(data.map((d: { name: string }) => d.name)))
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div>
      <ManagerDB/>
    </div>
  )
}