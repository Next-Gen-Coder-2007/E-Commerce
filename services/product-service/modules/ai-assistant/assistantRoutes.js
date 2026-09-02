import express from 'express';
import { handleAiShoppingChat } from './assistantController.js';

const router = express.Router();

router.post('/chat', handleAiShoppingChat);

export default router;
