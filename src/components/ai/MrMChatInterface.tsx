
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askMrM, ProjectQnaInput } from '@/ai/flows/project-qna-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'mrm';
  timestamp: Date;
}

export default function MrMChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add an initial greeting from Mr.M
    setMessages([
      {
        id: `mrm-greeting-${Date.now()}`,
        text: "Hello! I'm Mr.M. Feel free to ask me anything about Mytreyan's projects.",
        sender: 'mrm',
        timestamp: new Date(),
      }
    ]);
  }, []);


  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const question = inputValue.trim();
    if (!question || isLoading) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Prepare chat history for the AI flow
    const chatHistoryForAI = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    // Add the current user message to the history for the current call
    chatHistoryForAI.push({ role: 'user', parts: [{ text: question }] });


    try {
      const aiInput: ProjectQnaInput = {
        question: question,
        chatHistory: chatHistoryForAI.slice(0, -1) // Send history *before* current question
      };
      const result = await askMrM(aiInput);
      const aiResponse: Message = {
        id: `mrm-${Date.now()}`,
        text: result.answer,
        sender: 'mrm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling Mr.M AI flow:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'mrm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Chat Error',
        description: 'Could not get a response from Mr.M. ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[60vh] max-h-[700px] bg-background rounded-lg ">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end space-x-2 animate-fadeInUpScale',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender === 'mrm' && (
                <Bot className="h-7 w-7 text-primary flex-shrink-0 mb-1" />
              )}
              <div
                className={cn(
                  'p-3 rounded-xl max-w-[75%] shadow-md',
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none border border-border'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'user' && (
                <User className="h-7 w-7 text-muted-foreground flex-shrink-0 mb-1" />
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-end space-x-2 justify-start">
                <Bot className="h-7 w-7 text-primary flex-shrink-0 mb-1" />
                <div className="p-3 rounded-xl max-w-[75%] shadow-md bg-muted text-foreground rounded-bl-none border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-border flex items-center space-x-2 bg-muted/50 rounded-b-lg"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ask Mr.M a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow bg-background focus-visible:ring-primary/80"
          disabled={isLoading}
          autoFocus
        />
        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-primary hover:bg-primary/90">
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
