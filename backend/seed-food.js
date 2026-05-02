const getPool = require("./db");

async function seed() {
    try {
        const pool = await getPool();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM ConcessionItems WHERE item_name = 'Popcorn')
            INSERT INTO ConcessionItems (item_name, price) VALUES 
            ('Popcorn', 350), 
            ('Soda', 150), 
            ('Nachos', 450), 
            ('Coke', 200)
        `);
        console.log("Food items seeded successfully");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
