const User = require("../models/User")

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const jwtSecret = process.env.JWT_SECRET

// Generate user Token
const generateToken = (id) => {
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: "7d",
    })
}

// Register user and sign in
const register = async (req, res) => {
    const { name, email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
 
    if (user) {
        res.status(422).json({ errors: ["Este e-mail já está sendo utilizado."] })
        return
    }

    // Generate password hash
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const newUser = await User.create({
        name,
        email,
        password: passwordHash
    })

    // If user was created succesfully, return the Token
    if (!newUser) {
        res.status(422).json({ errors: ["Ocorreu um erro, por favor tente mais tarde."] })
        return
    }

    res.status(201).json({
        _id: newUser._id,
        token: generateToken(newUser._id),
    })
} 

module.exports = {
    register,
}