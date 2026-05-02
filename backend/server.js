const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");

const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const seatRoutes = require("./routes/seatRoutes");

// ======================
// CREATE APP FIRST
// ======================
const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// DB CONNECTION
// ======================
connectDB();

// ======================
// ROUTES
// ======================
app.use("/movies", movieRoutes);
app.use("/booking", bookingRoutes);
app.use("/seats", seatRoutes);
const foodRoutes = require("./routes/foodRoutes");
app.use("/food", foodRoutes);
app.use("/booking", bookingRoutes);
app.use(express.json());

// ======================
// TEST ROUTE
// ======================
app.get("/", (req, res) => {
    res.send("Cinema API Running");
});

// ======================
// START SERVER
// ======================
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
