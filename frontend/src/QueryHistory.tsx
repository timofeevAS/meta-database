import "./QueryHistory.css";
import type { QueryHistoryProps } from './types';
import { executeQuery } from "./services/metadataApi";

export function QueryHistory({ history, onUpdateHistory}: QueryHistoryProps) {
    console.log("Loaded history:", history);

    async function handleExecute(databaseName: string, sqlQuery: string) {
        try {
            const data = await executeQuery(databaseName, sqlQuery);
            alert(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Error executing query:", err);
            alert("❌ Error executing query: " + (err instanceof Error ? err.message : String(err)));
        }
        onUpdateHistory()
    }

    return (
        <div className="qh-container">
            <h2 className="qh-table-title">Query history</h2>
            <table className="qh-table">
                <thead>
                    <tr>
                        <th>database_name</th>
                        <th>sql_query</th>
                        <th>created_at</th>
                        <th>execute?</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((q, i) => (
                        <tr key={i}>
                            <td>{q.databaseName}</td>
                            <td>{q.sqlQuery}</td>
                            <td>{new Date(q.createdAt).toLocaleString()}</td>
                            <td>
                                <button className="qh-exec-button" onClick={() => { handleExecute(q.databaseName, q.sqlQuery); }}>
                                    Execute
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}