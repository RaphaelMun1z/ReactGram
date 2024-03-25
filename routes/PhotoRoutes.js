const express = require("express")
const router = express.Router()

// Controller
const {
    insertPhoto,
    deletePhoto,
    getAllPhotos,
    getAllFollowingUsersPhotos,
    getUserPhotos,
    getPhotoById,
    updatePhoto,
    likePhoto,
    commentPhoto,
    searchPhotos,
} = require("../controllers/PhotoController")

// Middlewares
const validate = require("../middlewares/handleValidation")
const { photoInsertValidation, photoUpdateValidation, commentValidation } = require("../middlewares/photoValidation")
const authGuard = require("../middlewares/authGuard")
const { imageUpload } = require("../middlewares/imageUpload")

// Routes
router.post("/", authGuard)//, imageUpload.single("image"), photoInsertValidation(), validate, insertPhoto
router.delete("/:id", authGuard, deletePhoto)
router.get("/", authGuard, getAllPhotos)
router.get("/following", authGuard, getAllFollowingUsersPhotos)
router.get("/user/:id", authGuard, getUserPhotos)
router.get("/search", authGuard, searchPhotos)
router.get("/:id", authGuard, getPhotoById)
router.put("/:id", authGuard, photoUpdateValidation(), validate, updatePhoto)
router.put("/like/:id", authGuard, likePhoto)
router.put("/comment/:id", authGuard, commentValidation(), validate, commentPhoto)

module.exports = router