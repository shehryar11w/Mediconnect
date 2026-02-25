import { io, Socket } from 'socket.io-client';
import api from './api';

export type MessageRole = 'doctor' | 'patient';

export type Message = {
  MessageId: number;
  MessageChatId: number;
  MessageContent: string;
  MessageDoctorId: number;
  MessageRead: boolean;
  MessageSenderId: number;
  MessageSenderType: string;
  MessageSentAt: Date;
};

export type ChatDoctor = {
  doctorName: string;
  doctorSpecialization: string;
  doctorEmail: string;
  doctorPhone: string;
};

export type Patient = {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
};

export type ChatDetails = {
  doctor: ChatDoctor;
  messages: Message[];
};

class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((data: { chatId: string; userId: string; isTyping: boolean }) => void)[] = [];
  private readReceiptHandlers: ((data: { chatId: string; userId: string }) => void)[] = [];
  private token: string | null = null;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }

  initialize(token: string) {
    if (this.token === token && this.isConnected) {
      console.log('Already connected with the same token');
      return;
    }

    this.token = token;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io("http://10.0.2.2:5000", {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.once('connect', () => {
      console.log('✅ Connected to chat server');
    });

    this.socket.once('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    this.socket.on('new_message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('typing', (data: { chatId: string; userId: string }) => {
      this.typingHandlers.forEach(handler => handler({ ...data, isTyping: true }));
    });

    this.socket.on('typing_stopped', (data: { chatId: string; userId: string }) => {
      this.typingHandlers.forEach(handler => handler({ ...data, isTyping: false }));
    });

    this.socket.on('messages_read', (data: { chatId: string; userId: string }) => {
      this.readReceiptHandlers.forEach(handler => handler(data));
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) return resolve();
      if (!this.socket) return reject(new Error('Socket not initialized'));

      this.socket.once('connect', resolve);
      this.socket.once('connect_error', reject);
    });
  }

  async getChatDetails(chatId: string) {
    try {
      const response = await api.get(`/chats/${chatId}/details`);
      return response.data;
    } catch (error) {
      console.error('Failed to get chat details:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    console.log('Getting chat messages for chatId:', chatId);
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));

      this.socket.emit('get_chat_messages', chatId, (response: any) => {
        if (response.success) {
          console.log('Messages:', response.messages);
          resolve(response.messages);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  sendMessage(chatId: string, content: string) {
    if (!this.isConnected) {
      console.warn('Cannot send message: Socket not connected');
      return;
    }
    const numericChatId = Number(chatId);
    if (isNaN(numericChatId)) {
      console.error('Invalid chat ID:', chatId);
      return;
    }
    this.socket!.emit('send_message', { 
      chatId: numericChatId, 
      content,
      timestamp: new Date().toISOString()
    });
  }

  sendTypingStatus(chatId: string) {
    if (!this.isConnected) {
      console.warn('Cannot send typing status: Socket not connected');
      return;
    }
    const numericChatId = Number(chatId);
    if (isNaN(numericChatId)) {
      console.error('Invalid chat ID:', chatId);
      return;
    }
    this.socket!.emit('typing', { chatId: numericChatId });
  }

  sendTypingStopped(chatId: string) {
    if (!this.isConnected) {
      console.warn('Cannot send typing stopped: Socket not connected');
      return;
    }
    const numericChatId = Number(chatId);
    if (isNaN(numericChatId)) {
      console.error('Invalid chat ID:', chatId);
      return;
    }
    this.socket!.emit('typing_stopped', { chatId: numericChatId });
  }

  markMessagesAsRead(chatId: string) {
    if (!this.isConnected) {
      console.warn('Cannot mark messages as read: Socket not connected');
      return;
    }
    const numericChatId = Number(chatId);
    if (isNaN(numericChatId)) {
      console.error('Invalid chat ID:', chatId);
      return;
    }
    this.socket!.emit('mark_read', { chatId: numericChatId });
  }

  onNewMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onTypingStatus(handler: (data: { chatId: string; userId: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onReadReceipt(handler: (data: { chatId: string; userId: string }) => void) {
    this.readReceiptHandlers.push(handler);
    return () => {
      this.readReceiptHandlers = this.readReceiptHandlers.filter(h => h !== handler);
    };
  }

  async getDoctors() {
    try {
      const response = await api.get('/chats/list');
      return response.data;
    } catch (error) {
      console.error('Failed to get chats list:', error);
      throw error;
    }
  }
}

export const chatService = ChatService.getInstance();
