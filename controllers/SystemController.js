const Report = require("../models/Report")
const User = require("../models/User")

const mongoose = require("mongoose")

// Create a report
const createReport = async (req, res) => {
    const { reportedUserId, cause, message } = req.body
    const reqUser = req.user

    const reportedUserVerify = await User.findById(reportedUserId)

    if (!reportedUserVerify) {
        res.status(404).json({
            errors: ["O usuário reportado não existe."],
        })

        return
    }

    // Create a report
    const newReport = await Report.create({
        whistleblowerId: reqUser.id,
        reportedUserId,
        cause,
        message,
    })

    // If report was created successfully, return data
    if (!newReport) {
        res.status(422).json({
            errors: ["Ocorreu um erro, por favor tente mais tarde."],
        })

        return
    }

    res.status(201).json({ newReport, message: "Denuncia realizada com sucesso.", })
}

module.exports = {
    createReport,
}