import { getModel } from "../config/llmModels.js"

export const router = async (state) => {

    // If agent is manually selected
    if (state.agent && state.agent !== "auto") {
        return {
            ...state,
            agent: state.agent
        }
    }

    // Check PDF file safely
    if (state.file?.mimetype === "application/pdf") {
        return {
            ...state,
            agent: "pdfRag"
        }
    }

    // Check image file safely
    if (state.file?.mimetype?.startsWith("image/")) {
        return {
            ...state,
            agent: "imageAnalyzer"
        }
    }

    // If no file, use LLM router
    const llm = await getModel("router")

    const prompt = `You are an agent router.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
General conversation,
explanations,
learning,
questions.

search:
Current events,
latest information,
news,
recent developments,
internet lookup.

coding:
Generate code,
debug code,
build projects,
architecture,
API design.

pdf:
Questions about generating PDFs
or document context.

ppt:
Questions about generating PPTs
or presentation context.

vision:
Generate image,
create image.

Return ONLY one word:

chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`

    const response = await llm.invoke(prompt)

    return {
        ...state,
        agent: response.content.trim().toLowerCase()
    }
}