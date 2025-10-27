import axios from "axios";

/** /api/databases */
export interface DatabaseRow {
  id: number;
  name: string;
}

export interface DatabaseInfo {
  id: number;
  name: string;
  address: string;
}

const api = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

export async function getDatabaseRows(): Promise<DatabaseRow[]> {
  const res = await api.get<DatabaseRow[]>("/databases");
  return res.data;
}

export async function getDatabaseAddress(name: string): Promise<string> {
  const res = await api.get<string>(`/databases/${encodeURIComponent(name)}/address`);
  return res.data;
}

export async function getDatabasesWithAddress(): Promise<DatabaseInfo[]> {
  const rows = await getDatabaseRows();

  const settled = await Promise.allSettled(
    rows.map((r) => getDatabaseAddress(r.name))
  );

  return rows.map((r, i) => {
    const s = settled[i];
    return {
      id: r.id,
      name: r.name,
      address: s.status === "fulfilled" ? s.value : "(unavailable)",
    };
  });
}

export async function getDatabases(): Promise<DatabaseInfo[]> {
  return getDatabasesWithAddress();
}

export async function addDatabaseByDsn(dsn: string): Promise<void> {
  try {
    await api.post("/metadata/fill", { dsn });
  } catch (err: any) {
    console.error("Failed to fill metadata:", err);
    throw new Error(err.response?.data?.detail ?? "Request failed");
  }
}

export async function executeQuery(databaseName: string, sqlQuery: string) {
    const response = await api.post("/metadata/execute", {
        database_name: databaseName,
        sql_query: sqlQuery,
    });
    return response.data;
}