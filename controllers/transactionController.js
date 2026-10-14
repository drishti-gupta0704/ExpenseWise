
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");


const addTransaction = async (req, res) => {
    try {
        const {
            description,
            amount,
            category,
            type,
            date
        } = req.body;

        if (
            !description?.trim() ||
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !category?.trim() ||
            !type
        ) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Type must be income or expense"
            });
        }

        if (
            date !== undefined &&
            (typeof date !== "string" || date.trim() === "" ||
             !Number.isFinite(Date.parse(date)))
        ) {
            return res.status(400).json({
                message: "Please provide a valid date"
            });
        }

        const transaction = await Transaction.create({
            description,
            amount: Number(amount),
            category,
            type,
            ...(date !== undefined && { date }),
            user: req.userId
        });

        res.status(201).json({
            message: "Transaction added successfully",
            transaction
        });
    }
    
    catch (error) {
        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid transaction data"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.userId
        }).sort({ date: -1 });

        res.status(200).json({
            count: transactions.length,
            transactions
        });
    }
    
    catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
};


const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid transaction ID"
            });
        }

        const transaction = await Transaction.findOne({
            _id: id,
            user: req.userId
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.status(200).json({ transaction });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    addTransaction,
    getTransactions,
    getTransactionById
};
