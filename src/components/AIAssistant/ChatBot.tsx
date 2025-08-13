import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader } from 'lucide-react';
import { geminiService } from '../../lib/gemini';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI study assistant. I can help you with exam preparation, explain concepts, and provide personalized study advice. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading || !profile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get user context for AI
      const userContext = {
        exam_type: profile.exam_type,
        ability_estimate: profile.ai_ability_estimate,
        weak_topics: profile.weak_topics,
        strong_topics: profile.strong_topics,
        total_questions: profile.total_questions_answered,
        accuracy: profile.total_questions_answered > 0 
          ? (profile.correct_answers / profile.total_questions_answered) * 100 
          : 0,
      };

      const aiResponse = await geminiService.chatAssistant(input.trim(), userContext);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Store interaction in database
      await supabase
        .from('ai_interactions')
        .insert([{
          user_id: profile.id,
          interaction_type: 'study_assistance',
          query_text: input.trim(),
          ai_response: aiResponse,
          context_data: userContext,
        }]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 h-96 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-gray-700/50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Study Assistant</h3>
            <p className="text-sm text-gray-400">Ask me anything about your studies</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-3 ${
              message.isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {!message.isUser && (
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
              message.isUser
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-gray-700 text-gray-100 rounded-bl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.isUser ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            {message.isUser && (
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        ))}
        
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-xl rounded-bl-sm">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-gray-300">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBot;