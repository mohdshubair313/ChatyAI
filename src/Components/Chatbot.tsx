'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { SendIcon, Loader2Icon, FileTextIcon, UserIcon, BotIcon, PaperclipIcon, ArrowUpIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedShinyText } from './magicui/animated-shiny-text';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

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

const suggestions = [
  "Summarize this document",
  "What are the key points?",
  "Explain the main concepts",
  "Find specific information about..."
];

export default function Chatbot() {
  const { user, isSignedIn } = useUser();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false);

  const handleIconClick = () => {
    inputRef.current?.click()
  }

  // Load messages from local storage on mount
  useEffect(() => {
    if (user?.id) {
      const savedMessages = localStorage.getItem(`chat_messages_${user.id}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Failed to parse saved messages", e);
        }
      }
    } else {
      setMessages([]);
    }
  }, [user?.id]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      localStorage.setItem(`chat_messages_${user.id}`, JSON.stringify(messages));

      // Also update the chat list in Sidebar (via local storage event or shared key)
      // For simplicity, we just ensure the "Recent Chat" exists
      const chats = JSON.parse(localStorage.getItem(`chats_${user.id}`) || '[]');
      if (chats.length === 0) {
        const newChat = { id: 'default', title: 'Current Chat', date: new Date().toISOString() };
        localStorage.setItem(`chats_${user.id}`, JSON.stringify([newChat]));
        // Dispatch event to notify Sidebar
        window.dispatchEvent(new Event('storage'));
      }
    }
  }, [messages, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleChatMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    if (!isSignedIn || !user) {
      alert("Please sign in to chat.");
      return;
    }

    const userMessage = message;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/chat?message=${encodeURIComponent(userMessage)}&userId=${user.id}`);
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
  }, [message, isLoading, isSignedIn, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatMessage();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Only PDF
    if (file.type !== "application/pdf") {
      console.log("Only PDF allowed")
      alert("Only PDF allowed");
      e.target.value = "" // reset
      return
    }

    if (!isSignedIn || !user) {
      alert("Please sign in to upload files.");
      e.target.value = "";
      return;
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", user.id)

    try {
      setIsUploading(true)
      const response = await fetch("http://localhost:8080/uploads/pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("upload success", data)
        alert("File uploaded successfully!");
      } else {
        console.log("upload failed", data?.error)
        alert(`Upload failed: ${data?.error}`);
      }
    } catch (err) {
      console.log("error uploading file", err)
      alert("Error uploading file");
    } finally {
      setIsUploading(false)
      e.target.value = "" // same file dubara choose karne ke liye reset
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <BotIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              PDF Assistant
            </h1>
            <AnimatedShinyText className="text-sm text-gray-500 dark:text-gray-400">
              Ask anything about your documents
            </AnimatedShinyText>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 space-y-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-3xl flex items-center justify-center shadow-xl">
              <FileTextIcon className="w-12 h-12 text-violet-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PDF Chat Assistant</h2>
              <p>Upload your PDF and start asking questions about its content</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-sm text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex gap-4 md:gap-6 mx-auto mb-8",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg mt-1">
                  <BotIcon className="w-6 h-6 text-white" />
                </div>
              )}

              <div className={cn(
                "flex flex-col gap-3 max-w-[85%] md:max-w-[75%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                {/* Message Bubble */}
                <div className={cn(
                  "rounded-3xl px-6 py-4 shadow-xl text-base leading-relaxed",
                  msg.role === 'user'
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-xl"
                )}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Sources */}
                {msg.document && msg.document.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 w-full"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        Sources
                      </span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.document.map((doc, i) => (
                        <div
                          key={doc.id || i}
                          className="group bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 hover:border-violet-400 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-violet-500 rounded-full" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Page {doc.metadata?.loc?.pageNumber || 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {doc.pageContent}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-lg mt-1 border-2 border-gray-200 dark:border-gray-700">
                  <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 md:gap-6 mx-auto justify-start mb-8"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg">
              <Loader2Icon className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="flex items-center gap-1.5 h-10">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0s]" />
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 dark:to-transparent pt-8 pb-6 px-4 md:px-8 z-20 shadow-2xl">
        <div className="max-w-3xl mx-auto relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/20 transition-all duration-300">
          <div className="flex items-end p-4 gap-3">
            {/* Hidden input */}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-2xl h-12 w-12 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 shrink-0 shadow-md"
              onClick={handleIconClick}
              disabled={isUploading || isLoading}
            >
              <PaperclipIcon className="w-6 h-6" />
            </Button>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSignedIn ? "Message PDF Assistant..." : "Please sign in to chat..."}
              disabled={isLoading || !isSignedIn}
              rows={1}
              className="flex-1 max-h-[200px] py-4 bg-transparent border-0 focus:ring-0 resize-none text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
              style={{ minHeight: "52px" }}
            />

            <Button
              onClick={handleChatMessage}
              disabled={!message.trim() || isLoading || !isSignedIn}
              className={cn(
                "h-12 w-12 rounded-2xl shrink-0 transition-all duration-300 shadow-xl",
                message.trim() && isSignedIn
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-violet-500/25"
                  : "bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500"
              )}
            >
              {isLoading ? (
                <Loader2Icon className="w-6 h-6 animate-spin" />
              ) : (
                <ArrowUpIcon className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
