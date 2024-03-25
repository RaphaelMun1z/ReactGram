const multer = require("multer")
const path = require("path")

// Destination to store image
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = ""

        if (req.baseUrl.includes("users")) {
            folder = "users"
        } else if (req.baseUrl.includes("photos")) {
            folder = "photos"
        }

        console.log("teste")

        try {
            cb(null, `https://react-gram-backend-3d6qw3l3y-raphael-munizs-projects.vercel.app/uploads/${folder}/`)
        } catch (error) {
            return cb(new Error("Erro interno!"))
        }

    },
    filename: (req, file, cb) => {
        try {
            cb(null, Date.now() + path.extname(file.originalname))
        } catch (error) {
            return cb(new Error("Erro interno!"))
        }
    }
})

const imageUpload = multer({
    storage: imageStorage,
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg)$/)) {
            // Upload only png and jpg formats
            return cb(new Error("Por favor, envie apenas png ou jpg!"))
        }

        try {
            cb(undefined, true)
        } catch (error) {
            return cb(new Error("Erro interno!"))
        }
    }
})

module.exports = { imageUpload }