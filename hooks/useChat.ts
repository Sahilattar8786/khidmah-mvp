import { useEffect, useState } from 'react';
import { chatService, Message } from '@/services/chatService';

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (senderId: string, text: string) => {
    if (!chatId || !text.trim()) return;
    try {
      await chatService.sendMessage(chatId, senderId, text);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return { messages, loading, sendMessage };
}

