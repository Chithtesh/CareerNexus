export type MessageType = 'text' | 'file' | 'image' | 'system';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  // UI & Backward compatibility attributes
  content: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: 'student' | 'alumni' | 'admin' | 'recruiter';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  readAt?: string | null;
  // Delivery & Optimistic UI state
  pending?: boolean;
  failed?: boolean;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'student' | 'alumni' | 'admin' | 'recruiter';
  participantHeadline?: string; // e.g., 'SDE II @ Google' or 'CSE Final Year, 9.4 CGPA'
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  updatedAt?: string;
}
