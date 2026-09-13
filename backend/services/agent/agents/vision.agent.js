import { getModel } from "../config/llmModels.js"
import axios from "axios"
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js";

export const visionAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "image")
        const llm = await getModel("image")
        const res = await llm.invoke(`
            You are an elite AI image prompt engineer.

            Convert the user request into a highly detailed image generation prompt.

            Requirements:

            - Cinematic lighting
            - Professional composition
            - Ultra realistic
            - High detail
            - Beautiful color palette
            - Sharp focus
            - 8K quality
            - Photorealistic
            - Depth of field
            - Professional photography
            - Stunning visuals

            Return only the image prompt.

            User Request: ${state.prompt}
        `);

        const prompt = res.content.trim()

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`

        const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" }) // we want arraybuffer bcoz we have to send buffer in S3
        
        await deductCredits(state.userId, "vision")

        const buffer = Buffer.from(imageRes.data) // convert array buffer into buffer

        // Detect content type returned by Pollinations
        const contentType = imageRes.headers["content-type"] || "image/jpeg";

        const extension = contentType === "image/png" ? "png" : "jpg";

        const fileName = `image-${Date.now()}.${extension}`;

        await uploadToS3(fileName, buffer, "image/jpeg")

        const downloadUrl = await getFromS3(fileName, 24*60) // url valid for 1 day (in minutes)

        return {
    ...state,
    aiResponse: `![Generated Image](${downloadUrl})

📥 [Download Image](${downloadUrl})

⏳ Link expires in 10 minutes.`
}
    } catch (error) {
        console.error(error);
        return {
            ...state,
            aiResponse: error?.data?.message || "❌ Failed to Generate Image ( Please, Try again later )"
        } 
    }
}