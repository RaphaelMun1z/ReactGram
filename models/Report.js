const mongoose = require("mongoose")
const { Schema } = mongoose

const reportSchema = new Schema(
    {
        whistleblowerId: mongoose.ObjectId,
        reportedUserId: mongoose.ObjectId,
        cause: String,
        message: String,
    },
    {
        timestamps: true
    }
)

const Report = mongoose.model("Report", reportSchema)

module.exports = Report