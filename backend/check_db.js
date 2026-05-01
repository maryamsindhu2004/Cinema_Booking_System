const { getConnection } = require('./db');

(async () => {
    const pool = await getConnection();
    
    const r1 = await pool.request().query("SELECT name FROM sys.check_constraints WHERE name='chk_day'");
    console.log('chk_day constraint exists:', r1.recordset);
    
    const r2 = await pool.request().query("SELECT name FROM sysobjects WHERE name='DISCOUNT_APPLICABLE_DAYS'");
    console.log('DISCOUNT_APPLICABLE_DAYS table exists:', r2.recordset);

    const r3 = await pool.request().query("SELECT name FROM sysobjects WHERE name='DISCOUNT' AND xtype='U'");
    console.log('DISCOUNT table exists:', r3.recordset);

    if (r3.recordset.length > 0) {
        const r4 = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='DISCOUNT'");
        console.log('DISCOUNT columns:', r4.recordset);
    }

    process.exit();
})();
