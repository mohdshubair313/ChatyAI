'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number
    }
  }
  source?: string
}

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  document?: Doc[];
}

export default function Chatbot() {
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([]);

  const handleChatMessage = async () => {
    setMessages((prev) => [...prev, {role: 'user', content: message}])
    const res = await fetch(`http://localhost:8080/chat?message=${message}`)
    const data = await res.json()
    console.log(data)
    setMessages(prev => [...prev, {role: 'assistant', content: data?.message, document: data?.docs}])
  }

  return (
    <div className='p-4'>
      <div>
        {messages.map((message, index)=> <pre key={index}>{JSON.stringify(message, null, 2)}</pre>)}
      </div>
      <div className='fixed bottom-4 w-100 flex gap-3'>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder='Whats in your mind related to your document' />
        <Button onClick={handleChatMessage} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
