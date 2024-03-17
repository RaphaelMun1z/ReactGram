const mongoose = require("mongoose")
const { Schema } = mongoose

const userSchema = new Schema(
    {
        name: String,
        email: String,
        password: String,
        profileImage: String,
        bio: String,
        privateProfile: { type: Boolean, default: true },
        followSolicitation: Array,
        following: Array,
        followers: Array,
    },
    {
        timestamps: true
    }
)

const User = mongoose.model("User", userSchema)

module.exports = User