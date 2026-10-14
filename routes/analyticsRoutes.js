

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getSummary,
    getCategoryAnalytics,
    getMonthlyTrend
} = require("../controllers/analyticsController");

router.get("/summary", authMiddleware, getSummary);
router.get("/categories", authMiddleware, getCategoryAnalytics);
router.get("/monthly-trend", authMiddleware, getMonthlyTrend);

module.exports = router;
