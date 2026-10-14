export type NotificationType = 'job' | 'application' | 'message' | 'call' | 'announcement' | 'mentorship';

export interface NotificationItem {
  id: string;
  userId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'rejected' | 'ended' | 'missed';

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callerRole: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  receiverRole: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}
