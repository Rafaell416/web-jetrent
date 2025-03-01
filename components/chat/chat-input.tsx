import React, { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          className="flex-1 resize-none min-h-24"
          placeholder="Ask about apartments... (e.g., I need a 2-bedroom in Brooklyn for under $2500)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !message.trim()}
          className="h-12"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </Button>
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </form>
  );
} 