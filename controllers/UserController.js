const User = require("../models/User")

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

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

// Sign user in
const login = async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    // Check if user exists
    if (!user) {
        res.status(404).json({ errors: ["Credenciais inválidas."] })
        return
    }

    // Check if password matches
    if (!(await bcrypt.compare(password, user.password))) {
        res.status(422).json({ errors: ["Credenciais inválidas."] })
        return
    }

    // Return user with Token
    res.status(201).json({
        _id: user._id,
        profileImage: user.profileImage,
        notifications: user.notifications,
        followSolicitation: user.followSolicitation,
        token: generateToken(user._id),
    })
}

// Get current logged in user
const getCurrentUser = async (req, res) => {
    const user = req.user

    res.status(200).json(user)
}

// Update an user
const update = async (req, res) => {
    const { name, password, bio } = req.body

    let profileImage = null

    if (req.file) {
        profileImage = req.file.filename
    }

    const reqUser = req.user
    const user = await User.findById(new mongoose.Types.ObjectId(reqUser._id)).select("-password")

    if (name) {
        user.name = name
    }

    if (password) {
        // Generate password hash
        const salt = await bcrypt.genSalt()
        const passwordHash = await bcrypt.hash(password, salt)

        user.password = passwordHash
    }

    if (profileImage) {
        user.profileImage = profileImage
    }

    if (bio) {
        user.bio = bio
    }

    await user.save()

    res.status(200).json(user)
}

// Get user by id
const getUserById = async (req, res) => {
    const { id } = req.params

    try {
        const user = await User.findById(new mongoose.Types.ObjectId(id)).select("-password")

        // Check if user exists
        if (!user) {
            res.status(404).json({ errors: ["Usuário não encontrado."] })
            return
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(404).json({ errors: ["Usuário não encontrado."] })
        return
    }
}

// Solicite Follow Result
const soliciteFollowResult = async (req, res) => {
    const { ...responseData } = req.body

    const reqUser = req.user

    const userSolicitedFollow = await User.findById(new mongoose.Types.ObjectId(responseData.userSolicitedId))

    // Check if user to follow exists
    if (!userSolicitedFollow) {
        res.status(404).json({ errors: ["Usuário não encontrado."] })
        return
    }

    // Check if the user already solicited follow to the auth user
    if (reqUser.followSolicitation.some(userAskToFollow => userAskToFollow.id !== responseData.userSolicitedId)) {
        res.status(402).json({ errors: ["Esse usuário não pediu para seguir."] });
        return;
    }

    // Check if the user already follow the auth user
    if (reqUser.followers.some(follower => follower.id === responseData.userSolicitedId)) {
        res.status(402).json({ errors: ["Esse usuário já é um seguidor."] });
        return;
    }

    if (responseData.statusUserResponse === true) {
        reqUser.followers.push({
            id: userSolicitedFollow._id,
            name: userSolicitedFollow.name,
        })

        userSolicitedFollow.following.push({
            id: reqUser.id,
            name: reqUser.name,
        })

        // Find the user index to unsolicite 
        const index = reqUser.followSolicitation.findIndex(obj => toString(obj.id) === toString(userSolicitedFollow._id));

        if (index !== -1) {
            reqUser.followSolicitation.splice(index, 1);
        } else {
            res.status(200).json({ authUser: reqUser, rejectedUser: userSolicitedFollow, message: "Houve um problema ao aceitar o pedido." })
            return
        }

        await reqUser.save()
        await userSolicitedFollow.save()

        res.status(200).json({ authUser: reqUser, rejectedUser: userSolicitedFollow, message: "Você aceitou o pedido para seguir." })
    } else {
        // Find the user index to unsolicite 
        const index = reqUser.followSolicitation.findIndex(obj => toString(obj.id) === toString(userSolicitedFollow._id));

        if (index !== -1) {
            reqUser.followSolicitation.splice(index, 1);

            await reqUser.save()

            res.status(200).json({ authUser: reqUser, rejectedUser: userSolicitedFollow, message: "Você rejeitou o pedido para seguir." })
        } else {
            res.status(404).json({ errors: ["Esse usuário não pediu para seguir."] });
            return;
        }
    }
}

// Follow somebody
const follow = async (req, res) => {
    const { followedUserId } = req.body

    const reqUser = req.user
    const userToFollow = await User.findById(new mongoose.Types.ObjectId(followedUserId))

    // Check if user to follow is not the auth user
    if (reqUser.id === followedUserId) {
        res.status(402).json({ errors: ["Você não pode se seguir."] })
        return
    }

    // Check if user to follow exists
    if (!userToFollow) {
        res.status(404).json({ errors: ["Usuário não encontrado."] })
        return
    }

    // Check if auth user already follow the user to follow
    if (reqUser.following.some(followedUser => followedUser.id === followedUserId)) {
        res.status(402).json({ errors: ["Você já segue esse usuário."] });
        return;
    }

    if (userToFollow.privateProfile === true) {
        userToFollow.followSolicitation.push({
            id: reqUser.id,
            name: reqUser.name,
        })
    } else {
        userToFollow.followers.push({
            id: reqUser.id,
            name: reqUser.name,
        })

        reqUser.following.push({
            id: followedUserId,
            name: userToFollow.name,
        })
    }

    await reqUser.save()
    await userToFollow.save()

    if (userToFollow.privateProfile === true) {
        res.status(200).json({ authUser: reqUser, followedUser: userToFollow, message: "Solicitação para seguir enviada com sucesso." })
    } else {
        res.status(200).json({ authUser: reqUser, followedUser: userToFollow, message: "Usuário seguido com sucesso." })
    }
}

// Unsolicite Follow
const unsoliciteFollow = async (req, res) => {
    const { followedUserId } = req.body

    const reqUser = req.user
    const userToUnsoliciteFollow = await User.findById(new mongoose.Types.ObjectId(followedUserId))

    // Check if user to unsolicite is not the auth user
    if (reqUser.id === followedUserId) {
        res.status(402).json({ errors: ["Você não pode se seguir."] })
        return
    }

    // Check if user to follow exists
    if (!userToUnsoliciteFollow) {
        res.status(404).json({ errors: ["Usuário não encontrado."] })
        return
    }

    // Check if auth user already follow the user to follow
    if (userToUnsoliciteFollow.followSolicitation.some(userAskToFollow => userAskToFollow.id !== reqUser.id)) {
        res.status(402).json({ errors: ["Você ainda não pediu para seguir esse usuário."] });
        return;
    }

    // Find the user index to unsolicite 
    const index = userToUnsoliciteFollow.followSolicitation.indexOf(reqUser.id);
    userToUnsoliciteFollow.followSolicitation.splice(index, 1);

    await reqUser.save()
    await userToUnsoliciteFollow.save()

    res.status(200).json({ authUser: reqUser, followedUser: userToUnsoliciteFollow, message: "Você retirou o pedido para seguir." })
}

// Unfollow somebody
const unfollow = async (req, res) => {
    const { unfollowedUserId } = req.body

    const reqUser = req.user
    const userToUnfollow = await User.findById(new mongoose.Types.ObjectId(unfollowedUserId))

    // Check if user to unfollow exists
    if (!userToUnfollow) {
        res.status(404).json({ errors: ["Usuário não encontrado."] })
        return
    }

    if (!reqUser.following.some(followedUser => followedUser.id === unfollowedUserId)) {
        res.status(402).json({ errors: ["Você não segue esse usuário."] });
        return;
    }

    // Find the user to unfollow index
    const index = reqUser.following.indexOf(unfollowedUserId);
    reqUser.following.splice(index, 1);

    const indexUserFollowers = userToUnfollow.followers.indexOf(reqUser.id);
    userToUnfollow.followers.splice(indexUserFollowers, 1);

    await reqUser.save()
    await userToUnfollow.save()

    res.status(200).json({ authUser: reqUser, unfollowedUser: userToUnfollow, message: "Você deixou de seguir com sucesso." })
}

// Get user by name
const getUserByName = async (req, res) => {
    const { username } = req.query

    const users = await User.find({ name: { $regex: username, $options: 'i' } }, { _id: 1, profileImage: 1, name: 1 }).limit(10).exec();

    res.status(200).json(users)
}

module.exports = {
    register,
    login,
    getCurrentUser,
    update,
    getUserById,
    soliciteFollowResult,
    follow,
    unsoliciteFollow,
    unfollow,
    getUserByName,
}