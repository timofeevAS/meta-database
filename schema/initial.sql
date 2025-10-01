CREATE TABLE databases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    database_id INT NOT NULL REFERENCES databases(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE columns (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id),
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL
);

CREATE TABLE primary_keys (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id)
);

CREATE TABLE primary_key_columns (
    pk_id INT NOT NULL REFERENCES primary_keys(id),
    column_id INT NOT NULL REFERENCES columns(id),
    PRIMARY KEY (pk_id, column_id)
);

CREATE TABLE foreign_keys (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id),
    referenced_table_id INT NOT NULL REFERENCES tables(id)
);

CREATE TABLE foreign_key_columns (
    fk_id INT NOT NULL REFERENCES foreign_keys(id),
    column_id INT NOT NULL REFERENCES columns(id),
    referenced_column_id INT NOT NULL REFERENCES columns(id),
    PRIMARY KEY (fk_id, column_id, referenced_column_id)
);
