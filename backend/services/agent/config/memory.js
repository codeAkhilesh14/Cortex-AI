import redis from "../../../shared/redis/redis.js"
import { getMessages } from "../utils/getMessages.js"

export const getMemory = async (conversationId) => {
    const key = `messages-${conversationId}`
    const cached = await redis.get(key)
    if(cached) {
        return JSON.parse(cached).filter(msg => typeof msg.content === "string" && msg.content.trim())
    }
    const messages = await getMessages(conversationId) || []
    const validMessages = messages.filter(msg => typeof msg.content === "string" && msg.content.trim())
    await redis.set(key, JSON.stringify(validMessages), "EX", 24*60*60) // for 1 day stored in Redis
    return validMessages
}

// below function push the current asked question/answer
// only last 20 messages will be stored in redis if new comes we remove last and push new one

export const addMessage = async (conversationId, role, content) => {
    if (typeof content !== "string" || !content.trim()) return;
    const key = `messages-${conversationId}`
    const rawMessages = await redis.get(key)
    const messages = rawMessages ? JSON.parse(rawMessages) : []
    messages.push({ role, content })
    if(messages.length>20) {
        messages.shift()
    }
    await redis.set(key, JSON.stringify(messages))
}
