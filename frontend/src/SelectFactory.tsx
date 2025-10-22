import { useState, useEffect } from "react";

import "./SelectFactory.css";
import type { DatabaseMetadataInfo, SelectFactoryProps } from './types';

export function SelectFactory(metadata: SelectFactoryProps) {
    /* TODO: add real setSqlQuery */
    const [sqlQuery, setSqlQuery] = useState("-- Your SQL query.");

    console.log("Loaded metadata:", metadata);

    return (
        <div className="sf-container">
            <h2 className="sf-title">Select from meta-storage</h2>

            <SfGenerator metadata={metadata.metadata} onPreview={setSqlQuery} />

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

type GenProps = {
    metadata: DatabaseMetadataInfo[];
    onPreview: (sql: string) => void;
};

type GenColumn = {
    columnName: string;
    databaseName: string;
    tableName: string;
}

function formatSelectColumnItem(genColumn: GenColumn): string {
    return `${genColumn.columnName} (${genColumn.databaseName})`
}

function SfGenerator({ metadata, onPreview }: GenProps) {
    const [dbName, setDbName] = useState<string>("");
    const [selectedCols, setSelectedCols] = useState<GenColumn[]>([]);
    const [availableCols, setAvailableCols] = useState<GenColumn[]>([]);

    const colKey = (c: GenColumn) => `${c.databaseName}::${c.columnName}`;

    {/* Initialization for availableCols */ }
    useEffect(() => {
        if (!metadata) return;

        const cols: GenColumn[] = [];
        metadata.forEach((db) => {
            db.tables.forEach((table) => {
                table.columns.forEach((colName) => {
                    cols.push({
                        columnName: colName,
                        databaseName: db.databaseName,
                        tableName: table.tableName,
                    });
                });
            });
        });

        setAvailableCols(cols);
    }, [metadata]);

    useEffect(() => {
        if (selectedCols.length == 0) {
            const cols: GenColumn[] = [];
            metadata.forEach((db) => {
                db.tables.forEach((table) => {
                    table.columns.forEach((colName) => {
                        cols.push({
                            columnName: colName,
                            databaseName: db.databaseName,
                            tableName: table.tableName,
                        });
                    });
                });
            });

            setAvailableCols(cols);
            return;
        }

        const etalonTableName: string = selectedCols[0].tableName;

        const cols: GenColumn[] = [];
        // Take columns only from same database and same table!!!
        metadata.forEach((db) => {
            if (db.databaseName === dbName) {
                db.tables.forEach((table) => {
                    if (table.tableName === etalonTableName) {
                        table.columns.forEach((colName) => {
                            cols.push({
                                columnName: colName,
                                databaseName: db.databaseName,
                                tableName: table.tableName,
                            });
                        });
                    }
                });
            }
        });

        setAvailableCols(cols);
    }, [selectedCols]);

    {/* Debug output. */ }
    useEffect(() => {
        console.log('selectedCols changed:', selectedCols);
    }, [selectedCols]);

    useEffect(() => {
        window.console.log('availableCols changed:');
        window.console.log(availableCols);
    }, [availableCols]);

    useEffect(() => {
        console.log('SfGenerator mounted');
        return () => console.log('SfGenerator unmounted');
    }, []);

    return (
        <div className="sf-generator-container">
            <div className="sf-columns">
                <span className="sf-keyword">SELECT</span>
                {/* already selected */}
                {selectedCols?.map((col) => (
                    <select
                        key={colKey(col)}
                        value={formatSelectColumnItem(col)}
                        onChange={(e) => {
                            const newValue = e.target.value;

                            // (1) Empty variant = delete.
                            if (newValue === "") {
                                setSelectedCols((prev) =>
                                    prev.filter(
                                        (c) =>
                                            formatSelectColumnItem(c) !== formatSelectColumnItem(col)
                                    )
                                );
                                return;
                            }

                            // (2) Repeat choose - ignore.
                            if (newValue === formatSelectColumnItem(col)) {
                                return;
                            }

                            // (3) Otherwise: find chosen.
                            const newCol = availableCols.find(
                                (c) => formatSelectColumnItem(c) === newValue
                            );
                            if (!newCol) return;

                            // (4) Replace old with new.
                            setSelectedCols((prev) =>
                                prev.map((c) =>
                                    formatSelectColumnItem(c) === formatSelectColumnItem(col)
                                        ? newCol
                                        : c
                                )
                            );
                        }}
                    >
                        <option value="">- unselect -</option>
                        {availableCols.map((availableCol) => (
                            <option
                                key={colKey(availableCol)}
                                value={formatSelectColumnItem(availableCol)}
                            >
                                {formatSelectColumnItem(availableCol)}
                            </option>
                        ))}
                    </select>
                ))}
                {/* new column? if some columns available*/}
                {/** TODO: some HACK here. need to fix? */}
                {selectedCols.length !== availableCols.length &&
                    <select
                        value=""
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            const selectedCol = availableCols.find(
                                (col) => formatSelectColumnItem(col) === selectedValue
                            );
                            if (selectedCol) {
                                setSelectedCols((prev) => [...prev, selectedCol]);
                                setDbName(selectedCol.databaseName);
                            }
                        }}
                    >
                        <option value="">+ add column</option>
                        {availableCols
                            // exclude already selected
                            .filter(
                                (col) =>
                                    !selectedCols.some(
                                        (selected) =>
                                            formatSelectColumnItem(selected) ===
                                            formatSelectColumnItem(col)
                                    )
                            )
                            .map((availableCol) => (
                                <option
                                    key={colKey(availableCol)}
                                    value={formatSelectColumnItem(availableCol)}
                                >
                                    {formatSelectColumnItem(availableCol)}
                                </option>
                            ))}
                    </select>
                }
            </div>
        </div>
    );
}