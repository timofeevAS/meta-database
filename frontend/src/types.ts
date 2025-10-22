export interface TableInfo {
  tableName: string;
  columns: string[];
}

export interface DatabaseMetadataInfo {
  databaseName: string;
  tables: TableInfo[];
}

export interface SelectFactoryProps {
  metadata: DatabaseMetadataInfo[];
}

export const sampleMetaDataMock1: DatabaseMetadataInfo = {
  databaseName: "app1",
  tables: [
    { tableName: "users", columns: ["id", "email", "created_at"] },
    { tableName: "orders", columns: ["order_id", "user_id", "amount"] }
  ]
};

export const sampleMetaDataMock2: DatabaseMetadataInfo = {
  databaseName: "app2",
  tables: [
    { tableName: "managers", columns: ["id", "debit_card", "created_at"] },
    { tableName: "markets", columns: ["market_id", "manager_id", "status"] }
  ]
};

export const databasesMetaDataMocks: DatabaseMetadataInfo[] = [
  sampleMetaDataMock1,
  sampleMetaDataMock2,
];

export const selectFactoryPropsMock = {
  metadata: databasesMetaDataMocks,
} satisfies SelectFactoryProps;