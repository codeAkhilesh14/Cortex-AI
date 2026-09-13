import fs from "fs"
import { promises as fsPromises } from "fs"
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { vectorStore } from "../config/vectorDb.js"
import { getModel } from "../config/llmModels.js"
import { deductCredits } from "../utils/deductCredits.js"
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { checkAgentLimit } from "../config/agentLimit.js"

export const pdfRag = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        console.log("hi");
        const buffer = fs.readFileSync(state.file.path) // PDF file ko uske path se read karke memory mein buffer ke form mein store kar rahe hain.
        const pdf = new PDFParse({ data: buffer }) // PDF buffer ko PDF parser ke paas bhej rahe hain taaki PDF ka content extract kar sake.
        const result = await pdf.getText() // PDF ke andar jo bhi text likha hai, usko nikal rahe hain.
        const text = result.text // PDF se nikala hua actual text text variable mein store ho raha hai.

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        })
        const docs = await splitter.createDocuments([text]) // createDocuments() us text ko chunks mein todkar LangChain Document objects banata hai. Document 1 → 1000 characters, Document 2 → next 1000 characters
        const collectionName = `pdf-${Date.now()}` // Har new PDF ke liye alag collection name ban sakta hai.

        const store = await vectorStore(docs, collectionName) // vectorStore() function documents ko embeddings mein convert karke Qdrant mein store kar sakta hai.

        const relevantDocs = await store.similaritySearch(state.prompt, 5)

        const context = relevantDocs.map(d => d.pageContent).join("\n\n")

        const llm = await getModel("pdf-rag")

        const messages = [
            new SystemMessage(`
                You are CortexAI PDF Assistant.

                Rules:

                - Answer ONLY from the uploaded PDF.
                - Never make up information.
                - If the answer is not present in the PDF, reply:

                "I couldn't find this information in the uploaded PDF."

                - Use Markdown formatting.
            `),

            new HumanMessage(`
                Context:
                ${context}

                Question:
                ${state.prompt}
            `)
        ];

        const response = await llm.invoke(messages)

        await deductCredits(state.userId, "pdf")

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.data?.message || "Failed to Analyze PDF"
        }
    } finally {
        if (state.file?.path) {
            await fsPromises.unlink(state.file.path).catch(() => {})
        }
    }
}
