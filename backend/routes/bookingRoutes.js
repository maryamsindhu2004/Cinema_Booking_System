const express = require("express");
const router = express.Router();
const sql = require("mssql");
const getPool = require("../db");

// =====================================================
// CREATE BOOKING (TRANSACTION SAFE)
// =====================================================
router.post("/create", async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        const {
            showId,
            seats,
            customer,
            foodItems
        } = req.body;

        // ==========================
        // 1. CREATE USER
        // ==========================
        const userResult = await request.query(`
            INSERT INTO Users (full_name, email, phone, user_role)
            OUTPUT INSERTED.user_id
            VALUES (
                '${customer.full_name}',
                '${customer.email}',
                '${customer.phone}',
                'Customer'
            )
        `);

        const userId = userResult.recordset[0].user_id;

        // ==========================
        // 2. CREATE BOOKING
        // ==========================
        const bookingResult = await request.query(`
            INSERT INTO Bookings (user_id, show_id)
            OUTPUT INSERTED.booking_id
            VALUES (${userId}, ${showId})
        `);

        const bookingId = bookingResult.recordset[0].booking_id;

        // ==========================
        // 3. SEAT CONFLICT CHECK
        // ==========================
        const conflictResult = await request.query(`
            SELECT bs.seat_id
            FROM BookingSeats bs
            JOIN Bookings b ON bs.booking_id = b.booking_id
            WHERE b.show_id = ${showId}
            AND bs.seat_id IN (${seats.join(",")})
        `);

        if (conflictResult.recordset.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "One or more seats already booked"
            });
        }

        // ==========================
        // 4. INSERT SEATS
        // ==========================
        for (let seatId of seats) {
            await request.query(`
                INSERT INTO BookingSeats (booking_id, seat_id)
                VALUES (${bookingId}, ${seatId})
            `);
        }

        // ==========================
        // 5. FOOD (OPTIONAL)
        // ==========================
        if (foodItems && foodItems.length > 0) {
            const foodResult = await request.query(`
                INSERT INTO FoodOrders (booking_id)
                OUTPUT INSERTED.food_order_id
                VALUES (${bookingId})
            `);

            const foodOrderId = foodResult.recordset[0].food_order_id;

            for (let item of foodItems) {
                await request.query(`
                    INSERT INTO FoodOrderItems (food_order_id, item_id, quantity)
                    VALUES (${foodOrderId}, ${item.id}, ${item.qty})
                `);
            }
        }

        await transaction.commit();

        res.json({
            success: true,
            booking_id: bookingId
        });

    } catch (err) {
        await transaction.rollback();
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Booking failed"
        });
    }
});


// =====================================================
// GET FULL RECEIPT (STEP 7)
// =====================================================
router.get("/:id/full", async (req, res) => {
    try {
        const pool = await getPool();
        const id = req.params.id;

        // BOOKING INFO
        const bookingResult = await pool.request().query(`
            SELECT 
                b.booking_id,
                b.booking_time,
                u.full_name,
                u.email,
                u.phone,
                m.title,
                m.genre,
                s.show_date,
                s.start_time
            FROM Bookings b
            JOIN Users u ON b.user_id = u.user_id
            JOIN Shows s ON b.show_id = s.show_id
            JOIN Movies m ON s.movie_id = m.movie_id
            WHERE b.booking_id = ${id}
        `);

        if (!bookingResult.recordset[0]) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingResult.recordset[0];

        // SEATS
        const seatsResult = await pool.request().query(`
            SELECT s.seat_no, s.row_no
            FROM BookingSeats bs
            JOIN Seats s ON bs.seat_id = s.seat_id
            WHERE bs.booking_id = ${id}
        `);

        // FOOD
        const foodResult = await pool.request().query(`
            SELECT ci.item_name, foi.quantity, ci.price
            FROM FoodOrders fo
            JOIN FoodOrderItems foi ON fo.food_order_id = foi.food_order_id
            JOIN ConcessionItems ci ON ci.item_id = foi.item_id
            WHERE fo.booking_id = ${id}
        `);

        // TOTAL
        const totalResult = await pool.request().query(`
            SELECT dbo.fn_TotalBookingAmount(${id}) AS total
        `);

        res.json({
            success: true,
            booking,
            seats: seatsResult.recordset,
            food: foodResult.recordset,
            total: totalResult.recordset[0].total
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Error fetching receipt"
        });
    }
});

module.exports = router;
