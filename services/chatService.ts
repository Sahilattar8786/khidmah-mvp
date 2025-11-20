import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';

export interface Chat {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  aalimId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

import { aalimService } from './aalimService';

export const chatService = {
  /**
   * Create a chat between a user and an aalim
   * Automatically assigns an available aalim if not provided
   */
  async createChat(userId: string, aalimId?: string, userName?: string, userEmail?: string): Promise<string> {
    // If no aalimId provided, assign an available aalim
    let assignedAalimId: string | undefined = aalimId;
    if (!assignedAalimId) {
      const assigned = await aalimService.assignAalimToChat();
      
      if (!assigned) {
        throw new Error('No available aalims at the moment. Please try again later.');
      }
      assignedAalimId = assigned;
    }

    const chatsRef = collection(db, 'chats');
    const chatData: any = {
      userId,
      aalimId: assignedAalimId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Store user name and email for display on aalim screen
    if (userName) {
      chatData.userName = userName;
    }
    if (userEmail) {
      chatData.userEmail = userEmail;
    }
    
    const docRef = await addDoc(chatsRef, chatData);
    console.log(`✅ Chat created: ${docRef.id} between user ${userId} and aalim ${assignedAalimId}`);
    return docRef.id;
  },

  /**
   * Get a single chat by ID (no index required)
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        return {
          id: chatSnap.id,
          ...chatSnap.data(),
        } as Chat;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      return null;
    }
  },

  // Note: These queries require Firestore composite indexes
  // Firebase will prompt you to create them when you run the app
  async getUserChats(userId: string): Promise<Chat[]> {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  },

  /**
   * Get chats assigned to a specific aalim
   * Filters chats by aalimId to show only chats assigned to this aalim
   */
  async getAalimChats(aalimId: string): Promise<Chat[]> {
    console.log('🔍 getAalimChats called with aalimId:', aalimId);
    console.log('🔍 aalimId type:', typeof aalimId);
    console.log('🔍 aalimId length:', aalimId.length);
    const chatsRef = collection(db, 'chats');
    
    try {
      // Try query with orderBy first (requires composite index)
      const q = query(
        chatsRef, 
        where('aalimId', '==', aalimId), 
        orderBy('updatedAt', 'desc')
      );
      console.log('📊 Executing query: aalimId ==', aalimId, 'orderBy updatedAt desc');
      const querySnapshot = await getDocs(q);
      console.log('📄 Query returned', querySnapshot.docs.length, 'documents');
      
      // If no results, try to get all chats to see what aalimIds exist
      if (querySnapshot.docs.length === 0) {
        console.warn('⚠️ No chats found with aalimId:', aalimId);
        console.log('🔍 Checking all chats to see available aalimIds...');
        const allChatsQuery = query(chatsRef);
        const allChatsSnapshot = await getDocs(allChatsQuery);
        console.log('📊 Total chats in database:', allChatsSnapshot.docs.length);
        allChatsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('📝 Chat', doc.id, ':', {
            aalimId: data.aalimId,
            aalimIdType: typeof data.aalimId,
            userId: data.userId,
            matches: data.aalimId === aalimId
          });
        });
      }
      
      const chats = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📝 Chat document:', doc.id, 'data:', {
          userId: data.userId,
          aalimId: data.aalimId,
          aalimIdType: typeof data.aalimId,
          updatedAt: data.updatedAt
        });
        return {
          id: doc.id,
          ...data,
        };
      }) as Chat[];
      
      // Sort manually as fallback if orderBy fails
      chats.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || 0;
        return bTime - aTime; // Descending order
      });
      
      console.log('✅ Returning', chats.length, 'chats');
      return chats;
    } catch (error: any) {
      console.error('❌ Query error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // If index error, automatically use fallback without orderBy (silently)
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.log('ℹ️ Index not available, using fallback query (this is normal)');
        
        // Fallback: query without orderBy, then sort in memory
        const fallbackQuery = query(
          chatsRef,
          where('aalimId', '==', aalimId)
        );
        console.log('📊 Executing fallback query: aalimId ==', aalimId);
        const querySnapshot = await getDocs(fallbackQuery);
        console.log('📄 Fallback query returned', querySnapshot.docs.length, 'documents');
        
        const chats = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📝 Chat document (fallback):', doc.id, 'data:', {
            userId: data.userId,
            aalimId: data.aalimId,
            updatedAt: data.updatedAt
          });
          return {
            id: doc.id,
            ...data,
          };
        }) as Chat[];
        
        // Sort manually
        chats.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return bTime - aTime; // Descending order
        });
        
        console.log('✅ Fallback returning', chats.length, 'chats');
        return chats;
      }
      // Re-throw other errors
      throw error;
    }
  },

  async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
    });

    // Update chat's updatedAt
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a chat and all its messages
   * This will permanently remove the chat from the database
   */
  async deleteChat(chatId: string): Promise<void> {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    try {
      console.log('🗑️ Deleting chat:', chatId);
      
      // First, delete all messages in the subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, 'chats', chatId, 'messages', messageDoc.id))
      );
      
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${messagesSnapshot.docs.length} messages`);
      
      // Then delete the chat document itself
      const chatRef = doc(db, 'chats', chatId);
      await deleteDoc(chatRef);
      console.log('✅ Chat deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      throw error;
    }
  },

  /**
   * Subscribe to aalim chats in real-time
   * Listens for new chats assigned to the aalim and updates automatically
   */
  subscribeToAalimChats(aalimId: string, callback: (chats: Chat[]) => void): () => void {
    if (!aalimId) {
      console.error('❌ subscribeToAalimChats: aalimId is required');
      callback([]);
      return () => {};
    }
    
    console.log('🔔 Setting up real-time subscription for aalim chats:', aalimId);
    const chatsRef = collection(db, 'chats');
    
    let unsubscribeFn: (() => void) | null = null;
    let isUnsubscribed = false;
    
    // Helper function to process and sort chats
    const processChats = (docs: any[]): Chat[] => {
      const chats = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      
      // Sort chats by updatedAt (descending - most recent first)
      chats.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return bTime - aTime; // Descending order
      });
      
      return chats;
    };
    
    // Use query without orderBy to avoid index requirement
    // We sort chats manually anyway, so orderBy is not needed
    const q = query(chatsRef, where('aalimId', '==', aalimId));
    
    console.log('📡 Subscribing to aalim chats (without orderBy to avoid index requirement)...');
    unsubscribeFn = onSnapshot(
      q,
      (snapshot) => {
        if (isUnsubscribed) {
          return;
        }
        console.log('📨 Received', snapshot.docs.length, 'chats for aalim');
        const chats = processChats(snapshot.docs);
        callback(chats);
      },
      (error) => {
        if (isUnsubscribed) {
          return;
        }
        console.error('❌ Subscription error:', error);
        callback([]);
      }
    );
    
    // Return unsubscribe function
    return () => {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      if (unsubscribeFn) {
        console.log('🔕 Unsubscribing from aalim chats:', aalimId);
        unsubscribeFn();
      }
    };
  },

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    if (!chatId) {
      console.error('❌ subscribeToMessages: chatId is required');
      callback([]);
      return () => {};
    }
    
    console.log('🔔 Setting up real-time subscription for chat:', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    let unsubscribeFn: (() => void) | null = null;
    let isUnsubscribed = false;
    
    // Helper function to process and sort messages
    const processMessages = (docs: any[]): Message[] => {
      const messages = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.createdAt,
        };
      }) as Message[];
      
      // Sort messages by createdAt
      messages.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return aTime - bTime; // Ascending order
      });
      
      return messages;
    };
    
    // Use query without orderBy to avoid index requirement
    // We sort messages manually in processMessages anyway, so orderBy is not needed
    const q = query(messagesRef);
    
    console.log('📡 Subscribing to messages (without orderBy to avoid index requirement)...');
    unsubscribeFn = onSnapshot(
      q,
      (snapshot) => {
        if (isUnsubscribed) {
          console.log('⚠️ Received snapshot after unsubscribe, ignoring...');
          return;
        }
        console.log('📨 Received', snapshot.docs.length, 'messages');
        const messages = processMessages(snapshot.docs);
        console.log('✅ Sending', messages.length, 'messages to callback');
        callback(messages);
      },
      (error) => {
        if (isUnsubscribed) {
          return;
        }
        console.error('❌ Subscription error:', error);
        callback([]);
      }
    );
    
    // Return unsubscribe function
    return () => {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      if (unsubscribeFn) {
        console.log('🔕 Unsubscribing from messages for chat:', chatId);
        unsubscribeFn();
      }
    };
  },
};

