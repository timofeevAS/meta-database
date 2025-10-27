import { useState, useEffect, useRef } from "react";

import "./SelectFactory.css";
import type { DatabaseMetadataInfo, SelectFactoryProps } from './types';
import { executeQuery } from "./services/metadataApi";

export function SelectFactory(metadata: SelectFactoryProps) {
    /* TODO: add real setSqlQuery */
    const [sqlQuery, setSqlQuery] = useState("");
    const [databaseName, setDatabaseName] = useState(""); // TODO: Using this database name in future to complete sql query.
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    console.log("Loaded metadata:", metadata);

    async function handleExecute() {
        try {
            setLoading(true);
            const data = await executeQuery(databaseName, sqlQuery);
            setResult(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Error executing query:", err);
            setResult("Error executing query");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="sf-container">
            <h2 className="sf-title">Select from meta-storage</h2>

            <SfGenerator metadata={metadata.metadata} onPreview={setSqlQuery} onSelectDatabase={setDatabaseName} />

            <div className="sf-example">
                {sqlQuery}
            </div>

            <div className="sf-executer">
                <button className="sf-button" onClick={handleExecute} disabled={loading}>
                    {loading ? "Executing..." : "Execute"}
                </button>
            </div>

            {result && (
                <pre className="sf-result">
                    {result}
                </pre>
            )}
        </div>
    );
}

type GenProps = {
    metadata: DatabaseMetadataInfo[];
    onPreview: (sql: string) => void;
    onSelectDatabase: (databaseName: string) => void;
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

type SelectionState = {
    dbName: string;
    selectedTable: GenTable;
    availableTables: GenTable[];
    selectedCols: GenColumn[];
    availableCols: GenColumn[];
    selectedCondition: GenCondition;
};

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

const initialSelectionState: SelectionState = {
    dbName: "",
    selectedTable: { tableName: "", databaseName: "" },
    availableTables: [],
    selectedCols: [],
    availableCols: [],
    selectedCondition: {
        column: { columnName: "", databaseName: "", tableName: "" },
        operator: "=",
        value: "",
    },
};

function SfGenerator({ metadata, onPreview, onSelectDatabase }: GenProps) {
    const [selection, setSelection] = useState<SelectionState>(initialSelectionState)
    const lastSelectionRef = useRef<SelectionState | null>(null);

    function resetSelection() {
        setSelection(initialSelectionState);
    }


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

        setSelection((prev) => ({
            ...prev,
            availableTables: tables,
            availableCols: cols
        }));
    }, []);


    useEffect(() => {
        console.log("UseEffect calling. Try to synchronize UI.");
        if (!metadata) return;

        const prevSel = lastSelectionRef.current;
        if (
            prevSel &&
            prevSel.dbName === selection.dbName &&
            prevSel.selectedTable.databaseName === selection.selectedTable.databaseName &&
            prevSel.selectedTable.tableName === selection.selectedTable.tableName &&
            prevSel.selectedCols.length === selection.selectedCols.length
        ) {
            console.log("Skip update: selection same as last time");
            return;
        }
        lastSelectionRef.current = selection;

        // if hasn't dbname or not chosen some columns.
        console.log("Current selection", selection);
        if ((selection.selectedCols.length == 0 && selection.selectedTable.tableName === "")) {
            console.log("UseEffect[S]:Reset")
            const allCols: GenColumn[] = [];
            const allTables: GenTable[] = [];
            metadata.forEach((db) => {
                db.tables.forEach((table) => {
                    allTables.push({
                        tableName: table.tableName,
                        databaseName: db.databaseName,
                    });
                    table.columns.forEach((colName) => {
                        allCols.push({
                            columnName: colName,
                            databaseName: db.databaseName,
                            tableName: table.tableName,
                        });
                    });
                });
            });

            setSelection((prev) => ({
                ...prev,
                selectedCols: [],
                selectedTable: { databaseName: "", tableName: "" },
                dbName: "",
                availableTables: allTables,
                availableCols: allCols
            }));
            return;
        }

        const etalonGenTable: GenTable | null = selection.selectedCols.length > 0 ? { tableName: selection.selectedCols[0].tableName, databaseName: selection.selectedCols[0].databaseName }
            : (selection.selectedTable ? selection.selectedTable : null);
        console.log("UseEffect[S]: etalonTable", etalonGenTable);

        if (!etalonGenTable) {
            console.error("Error getting etalon Table name...");
            return;
        }

        const cols: GenColumn[] = [];
        // Take columns only from same database and same table!!!
        metadata.forEach((db) => {
            if (db.databaseName === etalonGenTable.databaseName) {
                db.tables.forEach((table) => {
                    if (table.tableName === etalonGenTable.tableName) {
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

        console.log("Available cols:");
        console.table(cols);

        console.log("Update selected table", etalonGenTable);

        setSelection((prev) => ({
            ...prev,
            selectedTable: etalonGenTable,
            availableCols: cols,
            dbName: etalonGenTable.databaseName
        }));
    }, [metadata, selection]);

    {/* If something change update preview SQL query. */ }
    useEffect(() => { onPreview(getSqlQuery()); }, [selection]);

    {/* If database name update. Update parent's database name. */ }
    useEffect(() => { onSelectDatabase(selection.dbName); }, [selection]);

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

    function getSqlQuery(): string {
        if (!selection.selectedTable.databaseName) {
            return "-- Start generate your SELECT query. (Can start with choose table)";
        }

        // SELECT block. (if fields doesn't selected use *).
        const cols = selection.selectedCols.length > 0
            ? selection.selectedCols.map(c => c.columnName).join(", ")
            : "*";

        let sql = `SELECT ${cols}\nFROM ${selection.selectedTable.tableName}`;

        // WHERE block.
        const cond = selection.selectedCondition;
        if (cond.column.columnName && cond.value !== undefined && cond.value !== null) {
            const value =
                cond.value === ""
                    ? "''"
                    : isFinite(Number(cond.value))
                        ? cond.value
                        : `'${cond.value.replace(/'/g, "''")}'`;

            sql += `\nWHERE ${cond.column.columnName} ${cond.operator} ${value}`;
        }

        sql += ";";
        return sql;
    }

    function getExclusiveAvailableCols(
        availableCols: GenColumn[],
        selectedCols: GenColumn[]
    ): GenColumn[] {
        if (selectedCols.length === 0) return availableCols;

        return availableCols.filter(avCol => {
            return !selectedCols.some(selCol =>
                selCol.databaseName === avCol.databaseName &&
                selCol.tableName === avCol.tableName &&
                selCol.columnName === avCol.columnName
            );
        });
    }

    return (
        <div className="sf-generator-container">
            <div className="sf-generator">
                <span className="sf-keyword">SELECT</span>
                {/* already selected */}
                {selection.selectedCols?.map((col) => (
                    <select
                        key={colKey(col)}
                        value={formatSelectColumnItem(col)}
                        onChange={(e) => {
                            const newValue = e.target.value;

                            // (1) Empty variant = delete.
                            if (newValue === "") {
                                const newSelection = selection.selectedCols.filter(
                                    (c) =>
                                        formatSelectColumnItem(c) !== formatSelectColumnItem(col)
                                )
                                setSelection((prev) => ({
                                    ...prev,
                                    selectedCols: newSelection
                                }));

                                return;
                            }

                            // (2) Repeat choose - ignore.
                            if (newValue === formatSelectColumnItem(col)) {
                                return;
                            }

                            // (3) Otherwise: find chosen.
                            const newCol = selection.availableCols.find(
                                (c) => formatSelectColumnItem(c) === newValue
                            );
                            if (!newCol) return;

                            // (4) Replace old with new.
                            const newSelection = selection.selectedCols.map((c) =>
                                formatSelectColumnItem(c) === formatSelectColumnItem(col)
                                    ? newCol
                                    : c
                            );
                            setSelection((prev) => ({
                                ...prev,
                                selectedCols: newSelection
                            }));
                        }}
                    >
                        <option value="">- unselect -</option>
                        {selection.availableCols.map((availableCol) => (
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
                {selection.selectedCols.length !== selection.availableCols.length &&
                    <select
                        value=""
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            const selectedCol = selection.availableCols.find(
                                (col) => formatSelectColumnItem(col) === selectedValue
                            );
                            if (selectedCol) {
                                const newCols = [...selection.selectedCols, selectedCol];
                                setSelection((prev) => ({
                                    ...prev,
                                    selectedCols: newCols,
                                    dbName: selectedCol.databaseName
                                }));
                            }
                        }}
                    >
                        <option value="">+ add column</option>
                        {getExclusiveAvailableCols(selection.availableCols, selection.selectedCols)
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
                        key={tableKey(selection.selectedTable)}
                        value={formatSelectTableItem(selection.selectedTable)}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            console.log("Try to select table...")
                            if (newValue === "") {
                                setSelection((prev) => ({
                                    ...prev,
                                    selectedTable: { databaseName: "", tableName: "" },
                                    selectedCols: [],
                                    dbName: ""
                                }));
                            }
                            const parsed = parseTableDisplayValue(newValue);
                            if (parsed) {
                                setSelection((prev) => ({
                                    ...prev,
                                    selectedTable: parsed,
                                    selectedCols: []
                                }));
                            }
                            return;
                        }}
                    >
                        <option value="">? select table</option>
                        {selection.selectedTable?.databaseName === "" ? selection.availableTables
                            // exclude already selected
                            .map((availableTable) => (
                                <option
                                    key={tableKey(availableTable)}
                                    value={formatSelectTableItem(availableTable)}
                                >
                                    {formatSelectTableItem(availableTable)}
                                </option>
                            )) : (<option
                                value={formatSelectTableItem(selection.selectedTable)}
                            >
                                {formatSelectTableItem(selection.selectedTable)}
                            </option>)}
                    </select>
                }
                {selection.selectedCols.length > 0 && (
                    <div className="sf-condition">
                        <span className="sf-keyword">WHERE</span>
                        <select
                            value={selection.selectedCondition.column ? formatSelectColumnItem(selection.selectedCondition.column) : ""}
                            onChange={(e) => {
                                console.log("try to set new column in condition.");
                                const val = e.target.value;
                                if (val === "") {
                                    // Reset condition.
                                    setSelection((prev) => ({
                                        ...prev,
                                        selectedCondition: { column: { columnName: "", databaseName: "", tableName: "" }, operator: "=", value: "" },
                                    }));
                                    return;
                                }

                                const currentColumns: GenColumn[] = getColumnsFromGenTable(selection.selectedTable);
                                console.log("Get current columns:", currentColumns);
                                console.log("Val:", val);
                                const newColumn: GenColumn | undefined = currentColumns.find((c) => {
                                    return formatSelectColumnItem(c) === val;
                                });
                                if (newColumn) {
                                    console.log("New condition: (update column)", newColumn);
                                    const newCondition: GenCondition = { ...selection.selectedCondition, column: newColumn }
                                    setSelection((prev) => ({
                                        ...prev,
                                        selectedCondition: newCondition
                                    }));
                                }
                                else {
                                    console.log("newColumns is undefined");
                                }
                            }}
                        >
                            <option value="">+ add column</option>
                            {getColumnsFromGenTable(selection.selectedTable)
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
                                value={selection.selectedCondition.operator}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const newOperator: SqlOperator = val as SqlOperator;

                                    const newCondition: GenCondition = { ...selection.selectedCondition, operator: newOperator }
                                    setSelection((prev) => ({
                                        ...prev,
                                        selectedCondition: newCondition
                                    }));
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
                            value={selection.selectedCondition.value}
                            onChange={(e) => {
                                const newCondition: GenCondition = { ...selection.selectedCondition, value: e.target.value }
                                setSelection((prev) => ({
                                    ...prev,
                                    selectedCondition: newCondition
                                }));
                            }}
                        />
                    </div>
                )}
            </div>
        </div >
    );
}