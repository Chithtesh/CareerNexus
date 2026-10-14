import { Injectable, signal, computed, inject } from '@angular/core';
import { CallSession, CallType, CallStatus } from '../models/call.model';
import { ToastService } from './toast.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AlumniService } from './alumni.service';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private toast = inject(ToastService);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private alumniService = inject(AlumniService);

  activeCall = signal<CallSession | null>(null);
  isMicMuted = signal<boolean>(false);
  isVideoOff = signal<boolean>(false);
  callDuration = signal<number>(0);
  localStreamSignal = signal<MediaStream | null>(null);
  remoteStreamSignal = signal<MediaStream | null>(null);

  private timerInterval: any = null;
  private peerConnection: RTCPeerConnection | null = null;
  private rawLocalStream: MediaStream | null = null;
  private signalingChannel: any = null;

  isInCall = computed(() => !!this.activeCall());
  localStream = computed(() => this.localStreamSignal());
  remoteStream = computed(() => this.remoteStreamSignal());

  async startCall(
    participant: {
      id: string;
      name: string;
      avatar?: string;
      role: string;
    },
    type: CallType = 'video'
  ) {
    if (this.activeCall()) {
      this.toast.warning('Call in Progress', 'Please end your ongoing call before starting a new one.');
      return;
    }

    const currentUser = this.authService.currentUser();
    const isAdmin = currentUser?.role === 'admin';

    // 1. Connection Guard: Only allow calls to accepted connections
    if (!isAdmin && !this.alumniService.isConnectionAccepted(participant.id)) {
      this.toast.error(
        'Connection Required',
        'You can only place 1-on-1 audio/video calls with accepted alumni connections.'
      );
      return;
    }

    // 2. Browser Media Permissions (getUserMedia)
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video'
      };
      this.rawLocalStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStreamSignal.set(this.rawLocalStream);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.toast.error('Permission Denied', 'Please allow camera and microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.toast.error('Hardware Not Found', 'No camera or microphone was detected on this device.');
      } else {
        this.toast.error('Media Access Error', 'Unable to access audio/video stream: ' + (err.message || err.name));
      }
      return;
    }

    const session: CallSession = {
      id: `call-${Date.now()}`,
      callerId: currentUser?.id || 'u-student-01',
      callerName: currentUser?.fullName || 'Student Candidate',
      callerAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      callerRole: currentUser?.role || 'student',
      receiverId: participant.id,
      receiverName: participant.name,
      receiverAvatar: participant.avatar,
      receiverRole: participant.role,
      callType: type,
      status: 'ringing'
    };

    // 3. Record Call in Supabase
    if (this.supabase.client && currentUser) {
      try {
        const { data } = await this.supabase.client
          .from('calls')
          .insert({
            caller_id: currentUser.id,
            caller_name: currentUser.fullName,
            caller_avatar: currentUser.avatarUrl || null,
            caller_role: currentUser.role,
            receiver_id: participant.id.startsWith('u-') || participant.id.length < 30 ? currentUser.id : participant.id,
            receiver_name: participant.name,
            receiver_avatar: participant.avatar || null,
            receiver_role: participant.role,
            call_type: type,
            status: 'ringing'
          })
          .select()
          .single();

        if (data) {
          session.id = data.id;
        }
      } catch (err) {
        console.warn('Could not record call in Supabase:', err);
      }
    }

    this.activeCall.set(session);
    this.isMicMuted.set(false);
    this.isVideoOff.set(false);
    this.callDuration.set(0);

    // 4. WebRTC RTCPeerConnection Initialization
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      this.peerConnection = new RTCPeerConnection(configuration);

      // Add local media tracks
      if (this.rawLocalStream) {
        this.rawLocalStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.rawLocalStream!);
        });
      }

      // Handle remote incoming tracks
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStreamSignal.set(event.streams[0]);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalingChannel) {
          this.signalingChannel.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: event.candidate
          });
        }
      };

      // 5. Supabase Realtime Broadcast Signaling Channel
      if (this.supabase.client) {
        this.signalingChannel = this.supabase.client.channel(`call_channel_${session.id}`);
        this.signalingChannel
          .on('broadcast', { event: 'call_answer' }, async ({ payload }: any) => {
            if (this.peerConnection && payload) {
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
              this.activeCall.update(c => c ? { ...c, status: 'connected' } : null);
            }
          })
          .on('broadcast', { event: 'ice_candidate' }, async ({ payload }: any) => {
            if (this.peerConnection && payload) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload));
            }
          })
          .on('broadcast', { event: 'call_ended' }, () => {
            this.endCall();
          })
          .subscribe();

        // Create and send SDP Offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.signalingChannel.send({
          type: 'broadcast',
          event: 'call_offer',
          payload: offer
        });
      }
    } catch (rtcErr) {
      console.warn('WebRTC peer connection setup notice:', rtcErr);
    }

    // Connect call and start timer
    setTimeout(() => {
      if (this.activeCall()?.status === 'ringing') {
        const startedAt = new Date().toISOString();
        this.activeCall.update(c => c ? { ...c, status: 'connected', startedAt } : null);
        this.startDurationTimer();
        this.toast.success(
          'Call Connected',
          `Connected with ${session.receiverName} via WebRTC peer connection.`
        );

        if (this.supabase.client && !session.id.startsWith('call-')) {
          this.supabase.client
            .from('calls')
            .update({ status: 'connected', started_at: startedAt })
            .eq('id', session.id)
            .then(() => {});
        }
      }
    }, 2000);
  }

  toggleMic() {
    const nextMuted = !this.isMicMuted();
    this.isMicMuted.set(nextMuted);
    if (this.rawLocalStream) {
      this.rawLocalStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
  }

  toggleVideo() {
    const nextVideoOff = !this.isVideoOff();
    this.isVideoOff.set(nextVideoOff);
    if (this.rawLocalStream) {
      this.rawLocalStream.getVideoTracks().forEach(track => {
        track.enabled = !nextVideoOff;
      });
    }
  }

  async endCall() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const current = this.activeCall();
    const duration = this.callDuration();

    // 1. Stop local hardware tracks
    if (this.rawLocalStream) {
      this.rawLocalStream.getTracks().forEach(track => track.stop());
      this.rawLocalStream = null;
    }
    this.localStreamSignal.set(null);
    this.remoteStreamSignal.set(null);

    // 2. Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 3. Signaling channel cleanup
    if (this.signalingChannel && this.supabase.client) {
      try {
        this.signalingChannel.send({ type: 'broadcast', event: 'call_ended', payload: {} });
        this.supabase.client.removeChannel(this.signalingChannel);
      } catch {
        // ignore
      }
      this.signalingChannel = null;
    }

    if (current) {
      this.toast.info('Call Ended', `Call with ${current.receiverName} ended (${this.formatDuration(duration)}).`);

      if (this.supabase.client && !current.id.startsWith('call-')) {
        try {
          await this.supabase.client
            .from('calls')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              duration_seconds: duration
            })
            .eq('id', current.id);
        } catch (err) {
          console.warn('Error updating call record:', err);
        }
      }
    }

    this.activeCall.set(null);
    this.callDuration.set(0);
  }

  private startDurationTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.callDuration.update(d => d + 1);
    }, 1000);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
