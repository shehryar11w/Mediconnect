const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatService = require('./ChatService');

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map to store user ID to socket ID mapping
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: 'http://localhost:8081',
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (error) {
        console.log(error);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.user.id);
      
      // Store socket mapping
      this.userSockets.set(socket.user.id, socket.id);

      // Join user's chats
      this.joinUserChats(socket);

      // Handle new message
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content } = data;
          
          // Create message using shared service
          const message = await ChatService.createMessage(
            chatId,
            socket.user.id,
            socket.user.role,
            content
          );

          // Emit to all users in the chat
          this.io.to(`chat_${chatId}`).emit('new_message', message);

            // Emit typing stopped  
            socket.to(`chat_${chatId}`).emit('typing_stopped', {
              userId: socket.user.id,
              chatId
            });
        } catch (error) {
          socket.emit('error', error.message);
        }
      });

      // Handle typing status
      socket.on('typing', (data) => {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('typing', {
          userId: socket.user.id,
          chatId
        });
      });

      // Handle typing stopped
      socket.on('typing_stopped', (data) => {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('typing_stopped', {
          userId: socket.user.id,
          chatId
        });
      });
      socket.on('get_chat_messages', async (chatId, callback) => {
        try {
          // Use your ChatService to get messages for this chat
          const messages = await ChatService.getChatMessages(chatId);
      
          // Return messages to client via callback
          callback({ success: true, messages });
        } catch (error) {
          console.error('Error fetching chat messages:', error);
          callback({ success: false, error: error.message });
        }
      });

      // Handle read receipts
      socket.on('mark_read', async (data) => {
        try {
          const { chatId } = data;
          
          // Mark messages as read using shared service
          await ChatService.markMessagesAsRead(chatId, socket.user.role);

          // Notify other user
          socket.to(`chat_${chatId}`).emit('messages_read', {
            chatId,
            userId: socket.user.id
          });
        } catch (error) {
          socket.emit('error', error.message);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.id);
        this.userSockets.delete(socket.user.id);
      });
    });
  }

  async joinUserChats(socket) {
    try {
      const userId = socket.user.id;
      const userRole = socket.user.role;

      // Get user's chats using shared service
      const chats = await ChatService.getUserChats(userId, userRole);

      // Join each chat room
      chats.forEach(chat => {
        socket.join(`chat_${chat.ChatId}`);
      });
    } catch (error) {
      console.error('Error joining chats:', error);
    }
  }

  // Helper method to emit to specific user
  emitToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

module.exports = new WebSocketService(); 