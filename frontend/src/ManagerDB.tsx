import { useEffect, useState } from "react";
import { getDatabasesWithAddress, type DatabaseInfo } from "./services/metadataApi";

import "./ManagerDB.css";

export function ManagerDB() {
    const [items, setItems] = useState<DatabaseInfo[]>([]);

    useEffect(() => {
        getDatabasesWithAddress().then(setItems).catch(console.error);
    }, []);

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

            <button className="db-button">Add new</button>
        </div>
    );
}