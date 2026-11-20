import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, ShoppingBag, Heart, Bot, Check, ArrowRight } from 'lucide-react';
import { sendAiShoppingMessageApi, AiChatMessage } from '../../services/aiAssistantService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const AiShoppingAssistantDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "WELCOME TO NOVA COMMERCE. I AM YOUR AI SHOPPING ASSISTANT. ASK FOR PRODUCT RECOMMENDATIONS, SPECIFICATIONS, GIFT IDEAS, OR ORDER TRACKING.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedCartIds, setAddedCartIds] = useState<string[]>([]);

  const { addToCart } = useCart();
  const { addItem, isInWishlist } = useWishlist();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('toggle-ai-assistant', handleToggle);
    window.addEventListener('open-ai-assistant', handleOpen);
    window.addEventListener('open-ai-concierge', handleOpen);
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
      window.removeEventListener('open-ai-assistant', handleOpen);
      window.removeEventListener('open-ai-concierge', handleOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputText).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const response = await sendAiShoppingMessageApi(text);
      const assistantMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.reply || 'CATALOG VECTORS MATCHED. HERE ARE THE CURATED PRODUCTS:',
        products: response.products,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "TELEMETRY LATENCY DETECTED. PLEASE RETRY QUERY IN A MOMENT.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductToCart = async (p: any) => {
    await addToCart({
      productId: p._id,
      title: p.title,
      price: p.price,
      image: p.image,
      category: p.category,
      quantity: 1,
    });
    setAddedCartIds((prev) => [...prev, p._id]);
    setTimeout(() => {
      setAddedCartIds((prev) => prev.filter((id) => id !== p._id));
    }, 2500);
  };

  return (
    <>
      {/* Floating Brutalist Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] px-4 py-3 border-2 border-[#FFFFFF] shadow-2xl transition-all duration-300 flex items-center gap-2.5 font-satoshi font-bold text-xs uppercase tracking-widest cursor-pointer select-none group"
          title="Open AI Shopping Concierge"
        >
          <Sparkles className="w-4 h-4 text-[#FF89A9] group-hover:rotate-12 transition-transform" />
          <span>AI CONCIERGE</span>
          <span className="w-1.5 h-1.5 bg-[#DB4A2B] animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-satoshi text-[#1E1E1E] select-none animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-[#1E1E1E]/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <div className="w-screen max-w-md bg-[#E4E2DD] border-l-2 border-[#1E1E1E] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-5 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#FFFFFF]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#1E1E1E] text-[#FF89A9] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E] flex items-center gap-1.5">
                      <span>AI CONCIERGE</span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                    </h2>
                    <p className="text-[10px] font-mono text-[#444444] uppercase tracking-wider">
                      VECTOR SEMANTIC DISCOVERY
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#E4E2DD] transition-colors cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-4 py-2.5 bg-[#D9D6D0] border-b border-[#1E1E1E]/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[10px]">
                {[
                  'TECH FLAGSHIPS',
                  'AUTUMN WARDROBE',
                  'UNDER $100',
                  'PRICE DROP DEALS',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 bg-[#FFFFFF] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] text-[#1E1E1E] hover:text-[#DB4A2B] font-bold uppercase whitespace-nowrap transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E]'
                            : 'bg-[#FFFFFF] text-[#1E1E1E] border-2 border-[#1E1E1E]'
                        }`}
                      >
                        <p className={isUser ? 'font-medium' : 'font-mono text-[11px] leading-relaxed'}>
                          {m.text}
                        </p>

                        {/* Product Cards Recommended by AI */}
                        {m.products && m.products.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#1E1E1E]/15 space-y-2">
                            {m.products.map((p: any) => {
                              const isAdded = addedCartIds.includes(p._id);
                              return (
                                <div
                                  key={p._id}
                                  className="p-2 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 flex items-center justify-between gap-3 text-left"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={p.image}
                                      alt={p.title}
                                      className="w-10 h-12 object-contain bg-[#FFFFFF] border border-[#1E1E1E]/15 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-[#1E1E1E] uppercase truncate">
                                        {p.title}
                                      </div>
                                      <div className="font-mono text-[10px] text-[#444444]">
                                        ${p.price.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAddProductToCart(p)}
                                    className="px-2 py-1.5 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-[9px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer"
                                  >
                                    {isAdded ? (
                                      <span className="flex items-center gap-1 text-emerald-400">
                                        <Check className="w-3 h-3" />
                                        ADDED
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <ShoppingBag className="w-3 h-3" />
                                        ADD
                                      </span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] font-mono text-[#444444] px-1">
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-[#FFFFFF] border border-[#1E1E1E] text-xs font-mono max-w-[80%]">
                    <div className="w-3 h-3 border-2 border-[#1E1E1E] border-t-transparent animate-spin" />
                    <span>CONSULTING ARCHIVE VECTORS...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-4 bg-[#FFFFFF] border-t-2 border-[#1E1E1E]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="ASK CONCIERGE..."
                    className="flex-1 px-3 py-2.5 bg-[#E4E2DD]/30 border border-[#1E1E1E]/30 text-xs font-satoshi uppercase tracking-wider text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || loading}
                    className="px-4 py-2.5 bg-[#1E1E1E] hover:bg-[#DB4A2B] disabled:opacity-30 text-[#E4E2DD] transition cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiShoppingAssistantDrawer;
