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