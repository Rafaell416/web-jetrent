import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

export type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
};

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isUser ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-700'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
        </Avatar>
        
        <Card className={`p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.timestamp && (
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-neutral-500'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 