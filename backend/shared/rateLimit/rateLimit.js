import redis from "../redis/redis.js"

// This throttles abuse (login attempts, payment verification), not auth itself,
// so a Redis outage should not block legitimate logins/payments - fail open.
export const checkRateLimit = async (key, max, windowSeconds) => {
    try {
        const count = await redis.incr(key)
        if (count == 1) {
            await redis.expire(key, windowSeconds)
        }
        const ttl = await redis.ttl(key)
        return {
            allowed: count <= max,
            remaining: Math.max(max - count, 0),
            retryAfter: ttl
        }
    } catch (error) {
        console.log(error)
        return { allowed: true, remaining: max, retryAfter: 0 }
    }
}
