import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Conversation, ChatMessage, MessageType } from '../models/message.model';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../data/mock-data';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  private notificationService = inject(NotificationService);

  private readonly BROADCAST_CHANNEL_NAME = 'careernexus_cross_device_chat';

  // State signals
  private conversationsSignal = signal<Conversation[]>([]);
  private messagesSignal = signal<Record<string, ChatMessage[]>>({});
  private activeConversationIdSignal = signal<string>('');
  
  isLoading = signal<boolean>(false);
  isSending = signal<boolean>(false);
  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  connectionStatus = signal<'connected' | 'reconnecting' | 'offline'>('connected');

  // Realtime & cross-device channels
  private activeConversationMessagesChannel: RealtimeChannel | null = null;
  private realtimeConversationsChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  // Window event listeners
  private onlineListener: any = null;
  private offlineListener: any = null;

  // Computed public views
  conversations = computed(() => this.conversationsSignal());
  activeConversationId = computed(() => this.activeConversationIdSignal());

  activeConversation = computed<Conversation | null>(() => {
    const id = this.activeConversationIdSignal();
    const list = this.conversationsSignal();
    if (!id && list.length > 0) return list[0];
    return list.find(c => c.id === id) || (list.length > 0 ? list[0] : null);
  });

  activeMessages = computed<ChatMessage[]>(() => {
    const id = this.activeConversationIdSignal();
    if (!id) return [];
    const list = this.messagesSignal()[id] || [];
    // Strict conversation isolation: only messages matching active conversation ID
    return list.filter(m => m.conversationId === id);
  });

  totalUnreadCount = computed(() =>
    this.conversationsSignal().reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  );

  constructor() {
    this.initCrossDeviceListeners();
    this.initChat();
  }

  ngOnDestroy() {
    this.cleanupListeners();
  }

  private initCrossDeviceListeners() {
    // 1. Multi-tab / cross-window instant communication channel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(this.BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastEvent(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment:', err);
      }
    }

    // 2. Network connectivity listeners
    if (typeof window !== 'undefined') {
      this.onlineListener = () => {
        this.isOnline.set(true);
        this.connectionStatus.set('connected');
        this.toast.info('Network Restored', 'Re-synchronizing cross-device placement chat...');
        this.reconnectRealtimeAndSync();
      };

      this.offlineListener = () => {
        this.isOnline.set(false);
        this.connectionStatus.set('offline');
        this.toast.warning('Offline Mode', 'Chat will queue messages and synchronize when connection restores.');
      };

      window.addEventListener('online', this.onlineListener);
      window.addEventListener('offline', this.offlineListener);
    }
  }

  private cleanupListeners() {
    if (this.activeConversationMessagesChannel) {
      this.supabase.unsubscribe(this.activeConversationMessagesChannel);
      this.activeConversationMessagesChannel = null;
    }
    if (this.realtimeConversationsChannel) {
      this.supabase.unsubscribe(this.realtimeConversationsChannel);
      this.realtimeConversationsChannel = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (typeof window !== 'undefined') {
      if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
      if (this.offlineListener) window.removeEventListener('offline', this.offlineListener);
    }
  }

  private async reconnectRealtimeAndSync() {
    const activeId = this.activeConversationIdSignal();
    if (activeId) {
      await this.setActiveConversation(activeId);
    }
    await this.loadConversations();
  }

  private async initChat() {
    this.isLoading.set(true);

    // 1. Subscribe to Supabase Realtime changes
    await this.subscribeToRealtime();

    // 2. Load conversations from Supabase source of truth
    await this.loadConversations();

    this.isLoading.set(false);
  }

  private async subscribeToRealtime() {
    const client = this.supabase.getClient();
    const currentUser = this.authService.currentUser();
    if (!client) return;

    try {
      if (this.realtimeConversationsChannel) {
        this.supabase.unsubscribe(this.realtimeConversationsChannel);
      }

      // Realtime subscription for conversation updates
      this.realtimeConversationsChannel = this.supabase.subscribeToTable(
        `conversations_sync_${Date.now()}`,
        'conversations',
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            this.handleRealtimeConversationUpdate(payload.new);
          }
        }
      );
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  /**
   * Loads conversations strictly filtered by portal role context.
   * Student: ONLY approved mentors (status = 'accepted', connection_type = 'mentorship')
   * Alumni: ONLY approved student mentees (status = 'accepted', connection_type = 'mentorship')
   * Recruiter: Candidate applicant chats only
   * Admin: Operations overview chats
   */
  async loadConversations(roleContext?: 'student' | 'alumni' | 'recruiter' | 'admin'): Promise<Conversation[]> {
    const role = roleContext || this.authService.actualRole() || 'student';
    const client = this.supabase.getClient();
    const currentUser = this.authService.currentUser();
    const loadedList: Conversation[] = [];

    if (!currentUser) {
      this.conversationsSignal.set([]);
      this.activeConversationIdSignal.set('');
      return [];
    }

    if (role === 'student') {
      // 1. Gather all accepted mentorship connections for this student
      const acceptedMentorsMap = new Map<string, { mentorId: string; mentorName: string; mentorAvatar?: string; topic?: string; date: string }>();

      // Check Supabase connections
      if (client) {
        try {
          const { data: dbConns } = await client
            .from('connections')
            .select('*')
            .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .eq('status', 'accepted')
            .eq('connection_type', 'mentorship');

          if (dbConns && dbConns.length > 0) {
            for (const c of dbConns) {
              const isReq = c.requester_id === currentUser.id;
              const mentorId = isReq ? c.receiver_id : c.requester_id;
              const mentorName = isReq ? (c.receiver_name || 'Alumni Mentor') : (c.requester_name || 'Alumni Mentor');
              const mentorAvatar = isReq ? c.receiver_avatar : c.requester_avatar;
              acceptedMentorsMap.set(mentorId, {
                mentorId,
                mentorName,
                mentorAvatar,
                topic: c.mentorship_topic,
                date: c.accepted_at || c.created_at
              });
            }
          }
        } catch (dbErr) {
          console.warn('DB connections query error in loadConversations:', dbErr);
        }
      }

      // Check local cache
      try {
        const cached = localStorage.getItem('careernexus_connections_cache') || localStorage.getItem('careernexus_alumni_connections');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const accepted = parsed.filter(
              c => (c.requesterId === currentUser.id || c.receiverId === currentUser.id) &&
                   c.status === 'accepted' &&
                   (c.connectionType === 'mentorship' || c.requestType === 'mentorship')
            );
            for (const c of accepted) {
              const isReq = c.requesterId === currentUser.id;
              const mentorId = isReq ? c.receiverId : c.requesterId;
              if (!acceptedMentorsMap.has(mentorId)) {
                acceptedMentorsMap.set(mentorId, {
                  mentorId,
                  mentorName: isReq ? (c.receiverName || 'Alumni Mentor') : (c.requesterName || 'Alumni Mentor'),
                  mentorAvatar: isReq ? c.receiverAvatar : c.requesterAvatar,
                  topic: c.mentorshipTopic,
                  date: c.acceptedAt || c.createdAt
                });
              }
            }
          }
        }
      } catch {}

      // Build isolated conversation per approved mentor
      for (const [mentorId, info] of acceptedMentorsMap.entries()) {
        const convId = `conv-mentorship-${[currentUser.id, mentorId].sort().join('_')}`;

        let lastMsgText = 'Mentorship connection active. Say hi!';
        let lastMsgTime = this.formatMessageTimestamp(info.date);
        let unreadCount = 0;
        let updatedAt = info.date;

        if (client) {
          try {
            const { data: latestMsg } = await client
              .from('messages')
              .select('*')
              .eq('conversation_id', convId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (latestMsg) {
              lastMsgText = latestMsg.message_text || latestMsg.content || lastMsgText;
              lastMsgTime = this.formatMessageTimestamp(latestMsg.created_at);
              updatedAt = latestMsg.created_at;
            }

            const { count } = await client
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', convId)
              .eq('receiver_id', currentUser.id)
              .eq('is_read', false);

            unreadCount = count || 0;
          } catch {}
        }

        loadedList.push({
          id: convId,
          participantId: mentorId,
          participantName: info.mentorName,
          participantAvatar: info.mentorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.mentorName)}&background=7c3aed&color=fff&bold=true`,
          participantRole: 'alumni',
          participantHeadline: `${info.topic || 'System Design & Career Guidance'} (Mentor)`,
          lastMessage: lastMsgText,
          lastMessageTime: lastMsgTime,
          unreadCount,
          isOnline: true,
          updatedAt
        });
      }

    } else if (role === 'alumni') {
      // 2. Gather all accepted mentorship connections for this mentor
      const acceptedStudentsMap = new Map<string, { studentId: string; studentName: string; studentAvatar?: string; dept?: string; date: string }>();

      if (client) {
        try {
          const { data: dbConns } = await client
            .from('connections')
            .select('*')
            .or(`receiver_id.eq.${currentUser.id},requester_id.eq.${currentUser.id}`)
            .eq('status', 'accepted')
            .eq('connection_type', 'mentorship');

          if (dbConns && dbConns.length > 0) {
            for (const c of dbConns) {
              const isReceiver = c.receiver_id === currentUser.id;
              const studentId = isReceiver ? c.requester_id : c.receiver_id;
              const studentName = isReceiver ? (c.requester_name || 'Student Mentee') : (c.receiver_name || 'Student Mentee');
              const studentAvatar = isReceiver ? c.requester_avatar : c.receiver_avatar;
              acceptedStudentsMap.set(studentId, {
                studentId,
                studentName,
                studentAvatar,
                dept: c.requester_department,
                date: c.accepted_at || c.created_at
              });
            }
          }
        } catch (dbErr) {
          console.warn('DB connections error in loadConversations:', dbErr);
        }
      }

      // Check local cache
      try {
        const cached = localStorage.getItem('careernexus_connections_cache') || localStorage.getItem('careernexus_alumni_connections');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const accepted = parsed.filter(
              c => (c.receiverId === currentUser.id || c.requesterId === currentUser.id) &&
                   c.status === 'accepted' &&
                   (c.connectionType === 'mentorship' || c.requestType === 'mentorship')
            );
            for (const c of accepted) {
              const isReceiver = c.receiverId === currentUser.id;
              const studentId = isReceiver ? c.requesterId : c.receiverId;
              if (!acceptedStudentsMap.has(studentId)) {
                acceptedStudentsMap.set(studentId, {
                  studentId,
                  studentName: isReceiver ? (c.requesterName || 'Student Mentee') : (c.receiverName || 'Student Mentee'),
                  studentAvatar: isReceiver ? c.requesterAvatar : c.receiverAvatar,
                  dept: c.requesterDepartment,
                  date: c.acceptedAt || c.createdAt
                });
              }
            }
          }
        }
      } catch {}

      // Build isolated conversation per approved student
      for (const [studentId, info] of acceptedStudentsMap.entries()) {
        const convId = `conv-mentorship-${[currentUser.id, studentId].sort().join('_')}`;

        let lastMsgText = 'Mentorship connection active. Say hi!';
        let lastMsgTime = this.formatMessageTimestamp(info.date);
        let unreadCount = 0;
        let updatedAt = info.date;

        if (client) {
          try {
            const { data: latestMsg } = await client
              .from('messages')
              .select('*')
              .eq('conversation_id', convId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (latestMsg) {
              lastMsgText = latestMsg.message_text || latestMsg.content || lastMsgText;
              lastMsgTime = this.formatMessageTimestamp(latestMsg.created_at);
              updatedAt = latestMsg.created_at;
            }

            const { count } = await client
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', convId)
              .eq('receiver_id', currentUser.id)
              .eq('is_read', false);

            unreadCount = count || 0;
          } catch {}
        }

        loadedList.push({
          id: convId,
          participantId: studentId,
          participantName: info.studentName,
          participantAvatar: info.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.studentName)}&background=3b82f6&color=fff&bold=true`,
          participantRole: 'student',
          participantHeadline: `${info.dept || 'Computer Science & Engineering'} (Mentee)`,
          lastMessage: lastMsgText,
          lastMessageTime: lastMsgTime,
          unreadCount,
          isOnline: true,
          updatedAt
        });
      }

    } else if (role === 'recruiter') {
      // Recruiter Portal: Candidates only (NO mentorship chats)
      if (client) {
        try {
          const { data: msgRows } = await client
            .from('messages')
            .select('conversation_id, sender_id, receiver_id, sender_name, sender_avatar, sender_role, created_at, message_text')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .not('conversation_id', 'like', 'conv-mentorship-%')
            .order('created_at', { ascending: false });

          if (msgRows && msgRows.length > 0) {
            const seen = new Set<string>();
            for (const r of msgRows) {
              if (seen.has(r.conversation_id)) continue;
              seen.add(r.conversation_id);
              const otherId = r.sender_id === currentUser.id ? r.receiver_id : r.sender_id;
              loadedList.push({
                id: r.conversation_id,
                participantId: otherId,
                participantName: r.sender_name || 'Placement Candidate',
                participantAvatar: r.sender_avatar,
                participantRole: 'student',
                participantHeadline: 'Placement Candidate',
                lastMessage: r.message_text || 'Candidate chat active',
                lastMessageTime: this.formatMessageTimestamp(r.created_at),
                unreadCount: 0,
                isOnline: true,
                updatedAt: r.created_at
              });
            }
          }
        } catch {}
      }
    } else {
      // Admin: Operational overview
      if (client) {
        try {
          const { data: convData } = await client
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(10);

          if (convData && convData.length > 0) {
            for (const c of convData) {
              loadedList.push({
                id: c.id,
                participantId: c.last_sender_id || 'system',
                participantName: c.title || 'System Channel',
                participantRole: 'admin',
                participantHeadline: 'Admin Operations',
                lastMessage: c.last_message_text || 'Channel active',
                lastMessageTime: this.formatMessageTimestamp(c.last_message_at),
                unreadCount: 0,
                isOnline: true,
                updatedAt: c.updated_at
              });
            }
          }
        } catch {}
      }
    }

    // Sort strictly by latest activity
    loadedList.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    this.conversationsSignal.set(loadedList);

    const currentActive = this.activeConversationIdSignal();
    if (loadedList.length > 0) {
      if (!currentActive || !loadedList.some(c => c.id === currentActive)) {
        await this.setActiveConversation(loadedList[0].id);
      }
    } else {
      this.activeConversationIdSignal.set('');
    }

    return loadedList;
  }

  /**
   * Loads message history for a specific conversation from Supabase.
   */
  async loadMessages(convId: string): Promise<ChatMessage[]> {
    if (!convId) return [];

    const client = this.supabase.getClient();
    const currentUser = this.authService.currentUser();

    if (client) {
      try {
        const { data, error } = await client
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const mapped: ChatMessage[] = data.map((row: any) => ({
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            messageText: row.message_text || row.content || '',
            content: row.content || row.message_text || '',
            messageType: (row.message_type as MessageType) || 'text',
            isRead: row.is_read ?? (row.read_at != null),
            readAt: row.read_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            senderName: row.sender_name || 'User',
            senderAvatar: row.sender_avatar,
            senderRole: row.sender_role || 'student',
            attachmentName: row.attachment_name,
            attachmentUrl: row.attachment_url,
            attachmentSize: row.attachment_size,
            pending: false,
            failed: false
          }));

          this.messagesSignal.update(store => ({
            ...store,
            [convId]: mapped
          }));

          // Mark unread incoming messages as read
          if (currentUser) {
            this.markConversationAsRead(convId);
          }

          return mapped;
        }
      } catch (err) {
        console.warn(`Could not load messages from Supabase for ${convId}:`, err);
      }
    }

    const existing = this.messagesSignal()[convId] || [];
    return existing;
  }

  /**
   * Selects an active conversation and marks messages as read.
   * Realtime unbinds previous conversation and binds ONLY to this conversation_id.
   */
  async setActiveConversation(id: string) {
    if (!id) {
      this.activeConversationIdSignal.set('');
      return;
    }

    // 1. Unsubscribe from previous conversation's Realtime channel
    if (this.activeConversationMessagesChannel) {
      this.supabase.unsubscribe(this.activeConversationMessagesChannel);
      this.activeConversationMessagesChannel = null;
    }

    this.activeConversationIdSignal.set(id);

    // 2. Subscribe to this specific conversation_id ONLY
    const client = this.supabase.getClient();
    if (client) {
      try {
        this.activeConversationMessagesChannel = this.supabase.subscribeToTable(
          `active_chat_${id}_${Date.now()}`,
          'messages',
          (payload) => {
            // Strict Realtime isolation: message must belong to this active conversation
            if (payload.new && payload.new.conversation_id === id) {
              if (payload.eventType === 'INSERT') {
                this.handleIncomingRealtimeMessage(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                this.handleRealtimeMessageUpdate(payload.new);
              }
            }
          },
          `conversation_id=eq.${id}`
        );
      } catch (subErr) {
        console.warn('Realtime subscription error for conversation:', subErr);
      }
    }

    // 3. Reset unread counter on active conversation
    this.conversationsSignal.update(list =>
      list.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
    );

    // 4. Mark as read in Supabase and notify peers
    this.markConversationAsRead(id);

    // 5. Load fresh messages
    await this.loadMessages(id);
  }

  /**
   * Sends a message with optimistic UI updates and instant cross-device broadcast.
   */
  async sendMessage(content: string, attachment?: { name: string; url: string; size: string }): Promise<void> {
    const text = (content || '').trim();
    if (!text && !attachment) return;

    const convId = this.activeConversationIdSignal();
    const currentUser = this.authService.currentUser();
    const activeConv = this.activeConversation();

    if (!convId || !activeConv) {
      this.toast.error('No Active Chat', 'Please select or start a conversation first.');
      return;
    }

    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: convId,
      senderId: currentUser?.id || 'u-student-01',
      senderName: currentUser?.fullName || 'Placement User',
      senderAvatar: currentUser?.avatarUrl,
      senderRole: currentUser?.role || 'student',
      receiverId: activeConv.participantId,
      messageText: text,
      content: text,
      messageType: attachment ? 'file' : 'text',
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url,
      attachmentSize: attachment?.size,
      isRead: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      pending: true,
      failed: false
    };

    // 1. Optimistic UI update
    this.messagesSignal.update(store => {
      const current = store[convId] || [];
      return {
        ...store,
        [convId]: [...current, optimisticMessage]
      };
    });

    // Update conversation metadata
    this.conversationsSignal.update(list =>
      list.map(c => c.id === convId ? {
        ...c,
        lastMessage: text || (attachment ? `📎 ${attachment.name}` : ''),
        lastMessageTime: 'Just now',
        updatedAt: nowIso
      } : c)
    );

    // 2. Broadcast to other tabs/windows immediately
    this.broadcastToPeers({
      type: 'NEW_MESSAGE',
      message: optimisticMessage
    });

    // 3. Persist to Supabase Database
    const client = this.supabase.getClient();
    if (client && currentUser) {
      this.isSending.set(true);
      try {
        const targetReceiverId = activeConv.participantId;
        const payload: any = {
          conversation_id: convId,
          sender_id: currentUser.id,
          receiver_id: targetReceiverId,
          message_text: text,
          content: text,
          message_type: attachment ? 'file' : 'text',
          attachment_name: attachment?.name || null,
          attachment_url: attachment?.url || null,
          attachment_size: attachment?.size || null,
          is_read: false,
          sender_name: currentUser.fullName,
          sender_avatar: currentUser.avatarUrl || null,
          sender_role: currentUser.role
        };

        const { data, error } = await client
          .from('messages')
          .insert(payload)
          .select()
          .single();

        this.isSending.set(false);

        if (error) {
          console.warn('Supabase message insert error:', error);
          this.markMessageFailed(convId, tempId);
          this.toast.error('Send Failed', error.message || 'Unable to deliver message.');
        } else if (data) {
          // Replace temporary ID with persisted Supabase ID
          this.messagesSignal.update(store => ({
            ...store,
            [convId]: (store[convId] || []).map(m =>
              m.id === tempId ? {
                ...m,
                id: data.id,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                pending: false,
                failed: false
              } : m
            )
          }));

          // Notify strictly the recipient of this conversation
          try {
            await this.notificationService.addNotification({
              userId: targetReceiverId,
              senderId: currentUser.id,
              type: 'mentorship',
              title: `New message from ${currentUser.fullName}`,
              message: text.length > 60 ? `${text.substring(0, 57)}...` : text,
              link: activeConv.participantRole === 'alumni' ? '/alumni/messages' : (activeConv.participantRole === 'recruiter' ? '/recruiter/messages' : '/student/messages'),
              referenceType: 'mentorship_message',
              referenceId: convId
            });
          } catch (notifErr) {
            console.warn('Could not dispatch in-app notification:', notifErr);
          }
        }
      } catch (err: any) {
        this.isSending.set(false);
        console.warn('Network exception while sending message:', err);
        this.markMessageFailed(convId, tempId);
        this.toast.error('Connection Notice', 'Message queued. Click retry to send when back online.');
      }
    } else {
      // Local/Demo Mode: resolve pending after short delay and dispatch notification
      setTimeout(async () => {
        this.messagesSignal.update(store => ({
          ...store,
          [convId]: (store[convId] || []).map(m =>
            m.id === tempId ? { ...m, pending: false } : m
          )
        }));

        try {
          await this.notificationService.addNotification({
            userId: activeConv.participantId,
            senderId: currentUser?.id,
            type: 'mentorship',
            title: `New message from ${currentUser?.fullName || 'Mentee'}`,
            message: text.length > 60 ? `${text.substring(0, 57)}...` : text,
            link: activeConv.participantRole === 'alumni' ? '/student/messages' : '/alumni/messages',
            referenceType: 'mentorship_message',
            referenceId: convId
          });
        } catch {}
      }, 300);
    }
  }

  /**
   * Retries delivering a failed message.
   */
  async retryMessage(msg: ChatMessage) {
    if (!msg || !msg.conversationId) return;

    this.messagesSignal.update(store => ({
      ...store,
      [msg.conversationId]: (store[msg.conversationId] || []).map(m =>
        m.id === msg.id ? { ...m, pending: true, failed: false } : m
      )
    }));

    const client = this.supabase.getClient();
    const currentUser = this.authService.currentUser();

    if (client && currentUser) {
      try {
        const payload: any = {
          conversation_id: msg.conversationId,
          sender_id: currentUser.id,
          receiver_id: msg.receiverId,
          message_text: msg.messageText || msg.content,
          content: msg.content || msg.messageText,
          message_type: msg.messageType || 'text',
          attachment_name: msg.attachmentName || null,
          attachment_url: msg.attachmentUrl || null,
          attachment_size: msg.attachmentSize || null,
          is_read: false,
          sender_name: currentUser.fullName,
          sender_avatar: currentUser.avatarUrl || null,
          sender_role: currentUser.role
        };

        const { data, error } = await client
          .from('messages')
          .insert(payload)
          .select()
          .single();

        if (error) {
          this.markMessageFailed(msg.conversationId, msg.id);
          this.toast.error('Retry Failed', error.message);
        } else if (data) {
          this.messagesSignal.update(store => ({
            ...store,
            [msg.conversationId]: (store[msg.conversationId] || []).map(m =>
              m.id === msg.id ? { ...m, id: data.id, createdAt: data.created_at, pending: false, failed: false } : m
            )
          }));
          this.toast.success('Delivered', 'Message delivered successfully.');
        }
      } catch {
        this.markMessageFailed(msg.conversationId, msg.id);
      }
    } else {
      setTimeout(() => {
        this.messagesSignal.update(store => ({
          ...store,
          [msg.conversationId]: (store[msg.conversationId] || []).map(m =>
            m.id === msg.id ? { ...m, pending: false, failed: false } : m
          )
        }));
      }, 500);
    }
  }

  private markMessageFailed(convId: string, msgId: string) {
    this.messagesSignal.update(store => ({
      ...store,
      [convId]: (store[convId] || []).map(m =>
        m.id === msgId ? { ...m, pending: false, failed: true } : m
      )
    }));
  }

  /**
   * Marks all incoming messages in a conversation as read.
   */
  async markConversationAsRead(convId: string) {
    if (!convId) return;

    const currentUser = this.authService.currentUser();
    const readAtIso = new Date().toISOString();

    // 1. Update local signal state
    this.messagesSignal.update(store => {
      const list = store[convId] || [];
      return {
        ...store,
        [convId]: list.map(m =>
          m.receiverId === currentUser?.id ? { ...m, isRead: true, readAt: readAtIso } : m
        )
      };
    });

    this.conversationsSignal.update(list =>
      list.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
    );

    // 2. Broadcast read status to peer devices
    this.broadcastToPeers({
      type: 'MESSAGES_READ',
      conversationId: convId,
      readerId: currentUser?.id
    });

    // 3. Persist read status in Supabase Database
    const client = this.supabase.getClient();
    if (client && currentUser) {
      try {
        await client
          .from('messages')
          .update({ is_read: true, read_at: readAtIso, updated_at: readAtIso })
          .eq('conversation_id', convId)
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false);
      } catch (err) {
        console.warn('Error updating read status in DB:', err);
      }
    }
  }

  /**
   * Starts or opens a conversation with a specific contact.
   */
  async startConversationWith(participant: {
    id: string;
    name: string;
    avatar?: string;
    role: 'student' | 'alumni' | 'admin' | 'recruiter';
    headline?: string;
  }): Promise<string> {
    const existing = this.conversationsSignal().find(c => c.participantId === participant.id);
    if (existing) {
      this.setActiveConversation(existing.id);
      return existing.id;
    }

    const currentUser = this.authService.currentUser();
    const client = this.supabase.getClient();
    let newConvId = currentUser
      ? `conv-mentorship-${[currentUser.id, participant.id].sort().join('_')}`
      : `conv-${Date.now()}`;

    // If connected to Supabase and both user IDs are valid UUIDs, use get_or_create_mentorship_conversation
    if (client && currentUser && participant.id.length > 30 && currentUser.id.length > 30) {
      try {
        const { data: convIdData, error } = await client.rpc('get_or_create_mentorship_conversation', {
          p_student_id: participant.role === 'student' ? participant.id : currentUser.id,
          p_mentor_id: participant.role === 'alumni' ? participant.id : currentUser.id
        });

        if (!error && convIdData) {
          newConvId = convIdData;
        }
      } catch (rpcErr) {
        console.warn('Could not call get_or_create_mentorship_conversation RPC:', rpcErr);
      }
    }

    const newConv: Conversation = {
      id: newConvId,
      participantId: participant.id,
      participantName: participant.name,
      participantAvatar: participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=3b82f6&color=fff&bold=true`,
      participantRole: participant.role,
      participantHeadline: participant.headline || (participant.role === 'alumni' ? 'Alumni Mentor' : 'Student Mentee'),
      lastMessage: 'Mentorship connection active. Say hi!',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isOnline: true,
      updatedAt: new Date().toISOString()
    };

    this.conversationsSignal.update(list => [newConv, ...list.filter(c => c.id !== newConvId)]);
    await this.setActiveConversation(newConvId);

    this.broadcastToPeers({
      type: 'NEW_CONVERSATION',
      conversation: newConv
    });

    return newConvId;
  }

  /**
   * Handles incoming Realtime message pushed by Supabase.
   */
  private handleIncomingRealtimeMessage(row: any) {
    const convId = row.conversation_id;
    const currentUser = this.authService.currentUser();
    const isMe = currentUser && currentUser.id === row.sender_id;

    const msg: ChatMessage = {
      id: row.id,
      conversationId: convId,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      messageText: row.message_text || row.content || '',
      content: row.content || row.message_text || '',
      messageType: (row.message_type as MessageType) || 'text',
      isRead: row.is_read ?? (row.read_at != null),
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      senderName: row.sender_name || 'Placement User',
      senderAvatar: row.sender_avatar,
      senderRole: row.sender_role || 'student',
      attachmentName: row.attachment_name,
      attachmentUrl: row.attachment_url,
      attachmentSize: row.attachment_size,
      pending: false,
      failed: false
    };

    // 1. Update message signal for this conversation
    this.messagesSignal.update(store => {
      const currentList = store[convId] || [];
      // If already present, don't duplicate
      if (currentList.some(m => m.id === msg.id)) {
        return store;
      }
      return {
        ...store,
        [convId]: [...currentList, msg]
      };
    });

    // 2. Update conversation list snippet and unread counter
    const isViewingThisConv = this.activeConversationIdSignal() === convId;

    this.conversationsSignal.update(list => {
      const match = list.find(c => c.id === convId);
      if (match) {
        return list.map(c => c.id === convId ? {
          ...c,
          lastMessage: msg.messageText || (msg.attachmentName ? `📎 ${msg.attachmentName}` : ''),
          lastMessageTime: 'Just now',
          unreadCount: isMe || isViewingThisConv ? 0 : (c.unreadCount || 0) + 1,
          updatedAt: msg.createdAt
        } : c);
      } else {
        // Conversation not in local list yet, create it dynamically
        const newConv: Conversation = {
          id: convId,
          participantId: isMe ? row.receiver_id : row.sender_id,
          participantName: isMe ? 'Placement Contact' : (row.sender_name || 'Placement Contact'),
          participantAvatar: row.sender_avatar,
          participantRole: row.sender_role || 'student',
          participantHeadline: 'Placement Contact',
          lastMessage: msg.messageText || 'Sent a file',
          lastMessageTime: 'Just now',
          unreadCount: isMe || isViewingThisConv ? 0 : 1,
          isOnline: true,
          updatedAt: msg.createdAt
        };
        return [newConv, ...list];
      }
    });

    // 3. Mark read immediately if viewing this conversation
    if (!isMe && isViewingThisConv) {
      this.markConversationAsRead(convId);
    }

    // 4. If received from someone else and not viewing this chat, notify
    if (!isMe && !isViewingThisConv) {
      this.toast.info(`New Message from ${msg.senderName}`, msg.messageText.substring(0, 50));
    }
  }

  /**
   * Handles Realtime message update (e.g., is_read status update).
   */
  private handleRealtimeMessageUpdate(row: any) {
    const convId = row.conversation_id;
    if (!convId) return;

    this.messagesSignal.update(store => {
      const list = store[convId];
      if (!list) return store;
      return {
        ...store,
        [convId]: list.map(m => m.id === row.id ? {
          ...m,
          isRead: row.is_read ?? (row.read_at != null),
          readAt: row.read_at,
          updatedAt: row.updated_at
        } : m)
      };
    });
  }

  /**
   * Handles Realtime conversation update.
   */
  private handleRealtimeConversationUpdate(row: any) {
    this.conversationsSignal.update(list =>
      list.map(c => c.id === row.id ? {
        ...c,
        lastMessage: row.last_message_text || c.lastMessage,
        lastMessageTime: this.formatMessageTimestamp(row.last_message_at),
        updatedAt: row.updated_at
      } : c)
    );
  }

  /**
   * Handles messages received from peer browser tabs/windows.
   */
  private handleBroadcastEvent(data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'NEW_MESSAGE': {
        const msg = data.message as ChatMessage;
        if (!msg) return;

        this.messagesSignal.update(store => {
          const list = store[msg.conversationId] || [];
          if (list.some(m => m.id === msg.id)) return store;
          return {
            ...store,
            [msg.conversationId]: [...list, msg]
          };
        });

        this.conversationsSignal.update(list =>
          list.map(c => c.id === msg.conversationId ? {
            ...c,
            lastMessage: msg.messageText || msg.content,
            lastMessageTime: 'Just now',
            updatedAt: msg.createdAt
          } : c)
        );
        break;
      }
      case 'MESSAGES_READ': {
        const convId = data.conversationId;
        if (!convId) return;

        this.messagesSignal.update(store => {
          const list = store[convId] || [];
          return {
            ...store,
            [convId]: list.map(m => ({ ...m, isRead: true }))
          };
        });
        break;
      }
      case 'NEW_CONVERSATION': {
        const conv = data.conversation as Conversation;
        if (!conv) return;
        this.conversationsSignal.update(list => {
          if (list.some(c => c.id === conv.id)) return list;
          return [conv, ...list];
        });
        break;
      }
    }
  }

  private broadcastToPeers(payload: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (err) {
        console.warn('Error posting to broadcast channel:', err);
      }
    }
  }

  formatMessageTimestamp(isoString: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
}
