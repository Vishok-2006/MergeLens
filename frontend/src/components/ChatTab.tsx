import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Bot, 
  User, 
  Loader2 
} from 'lucide-react';
import { EngineeringReport, ChatMessage } from '../types';

interface ChatTabProps {
  report: EngineeringReport;
  analysisId: string;
}

export default function ChatTab({ report, analysisId }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: `Hello! I have completed a thorough analysis of **${report.metadata.owner}/${report.metadata.name}**. I am fully primed with the codebase context. Ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What are the main security risks?",
    "How can I refactor the folder structure?",
    "Summarize code quality issues",
    "Explain the performance bottleneck"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          history: [...messages, userMsg]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to query assistant.');
      }

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data?.response) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: resJson.data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(resJson.message || 'Malformed backend response.');
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "I encountered an error querying the intelligence engine. Please check your network connection or try resetting the page.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[560px]">
      
      {/* Left side: Assistant details / suggested prompts */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <Bot className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">MergeLens Copilot</h3>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            This AI chat assistant is contextualized with the full indexed details of <strong>{report.metadata.name}</strong>, allowing you to debug files, draft tests, and discuss refactoring strategies instantly.
          </p>
        </div>

        {/* Suggested Prompt list */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Suggested Questions</h4>
          
          <div className="space-y-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] font-semibold text-gray-600 rounded-lg border border-gray-100 hover:border-indigo-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Active Chat terminal container */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-full">
        
        {/* Chat window scroll body */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50/50">
          {messages.map((msg, idx) => {
            const isBot = msg.sender === 'assistant';
            
            return (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-2xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`p-2 rounded-full w-9 h-9 flex items-center justify-center shrink-0 border shadow-sm ${
                  isBot ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Msg content bubble */}
                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed border shadow-sm space-y-1 ${
                  isBot 
                    ? 'bg-white border-gray-100 text-gray-800 rounded-tl-none' 
                    : 'bg-indigo-600 border-indigo-600 text-white rounded-tr-none'
                }`}>
                  <div className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</div>
                  <div className={`text-[9px] text-right mt-1.5 font-semibold ${isBot ? 'text-gray-400' : 'text-indigo-200'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing state loading node */}
          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-2xl">
              <div className="p-2 rounded-full w-9 h-9 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-tl-none text-xs font-semibold flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Generating repository context response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box footer */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-4 border-t border-gray-100 flex gap-2 bg-white"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask questions about the repository (e.g. 'explain file patterns'...)"
            className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium placeholder-gray-400 text-gray-900 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
