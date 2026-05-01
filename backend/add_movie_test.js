const { getConnection } = require('./db');

async function addMovie() {
    try {
        const pool = await getConnection();

        console.log('Inserting new movie...');
        const result = await pool.request().query("INSERT INTO Movie (title, duration, genre, releaseDate, rating, language) VALUES ('London Nahi Jaunga', 140, 'Romance', '2022-07-10', 'PG', 'Urdu')");

        console.log('✅ Movie inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to insert movie:', error.message);
        process.exit(1);
    }
}

addMovie();
