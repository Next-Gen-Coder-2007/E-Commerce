import AiAssistantEngine from './assistantEngine.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

/**
 * @desc Process conversational AI Shopping Concierge query
 * @route POST /api/products/ai-assistant/chat
 * @access Public
 */
export const handleAiShoppingChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, {
        statusCode: 400,
        code: 'MESSAGE_REQUIRED',
        message: 'A message string is required',
      });
    }

    const result = await AiAssistantEngine.processChat(message.trim(), history);

    return sendSuccess(res, {
      statusCode: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
