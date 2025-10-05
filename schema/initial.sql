-- =======================
-- DATABASES
-- =======================
CREATE TABLE databases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- =======================
-- TABLES
-- =======================
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    database_id INT NOT NULL REFERENCES databases(id),
    name VARCHAR(255) NOT NULL
);

-- =======================
-- COLUMNS
-- =======================
CREATE TABLE columns (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id),
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL
);

-- =======================
-- PRIMARY KEYS
-- =======================
CREATE TABLE primary_keys (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id)
);

CREATE TABLE primary_key_columns (
    pk_id INT NOT NULL REFERENCES primary_keys(id),
    column_id INT NOT NULL REFERENCES columns(id),
    ordinal_position INT NOT NULL,                  -- порядок колонки внутри PK
    PRIMARY KEY (pk_id, ordinal_position),
    UNIQUE (pk_id, column_id)                       -- запрет дубликатов
);

-- =======================
-- FOREIGN KEYS
-- =======================
CREATE TABLE foreign_keys (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id),            -- таблица-источник
    referenced_table_id INT NOT NULL REFERENCES tables(id)  -- таблица-цель
);

CREATE TABLE foreign_key_columns (
    fk_id INT NOT NULL REFERENCES foreign_keys(id),
    column_id INT NOT NULL REFERENCES columns(id),            -- колонка-источник
    referenced_column_id INT NOT NULL REFERENCES columns(id), -- колонка-цель
    ordinal_position INT NOT NULL,                            -- порядок в составе FK
    PRIMARY KEY (fk_id, ordinal_position),
    UNIQUE (fk_id, column_id, referenced_column_id)
);


-- =======================
-- CREDENTIALS
-- =======================
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    database_id INT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    host_ipv4 VARCHAR(255) NOT NULL,
    port INT NOT NULL CHECK (port > 0 AND port <= 65535),
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);