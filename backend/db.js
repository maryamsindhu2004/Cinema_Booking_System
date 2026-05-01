// Check if running in Docker
const isDocker = process.env.DOCKER_ENV === 'true';

let sql;
try {
    sql = isDocker ? require('mssql') : require('mssql/msnodesqlv8');
} catch (err) {
    if (!isDocker) {
        console.warn("⚠️ msnodesqlv8 not installed, fallback to standard mssql.");
    }
    sql = require('mssql');
}

let config;

if (isDocker) {
    // Docker uses SQL Authentication
    config = {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
        server: process.env.DB_HOST || 'host.docker.internal',
        database: process.env.DB_NAME || 'TheatroDB',
        options: {
            encrypt: true,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };
    console.log('🐳 Running in Docker mode');
} else {
    // Local development - Windows Authentication
    config = {
        connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=TheatroDB;Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;'
    };
    console.log('💻 Running locally - Windows Authentication');
    console.log(`   Server: localhost`);
    console.log(`   User: ${process.env.USERNAME}`);
    console.log(`   Domain: ${process.env.COMPUTERNAME}`);
}

let pool = null;

async function getConnection() {
    try {
        if (!pool) {
            console.log('Connecting to database...');
            pool = await sql.connect(config);
            console.log('✅ Connected to TheatroDB successfully!');
        }
        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        if (error && typeof error === 'object') {
            for (const key in error) {
                if (Object.prototype.hasOwnProperty.call(error, key)) {
                    console.error(`  ${key}:`, error[key]);
                }
            }
        }
        throw error;
    }
}

async function testConnection() {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                DB_NAME() as DatabaseName,
                SUSER_NAME() as CurrentUser,
                @@SERVERNAME as ServerName,
                GETDATE() as CurrentTime
        `);
        console.log('\n📊 Connection Test Results:');
        console.log(`   Server: ${result.recordset[0].ServerName}`);
        console.log(`   Database: ${result.recordset[0].DatabaseName}`);
        console.log(`   User: ${result.recordset[0].CurrentUser}`);
        console.log(`   Time: ${result.recordset[0].CurrentTime}`);
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

module.exports = { 
    sql,
    getConnection, 
    testConnection 
};

