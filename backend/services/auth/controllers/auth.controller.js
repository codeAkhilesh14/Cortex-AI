import { getAuth } from "firebase-admin/auth"
import { app } from "../config/firebase.js"
import User from "../models/user.model.js"
import redis from "../../../shared/redis/redis.js"

export const login = async (req, res) => {
    try {
        const { token } = req.body
        const decoded = await getAuth(app).verifyIdToken(token)
        let user = await User.findOne({ firebaseUid: decoded.uid })
        if(!user) {
            user = await User.create({ firebaseUid: decoded.uid, name: decoded.name, email: decoded.email, avatar: decoded.picture })
        }
        const sessionId = crypto.randomUUID()

        await redis.set(`user-session-${user?._id}`, sessionId, "EX", 60 * 60 * 24 * 7)

        await redis.set(`session-${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt 
        }), "EX", 60 * 60 * 24 * 7)

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 7 
        })
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while login" })
    }
}

export const logOut = async (req, res) => {
    try {
        const sessionId = req.cookies.session
        await redis.del(`session-${sessionId}`)
        res.clearCookie("session")
        return res.status(200).json({ message: "Logout Successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while logout" })
    }
}

export const updateUserPayment = async (req, res) => {
    try {
        const { plan, credits, userId } = req.body

        const user = await User.findById(userId)
        if(!user) {
            return res.status(404).json({ message: "User Not Found" })
        }
        user.plan = plan
        user.credits += credits
        user.totalCredits += credits
        user.planExpiresAt = new Date(Date.now() + 30*24*60*60*1000)

        await user.save()

        const sessionId = await redis.get(`user-session-${user?._id}`)
        await redis.set(`session-${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 60 * 60 * 24 * 7)

        return res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while Updating Payment" })
    }
}

export const checkCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body
        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            vision: 10
        }

        const user = await User.findById(userId)
        if(!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const requiredCredits = COST[agent] || 1
        const hasEnoughCredits = user.credits >= requiredCredits

        return res.status(200).json({
            success: hasEnoughCredits,
            message: hasEnoughCredits ? "Credits available" : "Insufficient Credits",
            requiredCredits,
            availableCredits: user.credits
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while checking credits" })
    }
}

export const deductCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body
        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            vision: 10
        };
        const user = await User.findById(userId)
        if(!user) {
            return res.status(404).json({ message: "User Not Found" })
        }
        const requiredCredits = COST[agent] || 1
        if(user.credits < requiredCredits) {
            return res.status(400).json({
                success: false,
                message: "Insufficient Credits",
                requiredCredits,
                availableCredits: user.credits
            })
        }
        user.credits -= requiredCredits
        await user.save()

        const sessionId = await redis.get(`user-session-${user?._id}`)
        await redis.set(`session-${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 60 * 60 * 24 * 7)

        return res.status(200).json({ success: true, credits: user.credits })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while Deducting Credits" })
    }
}