import Redis from 'ioredis'

// create a new Redis instance
// commandTimeout ensures an outage fails requests fast (auth stays fail-closed)
// instead of hanging indefinitely while ioredis retries/queues commands.
const redis = new Redis(process.env.REDIS_URL, {
    commandTimeout: 3000
})

redis.on("connect", ()=>{
    console.log("Redis connected successfully")
})

export default redis