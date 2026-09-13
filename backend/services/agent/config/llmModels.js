import dotenv from "dotenv"
dotenv.config();
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";


const groq = new ChatGroq({
    model: "openai/gpt-oss-20b",
    // model: "llama-3.1-8b-instant",
    apiKey: process.env.GROQ_API_KEY
})

const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY
})

const openrouter = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 2500
});

export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq;
        case "search":
            return groq;
        case "coding":
            return openrouter;
        case "imageAnalyzer":
            return gemini;    
        default:
            return groq;
    }
}