import { useState } from 'react'

import "./SelectFactory.css";

export function SelectFactory() {
    /* TODO: add real setSqlQuery */
    const [sqlQuery, setSqlQuery] = useState("-- Your SQL query.");

    return (
        <div className="sf-container">
            <h2 className="sf-title">Select from meta-storage</h2>

            <div className="sf-example">
                {sqlQuery}
            </div>

            <div className="sf-executer">
                <button className="sf-button">
                    Execute
                </button>
            </div>
        </div>
    );
}