
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




const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, type, date } = req.body;

        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid transaction ID"
            });
        }

        
        const allowedFields = [
            "description",
            "amount",
            "category",
            "type",
            "date"
        ];

        const providedFields = Object.keys(req.body);

        if (
            providedFields.length === 0 ||
            providedFields.some(field => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                message: "Provide valid transaction fields to update"
            });
        }

     
        if (
            description !== undefined &&
            (typeof description !== "string" || !description.trim())
        ) {
            return res.status(400).json({
                message: "Description cannot be empty"
            });
        }

       
        if (amount !== undefined) {
            if (
                amount === "" ||
                !Number.isFinite(Number(amount)) ||
                Number(amount) <= 0
            ) {
                return res.status(400).json({
                    message: "Amount must be a positive number"
                });
            }
        }

        
        if (
            category !== undefined &&
            (typeof category !== "string" || !category.trim())
        ) {
            return res.status(400).json({
                message: "Category cannot be empty"
            });
        }

       
        if (
            type !== undefined &&
            !["income", "expense"].includes(type)
        ) {
            return res.status(400).json({
                message: "Type must be income or expense"
            });
        }

        
        if (date !== undefined) {
            if (
                typeof date !== "string" ||
                !date.trim() ||
                !Number.isFinite(Date.parse(date))
            ) {
                return res.status(400).json({
                    message: "Please provide a valid date"
                });
            }
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

       
        if (description !== undefined) {
            transaction.description = description.trim();
        }

        if (amount !== undefined) {
            transaction.amount = Number(amount);
        }

        if (category !== undefined) {
            transaction.category = category.trim();
        }

        if (type !== undefined) {
            transaction.type = type;
        }

        if (date !== undefined) {
            transaction.date = date;
        }

        
        await transaction.save();

        return res.status(200).json({
            message: "Transaction updated successfully",
            transaction
        });
    } 
    
    catch (error) {
        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Invalid transaction data"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};



const deleteTransaction = async (req, res) => {
   
    try {
        const { id } = req.params;

    
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid transaction ID"
            });
        }

        
        const transaction = await Transaction.findOneAndDelete({
            _id: id,
            user: req.userId
        });

     
        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }


        return res.status(200).json({
            message: "Transaction deleted successfully"
        });
    }
    
    catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction

};
