const { getConnection } = require('./db');

(async () => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                t.name AS TableName,
                c.name AS ColumnName,
                ty.name AS DataType,
                c.max_length,
                c.is_nullable,
                c.is_identity,
                CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key,
                CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS is_foreign_key,
                ref_t.name AS referenced_table,
                ref_c.name AS referenced_column
            FROM sys.tables t
            JOIN sys.columns c ON t.object_id = c.object_id
            JOIN sys.types ty ON c.user_type_id = ty.user_type_id
            LEFT JOIN (
                SELECT ic.object_id, ic.column_id
                FROM sys.index_columns ic
                JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                WHERE i.is_primary_key = 1
            ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
            LEFT JOIN sys.foreign_key_columns fk ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id
            LEFT JOIN sys.tables ref_t ON fk.referenced_object_id = ref_t.object_id
            LEFT JOIN sys.columns ref_c ON fk.referenced_object_id = ref_c.object_id AND fk.referenced_column_id = ref_c.column_id
            ORDER BY t.name, c.column_id
        `);
        
        const tables = {};
        for (const row of result.recordset) {
            if (!tables[row.TableName]) tables[row.TableName] = [];
            tables[row.TableName].push(row);
        }
        
        for (const [table, cols] of Object.entries(tables)) {
            console.log(`\n=== ${table} ===`);
            for (const col of cols) {
                let info = `  ${col.ColumnName} (${col.DataType}${col.max_length > 0 ? `(${col.max_length})` : ''})`;
                if (col.is_primary_key) info += ' [PK]';
                if (col.is_identity) info += ' [IDENTITY]';
                if (col.is_foreign_key) info += ` [FK -> ${col.referenced_table}.${col.referenced_column}]`;
                if (!col.is_nullable) info += ' [NOT NULL]';
                console.log(info);
            }
        }
        process.exit();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
