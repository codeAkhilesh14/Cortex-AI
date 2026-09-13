import express from 'express';
import { createConversation, getConversations, updateConversation, saveMessage, getMessages } from '../controllers/chat.controller.js';

const chatRouter = express.Router();

chatRouter.get('/create-conversation', createConversation);
chatRouter.get('/get-conversations', getConversations);
chatRouter.post('/update-conversation', updateConversation);
chatRouter.post('/save-message', saveMessage);
chatRouter.get('/get-messages/:conversationId', getMessages);

export default chatRouter