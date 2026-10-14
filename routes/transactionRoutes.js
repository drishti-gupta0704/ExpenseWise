
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { addTransaction, getTransactions, getTransactionById,  updateTransaction, deleteTransaction} = require("../controllers/transactionController");

router.post("/", authMiddleware, addTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/:id", authMiddleware, getTransactionById);


router.put("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

module.exports = router;
