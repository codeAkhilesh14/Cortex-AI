import redis from "../../shared/redis/redis.js"

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
        next()
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while authentication" })
    }
}

export default protect