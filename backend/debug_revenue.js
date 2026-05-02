const { getConnection } = require('./db');

async function debug() {
    try {
        const pool = await getConnection();
        const res = await pool.request().query('SELECT bookingId, bookingStatus, bookingDate FROM Booking');
        console.log('Bookings Sample:', res.recordset.slice(0, 5));
        const statusCount = {};
        res.recordset.forEach(r => {
            statusCount[r.bookingStatus] = (statusCount[r.bookingStatus] || 0) + 1;
        });
        console.log('Status Counts:', statusCount);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debug();
