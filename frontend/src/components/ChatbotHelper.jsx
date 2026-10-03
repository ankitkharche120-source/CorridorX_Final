import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const SYSTEM_PROMPT = `You are the CorridorX AI Assistant, an expert on the CorridorX platform. 
CorridorX is a dynamic emergency ambulance mobility platform. Key features include:
1. Real-time GPS tracking of ambulances.
2. Smart-EVP (Emergency Vehicle Preemption): Automatically turning traffic signals green for approaching ambulances to create a green corridor.
3. Clinical Golden Hour: Ensuring patients reach hospitals within 60 minutes.
4. Pilot Cockpit: The dashboard for ambulance drivers.
5. Consumer App: Where patients book ambulances.

CRITICAL INSTRUCTIONS:
- You must ONLY answer questions related to CorridorX, emergency mobility, ambulances, and the features listed above.
- If the user asks a question that is NOT about CorridorX or emergency healthcare, you must politely decline to answer and state that you are an AI assistant exclusively dedicated to the CorridorX platform.
- Do not write code, tell jokes, answer general knowledge questions, or perform tasks outside of explaining the CorridorX system.
Keep your answers very concise, helpful, and focused on CorridorX.`;

export const ChatbotHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! I am your CorridorX AI Assistant. How can I help you with emergency mobility today?", role: 'assistant' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { t } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    const userMessage = { id: Date.now(), sender: 'user', text: userText, role: 'user' };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Prepare message history for OpenRouter
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: userText }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'CorridorX'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: apiMessages,
          max_tokens: 150
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request right now.";
      
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText, role: 'assistant' }]);
    } catch (error) {
      console.error("OpenRouter Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Network error connecting to AI. Please try again.", role: 'assistant' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col h-[450px] animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-red-600 p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1.5 rounded-lg">
                <Bot className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-sm leading-tight">CorridorX AI</h3>
                <p className="text-red-200 text-[10px] font-medium tracking-wide uppercase">System Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-900/80 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.sender === 'user' ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4 text-slate-900" /> : <Bot className="w-4 h-4 text-slate-900" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-300'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-slate-900" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                  <span className="text-xs text-slate-600 font-medium">AI is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-300">
            <div className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about CorridorX..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-sm hover:shadow-sm transition-all hover:scale-110 flex items-center justify-center group"
        >
          <MessageSquare className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </button>
      )}
    </div>
  );
};


