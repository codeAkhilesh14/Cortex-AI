import Conversation from '../models/conversation.model.js';
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const conversation = await Conversation.create({ userId: userId });
        return res.status(200).json(conversation);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error while creating conversation" });
    }
}    

export const getConversations = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const conversations = await Conversation.find({ userId: userId }).sort({ updatedAt: -1 });
        return res.status(200).json(conversations);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error while finding conversation" });
    }
}

export const updateConversation = async (req, res) => {
    try {
        const { id, title } = req.body
        if (!id || !title) {
            return res.status(400).json({ error: "id and title are required" });
        }
        const conversation = await Conversation.findByIdAndUpdate(id, { title })
        return res.status(200).json(conversation);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error while updating conversation" });
    }
} 

export const saveMessage = async (req, res) => {
    try {
        const { conversationId, role, content, images, artifacts } = req.body;
        // if (!conversationId || !role || !content) {
        //     return res.status(400).json({ error: "conversationId, role, and content are required" });
        // }
        const message = await Message.create({ conversationId, role, content, images, artifacts });
        return res.status(200).json(message);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error while saving message" });
    }
}

export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId });
        return res.status(200).json(messages);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error while fetching messages" });
    }
}