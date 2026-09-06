import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, ShoppingBag, Heart, Bot, Check } from 'lucide-react';
import { sendAiShoppingMessageApi, AiChatMessage } from '../../services/aiAssistantService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const AiShoppingAssistantDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! I'm your NovaCommerce AI Shopping Assistant. Tell me what you're looking for, your budget, or ask for recommendations!",
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
        text: response.reply || 'Here are the best matching items from our catalog:',
        products: response.products,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "I'm having a brief issue querying our catalog vectors. Please try again in a moment!",
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-zinc-950/20 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs cursor-pointer border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 group"
          title="Open AI Shopping Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span>AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-zinc-200 text-zinc-900 flex flex-col shadow-2xl">
          {/* Top Header */}
          <div className="p-4 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-zinc-950 text-sm">AI Shopping Assistant</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Natural language shopping assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
            {[
              'Laptop under $1,500',
              'Noise cancelling headphones',
              'Gifts under $50',
              'Flagship smartphones',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="px-3 py-1 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2.5`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-zinc-950 text-white rounded-tr-xs shadow-xs'
                          : 'bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>
                      <div
                        className={`text-[9px] mt-1.5 ${
                          isUser ? 'text-zinc-400' : 'text-zinc-400'
                        }`}
                      >
                        {m.timestamp}
                      </div>
                    </div>

                    {/* Grounded Recommended Product Cards */}
                    {m.products && m.products.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {m.products.map((p) => {
                          const inWish = isInWishlist(p._id);
                          const isAdded = addedCartIds.includes(p._id);

                          return (
                            <div
                              key={p._id}
                              className="p-3 bg-white border border-zinc-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-300 transition shadow-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80'}
                                  alt={p.title}
                                  className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shrink-0 border border-zinc-200"
                                />
                                <div className="min-w-0">
                                  <a
                                    href={`/product/${p._id}`}
                                    className="font-bold text-zinc-900 text-xs hover:text-indigo-600 transition line-clamp-1 block"
                                  >
                                    {p.title}
                                  </a>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono font-black text-zinc-950 text-xs">
                                      ${p.price.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      Rating {p.rating || 4.5}/5
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    addItem({
                                      productId: p._id,
                                      title: p.title,
                                      price: p.price,
                                      image: p.image,
                                      category: p.category,
                                    })
                                  }
                                  className="p-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-rose-600 border border-zinc-200 transition cursor-pointer"
                                  title="Add to Wishlist"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      inWish ? 'fill-rose-500 text-rose-500' : ''
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleAddProductToCart(p)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    isAdded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3 h-3" />
                                      <span>Add</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 max-w-xs">
                <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span>Searching catalog & analyzing options...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3.5 border-t border-zinc-200/80 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything (e.g. 4K monitor under $400)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition cursor-pointer"
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
