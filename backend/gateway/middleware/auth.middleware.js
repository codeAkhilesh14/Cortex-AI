import redis from "../../shared/redis/redis.js"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export const verifyCsrf = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        return next()
    }
    const csrfCookie = req.cookies?.csrf
    const csrfHeader = req.headers["x-csrf-token"]
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({ message: "Invalid CSRF Token" })
    }
    next()
}

const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session
        if(!sessionId) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const sessionData = await redis.get(`session-${sessionId}`)
        if(!sessionData) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        req.user = JSON.parse(sessionData)
        return verifyCsrf(req, res, next)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while authentication" })
    }
}

export default protect
