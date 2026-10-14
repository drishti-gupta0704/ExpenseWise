
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { addTransaction, getTransactions, getTransactionById} = require("../controllers/transactionController");

router.post("/", authMiddleware, addTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/:id", authMiddleware, getTransactionById);

module.exports = router;
