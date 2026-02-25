const Messages = require('../models/Messages');
const Chats = require('../models/Chats');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

class ChatService {
  async createMessage(chatId, senderId, senderType, content) {
    const chat = await this.verifyChatAccess(chatId, senderId);
    
    const lastMessage = await Messages.findOne().sort({ MessageId: -1 });
    const nextMessageId = lastMessage ? lastMessage.MessageId + 1 : 1;

    const message = await Messages.create({
      MessageId: nextMessageId,
      MessageChatId: chatId,
      MessageDoctorId: chat.AppointmentDoctorId,
      MessageSenderId: senderId,
      MessageSenderType: senderType,
      MessageContent: content,
      MessageSentAt: new Date()
    });

    // Update the chat's last message
    await Chats.findOneAndUpdate(
      { ChatId: chatId },
      {
        ChatLastMessage: content,
        ChatLastMessageTime: message.MessageSentAt
      }
    );

    return message;
  }

  async markMessagesAsRead(chatId, userRole) {
    return await Messages.updateMany(
      {
        MessageChatId: chatId,
        MessageRead: false,
        MessageSenderType: userRole === 'doctor' ? 'patient' : 'doctor'
      },
      {
        $set: {
          MessageRead: true,
          MessageReadAt: new Date()
        }
      }
    );
  }

  async getUserChats(userId, userRole) {
    const chats = await Chats.find({
      $or: [
        { AppointmentDoctorId: userId },
        { AppointmentPatientId: userId }
      ]
    }).sort({ ChatLastMessageTime: -1 }).lean();

    // Get unread message counts for each chat
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Messages.countDocuments({
        MessageChatId: chat.ChatId,
        MessageRead: false,
        MessageSenderType: userRole === 'doctor' ? 'patient' : 'doctor'
      });
      return { ...chat, unreadCount };
    }));

    return chatsWithUnread;
  }

  async getChatMessages(chatId) {
    return await Messages.find({ MessageChatId: chatId })
      .sort({ MessageSentAt: 1 })
      .lean();
  }

  async getLastMessage(chatId) {
    return await Messages.findOne({ MessageChatId: chatId })
      .sort({ MessageSentAt: -1 })
      .lean();
  }

  async getUnreadCount(chatId, userRole) {
    return await Messages.countDocuments({
      MessageChatId: chatId,
      MessageRead: false,
      MessageSenderType: userRole === 'doctor' ? 'patient' : 'doctor'
    });
  }

  async verifyChatAccess(chatId, userId) {
    const chat = await Chats.findOne({ ChatId: chatId });
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.AppointmentDoctorId !== userId && chat.AppointmentPatientId !== userId) {
      throw new Error('Unauthorized access');
    }

    return chat;
  }

  async getChatById(chatId) {
    return await Chats.findOne({ ChatId: chatId }).lean();
  }
}

module.exports = new ChatService(); 