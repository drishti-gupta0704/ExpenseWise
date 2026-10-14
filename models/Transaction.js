
const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
      {
        description: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["income", "expense"],
            required: true
        },

        date: {
            type: Date,
            default: Date.now
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);
