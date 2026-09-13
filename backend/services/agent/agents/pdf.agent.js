import { getModel } from "../config/llmModels.js"
import { generatePdf } from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        const llm = await getModel("pdf")
        const prompt = `
            You are an expert document writer.

            Return ONLY valid JSON.

            Do NOT return markdown.

            Do NOT return explanations.

            Structure:

            {
            "title":"",
            "subtitle":"",
            "sections":[
                {
                "heading":"",
                "points":[]
                }
            ]
            }
            Requirements:
            - Generate an engaging title.
            - Generate a short subtitle (1 sentence).
            - Create between 10 and 12 sections.
            - Each section must contain 3 to 6 bullet points.
            - Bullet points should:
                - be concise
                - contain useful information
                - avoid repetition
                - be grammatically correct
                - be between 8 and 20 words
            - Organize sections in a logical order.
            - Use headings that clearly describe each section.
            - Do not leave any field empty.

            Each section should have 3-6 concise bullet points.

            Topic:

            ${state.prompt}
        `; 
        const res = await llm.invoke(prompt)
        const data = JSON.parse(res.content)
        await deductCredits(state.userId, "pdf")
        const pdfBuffer = await generatePdf(data)

        const fileName = `pdf-${Date.now()}.pdf`
        await uploadToS3(fileName, pdfBuffer, "application/pdf")

        const downloadUrl = await getFromS3(fileName, 24*60) // expires after 1 day in minutes

        return {
            ...state,
            aiResponse: `# PDF Generated
            
**${data.title}**

📥 [Download PDF](${downloadUrl})
 
_Link expires in 10 minutes._ `
        }
    } catch (error) {
        console.error(error);
        return {
            ...state,
                aiResponse: error?.data?.message || "❌ Failed to Generate PDF ( Please, Try again later )"
        } 
    }
}