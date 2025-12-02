
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Minimize2, Loader2, Sparkles } from 'lucide-react';
import { chatWithAgent } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface AgenticChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgenticChat: React.FC<AgenticChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hello! I am the AI Agent for KrishnaLense.AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert internal message format to Gemini API history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithAgent(history, userMsg.text);
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 md:right-8 w-[90vw] md:w-96 h-[500px] max-h-[70vh] bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[60] animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Help Agent</h3>
            <div className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
               <span className="text-[10px] text-blue-100 opacity-80">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about pricing, features..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
