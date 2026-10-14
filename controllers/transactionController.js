
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
        const {
            type,
            category,
            startDate,
            endDate,
            sortBy = "date",
            order = "desc"
        } = req.query;

        // Pagination
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1
        ) {
            return res.status(400).json({
                message: "Page and limit must be positive integers"
            });
        }

        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        // Validate filters
        if (type && !["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Type must be income or expense"
            });
        }

        if (!["date", "amount"].includes(sortBy)) {
            return res.status(400).json({
                message: "sortBy must be date or amount"
            });
        }

        if (!["asc", "desc"].includes(order)) {
            return res.status(400).json({
                message: "order must be asc or desc"
            });
        }

        // Build database filter
        const filter = { user: req.userId };

        if (type) filter.type = type;
        if (category) filter.category = category;

        const isValidDate = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }

            const date = new Date(value);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        if (startDate && !isValidDate(startDate)) {
            return res.status(400).json({
                message: "Invalid startDate. Use YYYY-MM-DD"
            });
        }

        if (endDate && !isValidDate(endDate)) {
            return res.status(400).json({
                message: "Invalid endDate. Use YYYY-MM-DD"
            });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                message: "startDate cannot be after endDate"
            });
        }

        if (startDate || endDate) {
            filter.date = {};

            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setUTCDate(end.getUTCDate() + 1);
                filter.date.$lt = end;
            }
        }

        // Sorting
        const direction = order === "asc" ? 1 : -1;
        const sortOptions = { [sortBy]: direction };

        if (sortBy === "date") {
            sortOptions._id = direction;
        }

        // Count matching transactions
        const total = await Transaction.countDocuments(filter);

        // Fetch the requested page
        const transactions = await Transaction.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(safeLimit);

        return res.status(200).json({
            count: transactions.length,
            total,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
            transactions
        });
    } catch (error) {
        console.error("Get transactions error:", error.message);

        return res.status(500).json({
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
