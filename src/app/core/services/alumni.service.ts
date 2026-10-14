import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import {
  Alumni,
  AlumniConnection,
  ConnectionStatus,
  ContactMethod,
  ContactVisibility
} from '../models/alumni.model';
import { CURATED_ALUMNI } from '../data/curated-alumni';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';
import { StudentService } from './student.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class AlumniService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private chatService = inject(ChatService);

  private readonly LOCAL_STORAGE_KEY = 'careernexus_alumni_cache';
  private readonly CONNECTIONS_STORAGE_KEY = 'careernexus_connections_cache';
  private readonly BROADCAST_CHANNEL_NAME = 'careernexus_alumni_connections';

  private alumniSignal = signal<Alumni[]>(this.loadInitialAlumni());
  private connectionsSignal = signal<AlumniConnection[]>(this.loadInitialConnections());
  isLoading = signal<boolean>(false);
  private realtimeConnectionChannel: any = null;
  private broadcastChannel: BroadcastChannel | null = null;

  alumni = computed(() => this.alumniSignal());
  activeAlumni = computed(() => this.alumniSignal().filter(a => a.isActive !== false));
  connections = computed(() => this.connectionsSignal());

  // Dynamic real counters from state / Supabase
  totalProfessionalsCount = computed(() => this.alumniSignal().length);
  verifiedProfessionalsCount = computed(() =>
    this.alumniSignal().filter(a => a.isVerified && a.isActive !== false).length
  );
  availableMentorsCount = computed(() =>
    this.alumniSignal().filter(a => a.availableForMentoring && a.isActive !== false).length
  );
  myAcceptedConnectionsCount = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 0;
    return this.connectionsSignal().filter(
      c => c.status === 'accepted' && (c.requesterId === user.id || c.receiverId === user.id)
    ).length;
  });

  currentAlumni = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return this.alumniSignal()[0] || CURATED_ALUMNI[0];

    const match = this.alumniSignal().find(
      a => a.userId === user.id || a.email.toLowerCase() === user.email.toLowerCase()
    );

    if (match) return match;

    return {
      id: `a-${user.id}`,
      userId: user.id,
      alumniId: 'ALUM-2022-CSE042',
      fullName: user.fullName,
      email: user.email,
      profilePhoto: user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      graduationYear: 2022,
      department: 'Computer Science & Engineering',
      company: 'Google',
      companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
      designation: 'Senior Software Engineer (L5)',
      experienceYears: 4.5,
      skills: ['C++', 'Distributed Systems', 'Go', 'System Design', 'Algorithms'],
      preferredDomains: ['Software Development', 'Backend Development', 'System Design'],
      industry: 'Software & Cloud',
      location: 'Bengaluru, India',
      mentorshipTopics: ['System Design (HLD & LLD)', 'Distributed Systems Architecture', 'Campus Placement Prep'],
      bio: 'Passionate about distributed storage and cloud infrastructure. Mentoring campus juniors for high-impact product engineering roles.',
      linkedinUrl: 'https://www.linkedin.com/in/gaurav-sen-56b6a941/',
      websiteUrl: 'https://interviewready.io',
      availableForMentoring: true,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      contactVisibility: 'connected_only',
      contactMethods: [
        { type: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/gaurav-sen-56b6a941/', isVisible: true },
        { type: 'website', label: 'Website', url: 'https://interviewready.io', isVisible: true }
      ],
      menteesCount: 28,
      rating: 4.9,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Alumni;
  });

  availableMentors = computed(() =>
    this.alumniSignal().filter(a => a.availableForMentoring && a.isActive !== false)
  );

  // Incoming connection requests for current alumni
  incomingRequests = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.connectionsSignal().filter(
      c => c.receiverId === user.id &&
           (c.connectionType === 'mentorship' || c.requestType === 'mentorship') &&
           c.status === 'pending'
    );
  });

  // Outgoing requests sent by current student
  outgoingRequests = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.connectionsSignal().filter(
      c => c.requesterId === user.id
    );
  });

  // Mentors that the current student has an accepted mentorship connection with
  myApprovedMentors = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.connectionsSignal()
      .filter(
        c => c.status === 'accepted' &&
             (c.connectionType === 'mentorship' || c.requestType === 'mentorship') &&
             (c.requesterId === user.id || c.receiverId === user.id)
      )
      .map(c => {
        const mentorUserId = c.requesterId === user.id ? c.receiverId : c.requesterId;
        const mentorProfile = this.alumniSignal().find(a => a.userId === mentorUserId || a.id === mentorUserId);
        return {
          connectionId: c.id,
          userId: mentorUserId,
          fullName: mentorProfile?.fullName || c.receiverName || 'Alumni Mentor',
          designation: mentorProfile?.designation || 'Mentor',
          company: mentorProfile?.company || '',
          companyLogo: mentorProfile?.companyLogo,
          profilePhoto: mentorProfile?.profilePhoto || c.receiverAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.receiverName || 'Mentor')}&background=7c3aed&color=fff&bold=true`,
          mentorshipTopic: c.mentorshipTopic,
          acceptedAt: c.acceptedAt || c.updatedAt
        };
      });
  });

  // Students that the current alumni mentor has an accepted mentorship connection with
  myApprovedStudents = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.connectionsSignal()
      .filter(
        c => c.status === 'accepted' &&
             (c.connectionType === 'mentorship' || c.requestType === 'mentorship') &&
             (c.receiverId === user.id || c.requesterId === user.id)
      )
      .map(c => {
        const studentUserId = c.receiverId === user.id ? c.requesterId : c.receiverId;
        return {
          connectionId: c.id,
          userId: studentUserId,
          fullName: c.requesterName || 'Student Mentee',
          department: c.requesterDepartment || 'Computer Science',
          program: c.requesterProgram || 'B.Tech',
          graduationYear: c.requesterGraduationYear || 2027,
          profilePhoto: c.requesterAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.requesterName || 'Student')}&background=2563eb&color=fff&bold=true`,
          mentorshipTopic: c.mentorshipTopic,
          reason: c.reason,
          skills: c.requesterSkills || [],
          acceptedAt: c.acceptedAt || c.updatedAt
        };
      });
  });

  constructor() {
    this.initBroadcastChannel();
    this.initAlumniSystem();
  }

  ngOnDestroy() {
    if (this.realtimeConnectionChannel) {
      this.realtimeConnectionChannel.unsubscribe();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }

  private initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(this.BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastEvent(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }
  }

  private handleBroadcastEvent(data: any) {
    if (!data || !data.type) return;
    if (data.type === 'CONNECTION_INSERTED' && data.connection) {
      const conn = data.connection as AlumniConnection;
      this.connectionsSignal.update(list => {
        if (list.some(c => c.id === conn.id)) return list;
        return [conn, ...list];
      });
      this.saveConnectionsToCache(this.connectionsSignal());
    } else if (data.type === 'CONNECTION_UPDATED' && data.connection) {
      const conn = data.connection as AlumniConnection;
      this.connectionsSignal.update(list =>
        list.map(c => c.id === conn.id ? conn : c)
      );
      this.saveConnectionsToCache(this.connectionsSignal());
    }
  }

  private broadcastToPeers(payload: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (err) {
        console.warn('Error posting to connection broadcast channel:', err);
      }
    }
  }

  private async initAlumniSystem() {
    await Promise.all([
      this.fetchAlumniFromDatabase(),
      this.fetchConnectionsFromDatabase()
    ]);
    this.setupRealtimeConnections();
  }

  private loadInitialAlumni(): Alumni[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return CURATED_ALUMNI;
  }

  private loadInitialConnections(): AlumniConnection[] {
    try {
      const stored = localStorage.getItem(this.CONNECTIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveAlumniToCache(list: Alumni[]) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private saveConnectionsToCache(list: AlumniConnection[]) {
    try {
      localStorage.setItem(this.CONNECTIONS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private setupRealtimeConnections() {
    if (!this.supabase.client) return;

    this.realtimeConnectionChannel = this.supabase.subscribeToChanges('connections', (payload) => {
      const user = this.authService.currentUser();
      if (!user) return;

      if (payload.eventType === 'INSERT' && payload.new) {
        const row = payload.new;
        if (row.receiver_id === user.id || row.requester_id === user.id) {
          const conn = this.mapDbRowToConnection(row);
          this.connectionsSignal.update(list => {
            if (list.some(c => c.id === conn.id)) return list;
            return [conn, ...list];
          });
          this.saveConnectionsToCache(this.connectionsSignal());

          if (row.receiver_id === user.id) {
            this.toast.info('New Connection Request', `${row.requester_name || 'A student'} requested mentorship guidance.`);
          }
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const row = payload.new;
        if (row.receiver_id === user.id || row.requester_id === user.id) {
          const updated = this.mapDbRowToConnection(row);
          this.connectionsSignal.update(list =>
            list.map(c => (c.id === updated.id ? updated : c))
          );
          this.saveConnectionsToCache(this.connectionsSignal());

          if (row.requester_id === user.id && row.status === 'accepted') {
            this.toast.success('Mentorship Request Accepted! 🎉', `Your mentorship request with ${row.receiver_name || 'Mentor'} was accepted.`);
          } else if (row.requester_id === user.id && row.status === 'rejected') {
            this.toast.warning('Mentorship Request Update', `${row.receiver_name || 'Alumni'} rejected your mentorship request.`);
          }
        }
      }
    });
  }

  async fetchAlumniFromDatabase() {
    const client = this.supabase.getClient();
    if (!client) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await client
        .from('alumni')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch alumni from Supabase, retaining curated verified profiles:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const dbAlumni: Alumni[] = data.map((d: any) => this.mapDbRowToAlumni(d));

        // Merge: keep all curated verified alumni and overlay/append DB records
        const alumniMap = new Map<string, Alumni>();
        CURATED_ALUMNI.forEach(a => alumniMap.set(a.userId, a));
        dbAlumni.forEach(a => alumniMap.set(a.userId, a));

        const merged = Array.from(alumniMap.values());
        this.alumniSignal.set(merged);
        this.saveAlumniToCache(merged);
      }
    } catch (e) {
      console.warn('Alumni fetch exception:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapDbRowToAlumni(row: any): Alumni {
    return {
      id: row.id,
      userId: row.user_id,
      alumniId: row.alumni_id || '',
      fullName: row.full_name,
      email: row.email,
      profilePhoto: row.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: row.phone || '',
      graduationYear: row.graduation_year || 2022,
      department: row.department || 'Computer Science & Engineering',
      departmentId: row.department_id,
      batchId: row.batch_id,
      company: row.company || 'Tech Leader',
      companyId: row.company_id,
      companyLogo: row.company_logo || '',
      designation: row.designation || 'Software Engineer',
      experienceYears: Number(row.experience_years) || 3.0,
      skills: row.skills || ['System Design', 'Algorithms', 'Java'],
      preferredDomains: row.preferred_domains || ['Software Development'],
      industry: row.industry || 'Information Technology',
      location: row.location || 'Bengaluru, India',
      mentorshipTopics: row.mentorship_topics || ['System Design', 'Backend Architecture', 'Career Guidance'],
      bio: row.bio || '',
      linkedinUrl: row.linkedin_url || '',
      githubUrl: row.github_url || '',
      portfolioUrl: row.portfolio_url || '',
      websiteUrl: row.website_url || '',
      isVerified: row.is_verified ?? true,
      verifiedAt: row.verified_at || row.created_at,
      contactVisibility: (row.contact_visibility as ContactVisibility) || 'connected_only',
      contactMethods: (row.contact_methods as ContactMethod[]) || [
        ...(row.linkedin_url ? [{ type: 'linkedin' as const, label: 'LinkedIn', url: row.linkedin_url, isVisible: true }] : []),
        ...(row.website_url ? [{ type: 'website' as const, label: 'Website', url: row.website_url, isVisible: true }] : [])
      ],
      contactPreference: row.contact_preference || 'CareerNexus Chat & Video',
      availableForMentoring: row.available_for_mentoring ?? true,
      menteesCount: row.mentees_count || 0,
      rating: Number(row.rating) || 5.0,
      isActive: row.is_active ?? true,
      customFields: row.custom_fields || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async fetchConnectionsFromDatabase() {
    const user = this.authService.currentUser();
    const client = this.supabase.getClient();
    if (!client || !user) return;

    try {
      const { data, error } = await client
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch connections from Supabase:', error.message);
        return;
      }

      if (data) {
        const mapped: AlumniConnection[] = data.map((d: any) => this.mapDbRowToConnection(d));
        this.connectionsSignal.set(mapped);
        this.saveConnectionsToCache(mapped);
      }
    } catch (err) {
      console.warn('Connections fetch exception:', err);
    }
  }

  private mapDbRowToConnection(row: any): AlumniConnection {
    return {
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name || 'Student Candidate',
      requesterAvatar: row.requester_avatar,
      requesterDepartment: row.requester_department || 'Computer Science & Engineering',
      requesterProgram: row.requester_program || 'B.Tech',
      requesterGraduationYear: row.requester_graduation_year || 2027,
      requesterSkills: row.requester_skills || ['Java', 'Data Structures', 'SQL'],
      receiverId: row.receiver_id,
      receiverName: row.receiver_name || 'Alumni Mentor',
      receiverAvatar: row.receiver_avatar,
      requestType: row.request_type || row.connection_type || 'mentorship',
      connectionType: row.connection_type || row.request_type || 'mentorship',
      mentorshipTopic: row.mentorship_topic || 'Career Guidance & Interview Prep',
      reason: row.reason || '',
      message: row.message || '',
      status: (row.status as ConnectionStatus) || 'pending',
      createdAt: row.created_at,
      acceptedAt: row.accepted_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Determine connection status between current user and an alumni
   */
  getConnectionStatus(alumniUserId: string): ConnectionStatus | 'none' {
    const user = this.authService.currentUser();
    if (!user) return 'none';

    const conn = this.connectionsSignal().find(
      c => (c.requesterId === user.id && c.receiverId === alumniUserId) ||
           (c.receiverId === user.id && c.requesterId === alumniUserId)
    );

    return conn ? conn.status : 'none';
  }

  /**
   * Check if an active, accepted connection exists between current user and target user
   */
  isConnectionAccepted(targetUserId: string): boolean {
    return this.getConnectionStatus(targetUserId) === 'accepted';
  }

  /**
   * Send a Connection / Mentorship request
   */
  async sendConnectionRequest(params: {
    receiverId: string;
    mentorshipTopic: string;
    reason: string;
    message?: string;
  }): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) {
      this.toast.warning('Authentication Required', 'Please sign in to connect with alumni.');
      return false;
    }

    const currentStatus = this.getConnectionStatus(params.receiverId);
    if (currentStatus === 'pending') {
      this.toast.info('Request Already Sent', 'A connection request is already pending with this professional.');
      return false;
    }
    if (currentStatus === 'accepted') {
      this.toast.info('Already Connected', 'You are already connected with this professional.');
      return false;
    }

    const targetAlumni = this.alumniSignal().find(a => a.userId === params.receiverId);
    const student = this.studentService.currentStudent();

    const client = this.supabase.getClient();

    // Check Supabase for existing pending or accepted request to prevent duplicates
    if (client) {
      try {
        const { data: existingDbConn } = await client
          .from('connections')
          .select('id, status')
          .eq('requester_id', user.id)
          .eq('receiver_id', params.receiverId)
          .maybeSingle();

        if (existingDbConn) {
          if (existingDbConn.status === 'pending') {
            this.toast.info('Request Already Sent', 'A connection request is already pending with this professional.');
            return false;
          }
          if (existingDbConn.status === 'accepted') {
            this.toast.info('Already Connected', 'You are already connected with this professional.');
            return false;
          }
        }
      } catch (err) {
        console.warn('Could not check existing DB connection:', err);
      }
    }

    const newConn: AlumniConnection = {
      id: `conn-${Date.now()}`,
      requesterId: user.id,
      requesterName: student?.fullName || user.fullName,
      requesterAvatar: student?.profilePhoto || user.avatarUrl,
      requesterDepartment: student?.department || 'Computer Science & Engineering',
      requesterProgram: student?.course || 'B.Tech',
      requesterGraduationYear: student?.graduationYear || 2027,
      requesterSkills: student?.skills || ['Java', 'Data Structures', 'System Design'],
      receiverId: params.receiverId,
      receiverName: targetAlumni?.fullName || 'Alumni Mentor',
      receiverAvatar: targetAlumni?.profilePhoto,
      requestType: 'mentorship',
      connectionType: 'mentorship',
      mentorshipTopic: params.mentorshipTopic,
      reason: params.reason,
      message: params.message || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert to Supabase DB
    if (client) {
      try {
        const { data, error } = await client
          .from('connections')
          .insert({
            requester_id: user.id,
            receiver_id: params.receiverId,
            request_type: 'mentorship',
            connection_type: 'mentorship',
            mentorship_topic: params.mentorshipTopic,
            reason: params.reason,
            message: params.message || '',
            status: 'pending',
            requester_name: newConn.requesterName,
            requester_avatar: newConn.requesterAvatar,
            requester_department: newConn.requesterDepartment,
            requester_program: newConn.requesterProgram,
            requester_graduation_year: newConn.requesterGraduationYear,
            requester_skills: newConn.requesterSkills,
            receiver_name: newConn.receiverName,
            receiver_avatar: newConn.receiverAvatar
          })
          .select()
          .single();

        if (error) {
          console.warn('Error inserting connection into DB:', error.message);
        } else if (data) {
          newConn.id = data.id;
        }
      } catch (err) {
        console.warn('DB connection insertion exception:', err);
      }
    }

    // Update in-memory signal
    this.connectionsSignal.update(list => [newConn, ...list.filter(c => c.id !== newConn.id)]);
    this.saveConnectionsToCache(this.connectionsSignal());

    // Broadcast to peer browser tabs
    this.broadcastToPeers({
      type: 'CONNECTION_INSERTED',
      connection: newConn
    });

    // Send dynamic notification to the alumni mentor
    await this.notificationService.addNotification({
      userId: params.receiverId,
      senderId: user.id,
      type: 'mentorship',
      title: `New mentorship request from ${newConn.requesterName}`,
      message: `${newConn.requesterName} sent you a mentorship request for "${params.mentorshipTopic}".`,
      referenceType: 'mentorship',
      referenceId: newConn.id,
      link: '/alumni/dashboard'
    });

    this.toast.success(
      'Request Sent',
      `Mentorship connection request sent to ${targetAlumni?.fullName || 'the professional'}.`
    );
    return true;
  }

  /**
   * Accept an incoming connection request
   */
  async acceptConnection(connectionId: string): Promise<void> {
    const conn = this.connectionsSignal().find(c => c.id === connectionId);
    if (!conn) return;

    const acceptedAt = new Date().toISOString();
    const updatedConn: AlumniConnection = {
      ...conn,
      status: 'accepted',
      acceptedAt,
      updatedAt: acceptedAt
    };

    this.connectionsSignal.update(list =>
      list.map(c => (c.id === connectionId ? updatedConn : c))
    );
    this.saveConnectionsToCache(this.connectionsSignal());

    // Broadcast to peer browser tabs
    this.broadcastToPeers({
      type: 'CONNECTION_UPDATED',
      connection: updatedConn
    });

    // Update Supabase Database
    const client = this.supabase.getClient();
    if (client && !connectionId.startsWith('conn-')) {
      try {
        await client
          .from('connections')
          .update({
            status: 'accepted',
            accepted_at: acceptedAt,
            updated_at: acceptedAt
          })
          .eq('id', connectionId);
      } catch (err) {
        console.warn('Error updating connection in DB:', err);
      }
    }

    // Automatically create / enable conversation between Student and Alumni
    try {
      await this.chatService.startConversationWith({
        id: conn.requesterId,
        name: conn.requesterName || 'Student Candidate',
        avatar: conn.requesterAvatar,
        role: 'student',
        headline: `${conn.requesterDepartment || 'Candidate'} (Mentee)`
      });
    } catch (chatErr) {
      console.warn('Could not auto-start conversation on connection acceptance:', chatErr);
    }

    // Notify the student
    const currentUser = this.authService.currentUser();
    const alumniName = currentUser?.fullName || conn.receiverName || 'Alumni Mentor';
    await this.notificationService.addNotification({
      userId: conn.requesterId,
      senderId: currentUser?.id,
      type: 'mentorship',
      title: `${alumniName} accepted your mentorship request.`,
      message: `Your mentorship request was accepted! 1-on-1 chat and video mentoring are now active.`,
      referenceType: 'mentorship',
      referenceId: conn.id,
      link: '/student/messages'
    });

    this.toast.success('Connection Accepted', `You are now connected with ${conn.requesterName || 'the student'}.`);
  }

  /**
   * Reject an incoming connection request
   */
  async rejectConnection(connectionId: string): Promise<void> {
    const conn = this.connectionsSignal().find(c => c.id === connectionId);
    if (!conn) return;

    const updatedAt = new Date().toISOString();
    const updatedConn: AlumniConnection = {
      ...conn,
      status: 'rejected',
      updatedAt
    };

    this.connectionsSignal.update(list =>
      list.map(c => (c.id === connectionId ? updatedConn : c))
    );
    this.saveConnectionsToCache(this.connectionsSignal());

    // Broadcast to peer browser tabs
    this.broadcastToPeers({
      type: 'CONNECTION_UPDATED',
      connection: updatedConn
    });

    // Update Supabase
    const client = this.supabase.getClient();
    if (client && !connectionId.startsWith('conn-')) {
      try {
        await client
          .from('connections')
          .update({
            status: 'rejected',
            updated_at: updatedAt
          })
          .eq('id', connectionId);
      } catch (err) {
        console.warn('Error rejecting connection in DB:', err);
      }
    }

    // Notify the student about rejection
    const currentUser = this.authService.currentUser();
    const alumniName = currentUser?.fullName || conn.receiverName || 'Alumni Mentor';
    await this.notificationService.addNotification({
      userId: conn.requesterId,
      senderId: currentUser?.id,
      type: 'mentorship',
      title: `${alumniName} rejected your mentorship request.`,
      message: `Your mentorship request was not accepted at this time. You can explore other verified mentors in the network.`,
      referenceType: 'mentorship',
      referenceId: conn.id,
      link: '/student/alumni'
    });

    this.toast.info('Request Declined', `Connection request from ${conn.requesterName || 'the student'} was declined.`);
  }

  /**
   * Update alumni contact options and privacy settings
   */
  async updateContactSettings(visibility: ContactVisibility, methods: ContactMethod[]): Promise<void> {
    const current = this.currentAlumni();
    const updated = {
      ...current,
      contactVisibility: visibility,
      contactMethods: methods,
      updatedAt: new Date().toISOString()
    };

    this.alumniSignal.update(list =>
      list.map(a => (a.userId === current.userId ? updated : a))
    );
    this.saveAlumniToCache(this.alumniSignal());

    const client = this.supabase.getClient();
    if (client) {
      try {
        await client
          .from('alumni')
          .update({
            contact_visibility: visibility,
            contact_methods: methods,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', current.userId);
      } catch (err) {
        console.warn('Error updating contact settings in DB:', err);
      }
    }

    this.toast.success('Contact Preferences Saved', 'Your professional contact options have been updated.');
  }

  getAlumniById(id: string): Alumni | undefined {
    return this.alumniSignal().find(a => a.id === id || a.userId === id);
  }

  async toggleMentoringAvailability(available: boolean) {
    const current = this.currentAlumni();
    const updated = { ...current, availableForMentoring: available, updatedAt: new Date().toISOString() };

    this.alumniSignal.update(list => list.map(a => (a.userId === current.userId ? updated : a)));
    this.saveAlumniToCache(this.alumniSignal());

    const client = this.supabase.getClient();
    if (client) {
      try {
        await client
          .from('alumni')
          .update({
            available_for_mentoring: available,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', current.userId);
      } catch (err) {
        console.warn('Toggle mentoring DB error:', err);
      }
    }

    this.toast.info('Mentoring Status Updated', available ? 'You are now open for student mentorship.' : 'Mentorship requests temporarily paused.');
  }

  async updateProfile(profile: Partial<Alumni>) {
    const current = this.currentAlumni();
    const updated = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString()
    };

    this.alumniSignal.update(list => list.map(a => (a.userId === current.userId ? updated : a)));
    this.saveAlumniToCache(this.alumniSignal());

    const client = this.supabase.getClient();
    if (client) {
      try {
        const payload: any = {
          full_name: updated.fullName,
          company: updated.company,
          designation: updated.designation,
          experience_years: updated.experienceYears,
          skills: updated.skills,
          bio: updated.bio,
          linkedin_url: updated.linkedinUrl,
          website_url: updated.websiteUrl,
          industry: updated.industry,
          location: updated.location,
          mentorship_topics: updated.mentorshipTopics,
          contact_visibility: updated.contactVisibility,
          contact_methods: updated.contactMethods,
          available_for_mentoring: updated.availableForMentoring,
          updated_at: new Date().toISOString()
        };

        await client
          .from('alumni')
          .update(payload)
          .eq('user_id', current.userId);
      } catch (err) {
        console.warn('Update alumni profile DB error:', err);
      }
    }

    this.toast.success('Alumni Profile Saved', 'Your professional journey details have been updated.');
  }

  addAlumniDirectly(alumnus: Alumni) {
    this.alumniSignal.update(list => [alumnus, ...list.filter(a => a.id !== alumnus.id && a.userId !== alumnus.userId)]);
    this.saveAlumniToCache(this.alumniSignal());
  }

  updateAlumniDirectly(id: string, updates: Partial<Alumni>) {
    this.alumniSignal.update(list =>
      list.map(a => (a.id === id || a.userId === id) ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)
    );
    this.saveAlumniToCache(this.alumniSignal());
  }

  removeAlumniDirectly(id: string) {
    this.alumniSignal.update(list => list.filter(a => a.id !== id && a.userId !== id));
    this.saveAlumniToCache(this.alumniSignal());
  }
}
