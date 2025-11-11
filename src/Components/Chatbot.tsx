'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SendIcon, Loader2Icon, FileTextIcon, SparklesIcon } from 'lucide-react';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: { pageNumber?: number };
    source?: string;
  };
  id?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  document?: Doc[];
}

export default function Chatbot() {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleChatMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/chat?message=${encodeURIComponent(userMessage)}`);
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message,
          document: data?.docs,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                PDF Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by AI • Ask me anything
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl">
                  <FileTextIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <SparklesIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Welcome to PDF Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm">
                I've analyzed your document. Ask me anything about it and I'll provide detailed answers with sources.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-linear-to-r from-violet-600 to-fuchsia-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>

                {/* Source Documents */}
                {msg.document && msg.document.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                       Sources ({msg.document.length})
                    </p>
                    {msg.document.map((doc, i) => (
                      <div
                        key={doc.id || i}
                        className="bg-linear-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileTextIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                            Page {doc.metadata?.loc?.pageNumber || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {doc.pageContent?.substring(0, 150)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-linear-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">You</span>
                </div>
              )}
            </div>
          ))}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-9 h-9 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Loader2Icon className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg sticky bottom-0">
        <div className="px-4 py-4 max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyUp={handleKeyPress}
                placeholder="Ask anything about your document..."
                disabled={isLoading}
                className="pr-12 h-12 rounded-2xl border-gray-300 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500/20 shadow-sm"
              />
              {message && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  ⏎ Enter
                </span>
              )}
            </div>
            <Button
              onClick={handleChatMessage}
              disabled={!message.trim() || isLoading}
              className="h-12 w-12 rounded-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                <SendIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
