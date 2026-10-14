

const Transaction = require("../models/Transaction");

// Helper: get the start and end of a month
const getMonthRange = (month) => {
    if (!/^\d{4}-\d{2}$/.test(month)) {
        return null;
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);

    if (
        Number.isNaN(start.getTime()) ||
        start.toISOString().slice(0, 7) !== month
    ) {
        return null;
    }

    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    return { start, end };
};

// 1. Monthly summary
const getSummary = async (req, res) => {
    try {
        const month = req.query.month;

        if (!month) {
            return res.status(400).json({
                message: "Please provide month in YYYY-MM format"
            });
        }

        const range = getMonthRange(month);

        if (!range) {
            return res.status(400).json({
                message: "Invalid month. Use YYYY-MM format"
            });
        }

        const result = await Transaction.aggregate([
            {
                $match: {
                    user: new (require("mongoose").Types.ObjectId)(req.userId),
                    date: {
                        $gte: range.start,
                        $lt: range.end
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "income"] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    totalExpenses: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "expense"] },
                                "$amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const totalIncome = result[0]?.totalIncome || 0;
        const totalExpenses = result[0]?.totalExpenses || 0;

        return res.status(200).json({
            month,
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses
        });
    } catch (error) {
        console.error("Summary error:", error.message);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

// 2. Category-wise expense analytics
const getCategoryAnalytics = async (req, res) => {
    try {
        const month = req.query.month;

        if (!month) {
            return res.status(400).json({
                message: "Please provide month in YYYY-MM format"
            });
        }

        const range = getMonthRange(month);

        if (!range) {
            return res.status(400).json({
                message: "Invalid month. Use YYYY-MM format"
            });
        }

        const categories = await Transaction.aggregate([
            {
                $match: {
                    user: new (require("mongoose").Types.ObjectId)(req.userId),
                    type: "expense",
                    date: {
                        $gte: range.start,
                        $lt: range.end
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalSpent: { $sum: "$amount" }
                }
            },
            {
                $sort: { totalSpent: -1 }
            }
        ]);

        return res.status(200).json({
            month,
            categories
        });
    } catch (error) {
        console.error("Category analytics error:", error.message);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

// 3. Monthly income and expense trend (last 6 months)
const getMonthlyTrend = async (req, res) => {
    try {
        const now = new Date();

        const start = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 5,
            1
        ));

        const end = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            1
        ));

        const trend = await Transaction.aggregate([
            {
                $match: {
                    user: new (require("mongoose").Types.ObjectId)(req.userId),
                    date: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalIncome: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "income"] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    totalExpenses: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "expense"] },
                                "$amount",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        return res.status(200).json({ trend });
    } catch (error) {
        console.error("Monthly trend error:", error.message);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getSummary,
    getCategoryAnalytics,
    getMonthlyTrend
};
