// Check if running in Docker
const isDocker = process.env.DOCKER_ENV === 'true' || process.env.DB_HOST === 'database';

const sql = isDocker ? require('mssql') : require('mssql/msnodesqlv8');

let config;

if (isDocker) {
    // Docker uses SQL Authentication
    config = {
        user: 'sa',
        password: 'YourStrong!Passw0rd',
        server: 'database',
        database: 'TheatroDB',
        options: {
            encrypt: true,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };
    console.log('🐳 Running in Docker mode');
} else {
    // Local development - Windows Authentication
    // IMPORTANT: Use this exact format for Windows Auth
    config = {
        server: 'localhost',
        database: 'TheatroDB',
        driver: 'msnodesqlv8',  // Required for Windows Authentication
        options: {
            trustedConnection: true,  // This enables Windows Authentication
            encrypt: false,           // Set to false for local
            trustServerCertificate: true
        }
    };
    console.log('💻 Running locally - Windows Authentication');
    console.log(`   Server: ${config.server}`);
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
        console.error('❌ Database connection failed:', error.message);
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
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

module.exports = { 
    getConnection, 
    testConnection 
};

