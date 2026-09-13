import { Annotation } from "@langchain/langgraph"

export const agentState = Annotation.Root({
    prompt: Annotation(),
    aiResponse: Annotation(),
    agent: Annotation(), // which agent we used to generate the response
    conversationId: Annotation(),
    searchResults: Annotation(),
    images: Annotation(),
    artifacts: Annotation(),
    userId: Annotation(),
    file: Annotation()
})

