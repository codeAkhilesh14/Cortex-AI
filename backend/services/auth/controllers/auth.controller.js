import { getAuth } from "firebase-admin/auth"
import { app } from "../config/firebase.js"
import User from "../models/user.model.js"
import redis from "../../../shared/redis/redis.js"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const CREDIT_COSTS = {
    chat: 1,
    search: 5,
    coding: 10,
    pdf: 10,
    ppt: 10,
    vision: 10
}

const sessionCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * SESSION_TTL_SECONDS
}

const csrfCookieOptions = {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * SESSION_TTL_SECONDS
}

const buildSessionPayload = (user) => JSON.stringify({
    userId: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    plan: user.plan,
    credits: user.credits,
    totalCredits: user.totalCredits,
    planExpiresAt: user.planExpiresAt
})

const refreshUserSessions = async (user) => {
    const sessionIds = await redis.smembers(`user-sessions-${user._id}`)
    const payload = buildSessionPayload(user)
    await Promise.all(sessionIds.map((sessionId) => redis.set(`session-${sessionId}`, payload, "EX", SESSION_TTL_SECONDS)))
}

export const login = async (req, res) => {
    try {
        const { token } = req.body
        const decoded = await getAuth(app).verifyIdToken(token)
        let user = await User.findOne({ firebaseUid: decoded.uid })
        if(!user) {
            user = await User.create({ firebaseUid: decoded.uid, name: decoded.name, email: decoded.email, avatar: decoded.picture })
        }
        const sessionId = crypto.randomUUID()
        const csrfToken = crypto.randomUUID()

        await redis.sadd(`user-sessions-${user?._id}`, sessionId)
        await redis.expire(`user-sessions-${user?._id}`, SESSION_TTL_SECONDS)

        await redis.set(`session-${sessionId}`, buildSessionPayload(user), "EX", SESSION_TTL_SECONDS)

        res.cookie("session", sessionId, sessionCookieOptions)
        res.cookie("csrf", csrfToken, csrfCookieOptions)
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while login" })
    }
}

export const logOut = async (req, res) => {
    try {
        const sessionId = req.cookies.session
        const user = sessionId ? JSON.parse(await redis.get(`session-${sessionId}`) || "null") : null
        await redis.del(`session-${sessionId}`)
        if (user?.userId) {
            await redis.srem(`user-sessions-${user.userId}`, sessionId)
        }
        res.clearCookie("session", sessionCookieOptions)
        res.clearCookie("csrf", csrfCookieOptions)
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

        await refreshUserSessions(user)

        return res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while Updating Payment" })
    }
}

export const checkCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body

        if(!userId || !CREDIT_COSTS[agent]) {
            return res.status(400).json({ message: "Invalid userId or agent" })
        }

        const user = await User.findById(userId)
        if(!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const requiredCredits = CREDIT_COSTS[agent]
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

        if(!userId || !CREDIT_COSTS[agent]) {
            return res.status(400).json({ message: "Invalid userId or agent" })
        }

        const requiredCredits = CREDIT_COSTS[agent]

        const user = await User.findOneAndUpdate(
            { _id: userId, credits: { $gte: requiredCredits } },
            { $inc: { credits: -requiredCredits } },
            { new: true }
        )

        if(!user) {
            const existingUser = await User.findById(userId)
            if(!existingUser) {
                return res.status(404).json({ message: "User Not Found" })
            }
            return res.status(400).json({
                success: false,
                message: "Insufficient Credits",
                requiredCredits,
                availableCredits: existingUser.credits
            })
        }

        await refreshUserSessions(user)

        return res.status(200).json({ success: true, credits: user.credits })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while Deducting Credits" })
    }
}
