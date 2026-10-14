
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");


const app = express();
app.use(express.json());
connectDB();

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Expense Tracker API is running!"
    });
});

app.use("/api/auth", authRoutes);


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
