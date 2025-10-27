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

type GenTable = {
    databaseName: string;
    tableName: string;
}

type SqlOperator =
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="

type GenCondition = {
    column: GenColumn,
    operator: SqlOperator,
    value: string
}

function formatSelectColumnItem(genColumn: GenColumn): string {
    return `${genColumn.columnName} (${genColumn.databaseName})`
}

function formatSelectTableItem(genColumn: GenTable): string {
    return `${genColumn.tableName} (${genColumn.databaseName})`
}

function parseTableDisplayValue(value: string): { tableName: string; databaseName: string } | null {
    const match = value.match(/^(.+)\s*\((.+)\)$/);
    if (!match) return null;

    const [, tableName, databaseName] = match.map(s => s.trim());
    return { tableName, databaseName };
}

function SfGenerator({ metadata, onPreview }: GenProps) {
    const [dbName, setDbName] = useState<string>("");
    const [selectedTable, setSelectedTable] = useState<GenTable>({ tableName: "", databaseName: "" });
    const [availableTables, setAvailableTables] = useState<GenTable[]>([])
    const [selectedCols, setSelectedCols] = useState<GenColumn[]>([]);
    const [availableCols, setAvailableCols] = useState<GenColumn[]>([]);
    const [selectedCondition, setSelectedCondition] = useState<GenCondition>({ column: { columnName: "", databaseName: "", tableName: "" }, operator: "=", value: "" })

    const colKey = (c: GenColumn) => `${c.databaseName}::${c.columnName}`;
    const tableKey = (c: GenTable) => `${c.databaseName}::${c.tableName}`;

    {/* Initialization for availableCols */ }
    useEffect(() => {
        if (!metadata) return;

        const cols: GenColumn[] = [];
        const tables: GenTable[] = [];
        metadata.forEach((db) => {
            db.tables.forEach((table) => {
                tables.push({
                    tableName: table.tableName,
                    databaseName: db.databaseName,
                });
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
        setAvailableTables(tables);
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
        const newTable: GenTable = { databaseName: dbName, tableName: etalonTableName };
        console.log("Update selected table", newTable);
        setSelectedTable(newTable);
    }, [selectedCols]);

    useEffect(() => {
        if (selectedTable.databaseName === "" && selectedTable.tableName === "") {
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
            setSelectedCols([]);
            return;
        }

        const cols: GenColumn[] = [];
        // Take columns only from same database and same table!!!
        metadata.forEach((db) => {
            if (db.databaseName === selectedTable.databaseName) {
                db.tables.forEach((table) => {
                    if (table.tableName === selectedTable.tableName) {
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

        console.log("Update available cols via useEffect(selectedTable)");
        console.table(cols);
        setAvailableCols(cols);
        setDbName(selectedTable.databaseName)


    }, [selectedTable])


    function getColumnsFromGenTable(gt: GenTable): GenColumn[] {
        const cols: GenColumn[] = [];
        metadata.forEach((db) => {
            if (db.databaseName === gt.databaseName) {
                db.tables.forEach((table) => {
                    if (table.tableName == gt.tableName) {
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
        return cols;
    }


    {/* Debug output. */ }
    useEffect(() => {
        console.log('selectedCols changed:', selectedCols);
    }, [selectedCols]);

    useEffect(() => {
        console.log('availableCols changed:');
        console.table(availableCols);
    }, [availableCols]);

    useEffect(() => {
        console.log('selectedTable changed:');
        console.log(selectedTable);
    }, [selectedTable]);

    useEffect(() => {
        console.log('SfGenerator mounted');
        return () => console.log('SfGenerator unmounted');
    }, []);

    return (
        <div className="sf-generator-container">
            <div className="sf-generator">
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
                <span className="sf-keyword">FROM</span>
                {
                    <select
                        key={tableKey(selectedTable)}
                        value={formatSelectTableItem(selectedTable)}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue === "") {
                                setSelectedTable({ databaseName: "", tableName: "" })
                            }
                            const parsed = parseTableDisplayValue(newValue);
                            if (parsed) {
                                setSelectedTable(parsed);
                            }
                            return;
                        }}
                    >
                        <option value="">? select table</option>
                        {selectedTable?.databaseName === "" ? availableTables
                            // exclude already selected
                            .map((availableTable) => (
                                <option
                                    key={tableKey(availableTable)}
                                    value={formatSelectTableItem(availableTable)}
                                >
                                    {formatSelectTableItem(availableTable)}
                                </option>
                            )) : (<option
                                value={formatSelectTableItem(selectedTable)}
                            >
                                {formatSelectTableItem(selectedTable)}
                            </option>)}
                    </select>
                }
                {selectedCols.length > 0 && (
                    <div className="sf-condition">
                        <span className="sf-keyword">WHERE</span>
                        <select
                            value={selectedCondition.column ? formatSelectColumnItem(selectedCondition.column) : ""}
                            onChange={(e) => {
                                console.log("try to set new column in condition.");
                                const val = e.target.value;
                                if (val === "") {
                                   // Reset condition.
                                    setSelectedCondition({ column: { columnName: "", databaseName: "", tableName: "" }, operator: "=", value: "" });
                                    return;
                                }

                                const currentColumns: GenColumn[] = getColumnsFromGenTable(selectedTable);
                                console.log("Get current columns:", currentColumns);
                                console.log("Val:", val);
                                const newColumn: GenColumn | undefined = currentColumns.find((c) => {
                                    return formatSelectColumnItem(c) === val;
                                });
                                if (newColumn) {
                                    console.log("New condition: (update column)", newColumn);
                                    setSelectedCondition(prev => ({ ...prev, column: newColumn }));
                                }
                                else {
                                    console.log("newColumns is undefined");
                                }
                            }}
                        >
                            <option value="">+ add column</option>
                            {getColumnsFromGenTable(selectedTable)
                                .map((col) => (
                                    <option
                                        key={colKey(col)}
                                        value={formatSelectColumnItem(col)}
                                    >
                                        {formatSelectColumnItem(col)}
                                    </option>
                                ))}
                        </select>
                        <div>
                            <select
                                className="sf-condition-operator"
                                value={selectedCondition.operator}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const newOperator: SqlOperator = val as SqlOperator;
                                    setSelectedCondition(prev => ({ ...prev, operator: newOperator }));
                                }}
                            >
                                <option value="=">=</option>
                                <option value="!=">≠</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">≥</option>
                                <option value="<=">≤</option>
                            </select>
                        </div>
                        <input
                            className="sf-condition-value"
                            placeholder="value (name, 123)"
                            value={selectedCondition.value}
                            onChange={(e) => {
                                setSelectedCondition(prev => ({ ...prev, value: e.target.value }));
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}