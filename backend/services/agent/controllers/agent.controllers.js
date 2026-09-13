import axios from 'axios'
import { graph } from '../graph/graph.js'
import { addMessage } from '../config/memory.js';
import redis from "../../../shared/redis/redis.js"

export const agent = async (req, res, next) => {
    try {
        const { prompt, conversationId, agent } = req.body;
        const file = req.file; // Access the uploaded file

        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" })
        }

        const creditCheck = await axios.post(`${process.env.AUTH_SERVICE}/check-credits`, { userId, agent })
        if (creditCheck?.data?.success === false) {
            return res.status(402).json({
                message: creditCheck.data.message || "Insufficient Credits",
                requiredCredits: creditCheck.data.requiredCredits,
                availableCredits: creditCheck.data.availableCredits
            })
        }

        // await redis.del(`messages-${conversationId}`);

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
            conversationId,
            role: "user",
            content: prompt
        })
        
        const result = await graph.invoke({
            prompt, conversationId, agent, userId, file
        })
        const aiResponse = typeof result?.aiResponse === "string" && result.aiResponse.trim()
            ? result.aiResponse
            : "Failed to generate response. Please try again."

        // adding user/ai message in redis
        await addMessage(conversationId, "user", prompt)
        await addMessage(conversationId, "assistant", aiResponse)
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
            conversationId,
            role: "assistant",
            content: aiResponse,
            images: result?.images,
            artifacts: result?.artifacts
        })
        return res.status(200).json({
            answer: aiResponse,
            images: result?.images,
            artifacts: result?.artifacts
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}
