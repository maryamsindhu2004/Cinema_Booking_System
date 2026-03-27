const { testConnection } = require('./db');


async function runTest() {
    console.log('Testing database connection...\n');
    
    try {
        const connected = await testConnection();
        
        if (connected) {
            console.log('\n✅ Database is ready to use!');
        } else {
            console.log('\n❌ Database connection failed');
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
    
    process.exit(0);
}

runTest();