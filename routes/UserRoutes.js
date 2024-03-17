const express = require("express")
const router = express.Router()

// Controller
const {
    register,
    login,
    getCurrentUser,
    update,
    getUserById,
    follow,
    unfollow,
    getUserByName,
    unsoliciteFollow,
    soliciteFollowResult,
} = require("../controllers/UserController")

// Middlewares
const validate = require("../middlewares/handleValidation")
const {
    userCreateValidation,
    loginValidation,
    userUpdateValidation,
} = require("../middlewares/userValidations")
const { imageUpload } = require("../middlewares/imageUpload")
const authGuard = require("../middlewares/authGuard")

// Routes
router.post("/register", userCreateValidation(), validate, register)
router.post("/login", loginValidation(), validate, login)
router.get("/profile", authGuard, getCurrentUser)
router.get("/search", authGuard, getUserByName)
router.put("/", authGuard, userUpdateValidation(), validate, imageUpload.single("profileImage"), update)
router.get("/:id", getUserById)
router.put("/follow", authGuard, follow)
router.put("/followresponse", authGuard, soliciteFollowResult)
router.put("/unsolicitefollow", authGuard, unsoliciteFollow)
router.put("/unfollow", authGuard, unfollow)

module.exports = router