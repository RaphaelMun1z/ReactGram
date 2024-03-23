const express = require("express")
const router = express.Router()

// Controller
const {
    createReport
} = require("../controllers/SystemController")


// Middlewares
const authGuard = require("../middlewares/authGuard")

// Routes
router.post("/report", authGuard, createReport)

module.exports = router