import api from './api';
import { Product } from '../types/product';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  products?: Product[];
  timestamp: string;
}

export interface AiChatResponse {
  reply: string;
  products: Product[];
  extractedConstraints: {
    minPrice: number | null;
    maxPrice: number | null;
    category: string | null;
    brand: string | null;
    qualities: string[];
  };
  suggestedFollowUps: string[];
}

export const sendAiShoppingMessageApi = async (
  message: string,
  history: Array<{ sender: string; text: string }> = []
): Promise<AiChatResponse> => {
  const res = await api.post('/api/products/ai-assistant/chat', {
    message,
    history,
  });
  return res.data?.data || res.data;
};
