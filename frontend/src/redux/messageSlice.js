import { createSlice } from '@reduxjs/toolkit';

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],
        artifacts: [],
        loadingByConversation: {}
    },
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload)
        },
        setArtifacts: (state, action) => {
            state.artifacts = action.payload
        },
        setConversationLoading: (state, action) => {
            const { conversationId, loading } = action.payload
            if (!conversationId) return

            if (loading) {
                state.loadingByConversation[conversationId] = true
            } else {
                delete state.loadingByConversation[conversationId]
            }
        }
    }
})

export const { setMessages, addMessage, setArtifacts, setConversationLoading } = messageSlice.actions;
export default messageSlice.reducer;
