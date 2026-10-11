import crypto from "crypto"
import redis from "../redis/redis.js"

const REPLAY_WINDOW_SECONDS = 5 * 60

export const signInternalRequest = (secret, body) => {
    const timestamp = Date.now().toString()
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${JSON.stringify(body)}`).digest("hex")
    return { timestamp, signature }
}

export const createInternalAuthMiddleware = (secret) => {
    return async (req, res, next) => {
        try {
            const timestamp = req.headers["x-internal-timestamp"]
            const signature = req.headers["x-internal-signature"]

            if (!timestamp || !signature) {
                return res.status(401).json({ message: "Unauthorized Internal Request" })
            }

            const age = Date.now() - Number(timestamp)
            if (!Number.isFinite(age) || age < 0 || age > REPLAY_WINDOW_SECONDS * 1000) {
                return res.status(401).json({ message: "Unauthorized Internal Request" })
            }

            const expectedSignature = crypto.createHmac("sha256", secret).update(`${timestamp}.${JSON.stringify(req.body)}`).digest("hex")

            const expectedBuffer = Buffer.from(expectedSignature)
            const actualBuffer = Buffer.from(signature)
            if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
                return res.status(401).json({ message: "Unauthorized Internal Request" })
            }

            const replayKey = `internal-request-${signature}`
            const firstSeen = await redis.set(replayKey, "1", "EX", REPLAY_WINDOW_SECONDS, "NX")
            if (!firstSeen) {
                return res.status(401).json({ message: "Unauthorized Internal Request" })
            }

            next()
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Internal Server Error while verifying internal request" })
        }
    }
}
