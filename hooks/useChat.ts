import { chatService, Message } from '@/services/chatService';
import { useEffect, useState } from 'react';

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      console.log('⚠️ useChat: No chatId provided');
      setLoading(false);
      setMessages([]);
      return;
    }

    console.log('🔔 useChat: Setting up subscription for chatId:', chatId);
    setLoading(true);
    setError(null);
    
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      console.log('📬 useChat: Received', newMessages.length, 'messages');
      console.log('📬 Messages:', newMessages.map(m => ({ id: m.id, text: m.text.substring(0, 20) + '...', senderId: m.senderId })));
      setMessages(newMessages);
      setLoading(false);
    });

    return () => {
      console.log('🔕 useChat: Cleaning up subscription for chatId:', chatId);
      unsubscribe();
    };
  }, [chatId]);

  const sendMessage = async (senderId: string, text: string) => {
    if (!chatId || !text.trim()) {
      console.warn('⚠️ Cannot send message: missing chatId or empty text');
      return;
    }
    
    try {
      console.log('📤 Sending message:', { chatId, senderId, text: text.substring(0, 20) + '...' });
      await chatService.sendMessage(chatId, senderId, text);
      console.log('✅ Message sent successfully');
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      setError(error?.message || 'Failed to send message');
      throw error;
    }
  };

  return { messages, loading, sendMessage, error };
}

