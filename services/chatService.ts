import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    doc,
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

export const chatService = {
  // For MVP: Assigns chat to default aalim. Modify to implement proper aalim assignment logic
  async createChat(userId: string, aalimId: string = 'admin'): Promise<string> {
    const chatsRef = collection(db, 'chats');
    const chatData = {
      userId,
      aalimId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(chatsRef, chatData);
    return docRef.id;
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

  // For MVP: Returns all chats. Modify to filter by aalimId for proper assignment
  async getAalimChats(aalimId?: string): Promise<Chat[]> {
    const chatsRef = collection(db, 'chats');
    // For MVP: Show all chats to all aalims. Uncomment below for proper filtering:
    // const q = query(chatsRef, where('aalimId', '==', aalimId), orderBy('updatedAt', 'desc'));
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
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

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      callback(messages);
    });
  },
};

