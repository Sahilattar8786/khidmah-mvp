import { chatService, Message } from '@/services/chatService';
import { notificationService } from '@/services/notificationService';
import { useEffect, useRef, useState } from 'react';

export function useChat(chatId: string | null, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousMessagesCount = useRef(0);

  useEffect(() => {
    if (!chatId) {
      console.log('⚠️ useChat: No chatId provided');
      setLoading(false);
      setMessages([]);
      return;
    }

    // Request notification permissions
    notificationService.requestPermissions();

    console.log('🔔 useChat: Setting up subscription for chatId:', chatId);
    setLoading(true);
    setError(null);
    previousMessagesCount.current = 0;
    
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      console.log('📬 useChat: Received', newMessages.length, 'messages');
      setMessages(newMessages);
      setLoading(false);

      // Send notification for new messages from other user
      if (newMessages.length > previousMessagesCount.current && currentUserId && chatId) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.senderId !== currentUserId) {
          notificationService.sendNotification(
            'New message',
            latestMessage.text.length > 50 
              ? latestMessage.text.substring(0, 50) + '...' 
              : latestMessage.text,
            { chatId }
          );
        }
      }
      previousMessagesCount.current = newMessages.length;
    });

    return () => {
      console.log('🔕 useChat: Cleaning up subscription for chatId:', chatId);
      unsubscribe();
    };
  }, [chatId, currentUserId]);

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

