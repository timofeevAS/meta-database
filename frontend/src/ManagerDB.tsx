import { useEffect, useState } from "react";
import { addDatabaseByDsn, getDatabasesWithAddress, type DatabaseInfo } from "./services/metadataApi";

import "./ManagerDB.css";

export function ManagerDB() {
    const [items, setItems] = useState<DatabaseInfo[]>([]);

    // Add new button hooks vars;
    const [newDsn, setNewDsn] = useState("");
    const [saving, setSaving] = useState(false);

    const reload = async () => setItems(await getDatabasesWithAddress());


    useEffect(() => {
        getDatabasesWithAddress().then(setItems).catch(console.error);
    }, []);

    async function handleAdd() {
        const dsn = newDsn.trim();
        if (!dsn) return;
        setSaving(true);
        try {
            await addDatabaseByDsn(dsn);
            await reload();
            setNewDsn("");
            alert("Database metadata filled successfully!");
        } catch (e: any) {
            alert("Error: " + (e?.message ?? "Request failed"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="db-container">
            <h2 className="db-title">Current databases</h2>

            <table className="db-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Address</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.name}>
                            <td>{item.name}</td>
                            <td>{item.address}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="db-adder">
                <button
                    className="db-button"
                    onClick={handleAdd}
                    disabled={saving || !newDsn.trim()}
                >
                    {saving ? "Adding..." : "Add new"}
                </button>
                <input
                    placeholder="postgresql://username:password@domain.example.com:port/databasename"
                    value={newDsn}
                    onChange={(e) => setNewDsn(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
            </div>
        </div>
    );
}