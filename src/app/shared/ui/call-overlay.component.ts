import { Component, inject, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../core/services/call.service';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-call-overlay',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      *ngIf="callService.isInCall()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
    >
      <div class="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[720px]">
        <!-- Top bar with call status, connection type and timer -->
        <div class="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold tracking-wide">
                  {{ callService.activeCall()?.callType === 'video' ? '1-on-1 Video Session' : 'Voice Mentoring Call' }}
                </h4>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  WebRTC P2P
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Connected with {{ callService.activeCall()?.receiverName }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="px-3.5 py-1.5 rounded-full bg-slate-800 text-xs font-mono font-semibold text-emerald-400 border border-slate-700">
              {{ callService.formatDuration(callService.callDuration()) }}
            </div>
          </div>
        </div>

        <!-- Video & Audio Stream Arena -->
        <div class="flex-1 relative bg-slate-950 p-4 flex flex-col sm:flex-row gap-4 items-center justify-center overflow-hidden">
          <!-- Main participant tile (Remote Stream) -->
          <div class="relative flex-1 w-full h-full rounded-2xl bg-slate-800/90 border border-slate-700 overflow-hidden flex flex-col items-center justify-center">
            <!-- Active Remote Video if available -->
            <video
              #remoteVideoRef
              autoplay
              playsinline
              class="w-full h-full object-cover"
              [ngClass]="callService.remoteStream() && callService.activeCall()?.callType === 'video' ? 'block' : 'hidden'"
            ></video>

            <!-- Audio-only or avatar fallback view -->
            <div
              *ngIf="!callService.remoteStream() || callService.activeCall()?.callType === 'audio'"
              class="flex flex-col items-center justify-center p-6 text-center"
            >
              <div class="relative mb-4">
                <img
                  *ngIf="callService.activeCall()?.receiverAvatar"
                  [src]="callService.activeCall()?.receiverAvatar"
                  class="w-28 h-28 rounded-full border-4 border-slate-700 shadow-2xl object-cover"
                />
                <div
                  *ngIf="!callService.activeCall()?.receiverAvatar"
                  class="w-28 h-28 rounded-full bg-purple-700 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-slate-700 shadow-2xl"
                >
                  {{ (callService.activeCall()?.receiverName || 'U').substring(0, 2).toUpperCase() }}
                </div>
                <span class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
              </div>

              <h3 class="text-lg font-bold text-white">{{ callService.activeCall()?.receiverName }}</h3>
              <p class="text-xs text-slate-400 mt-1">
                {{ callService.activeCall()?.status === 'ringing' ? 'Ringing and establishing connection...' : 'Voice call in progress • High definition audio' }}
              </p>

              <!-- Audio Waveform indicator -->
              <div class="flex items-center gap-1.5 mt-4">
                <span class="w-1 h-4 bg-emerald-500 rounded-full animate-bounce"></span>
                <span class="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span class="w-1 h-8 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                <span class="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.45s]"></span>
              </div>
            </div>

            <!-- Remote user label -->
            <div class="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
              <span>{{ callService.activeCall()?.receiverName }}</span>
              <span class="text-[10px] text-slate-400">({{ callService.activeCall()?.receiverRole }})</span>
            </div>
          </div>

          <!-- Local Self PIP tile (Camera Feed) -->
          <div
            *ngIf="callService.activeCall()?.callType === 'video'"
            class="absolute top-6 right-6 w-36 sm:w-52 h-28 sm:h-38 rounded-2xl bg-slate-900 border-2 border-blue-500/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center z-10"
          >
            <!-- Local Video Element -->
            <video
              #localVideoRef
              autoplay
              muted
              playsinline
              class="w-full h-full object-cover"
              [ngClass]="!callService.isVideoOff() && callService.localStream() ? 'block' : 'hidden'"
            ></video>

            <!-- Camera Off Fallback -->
            <div
              *ngIf="callService.isVideoOff() || !callService.localStream()"
              class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-2 text-center"
            >
              <app-icon name="video-off" [size]="22"></app-icon>
              <span class="text-[10px] mt-1 text-slate-400">Camera Paused</span>
            </div>

            <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-white/90 font-medium">
              You {{ callService.isMicMuted() ? '(Muted)' : '' }}
            </div>
          </div>
        </div>

        <!-- Controls Bottom Bar -->
        <div class="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-center gap-4">
          <!-- Mic toggle -->
          <button
            type="button"
            (click)="callService.toggleMic()"
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
            [ngClass]="{
              'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700': !callService.isMicMuted(),
              'bg-rose-600 text-white hover:bg-rose-700': callService.isMicMuted()
            }"
            [title]="callService.isMicMuted() ? 'Unmute microphone' : 'Mute microphone'"
          >
            <app-icon [name]="callService.isMicMuted() ? 'mic-off' : 'mic'" [size]="20"></app-icon>
          </button>

          <!-- Video toggle (only on video calls) -->
          <button
            *ngIf="callService.activeCall()?.callType === 'video'"
            type="button"
            (click)="callService.toggleVideo()"
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
            [ngClass]="{
              'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700': !callService.isVideoOff(),
              'bg-rose-600 text-white hover:bg-rose-700': callService.isVideoOff()
            }"
            [title]="callService.isVideoOff() ? 'Turn camera on' : 'Turn camera off'"
          >
            <app-icon [name]="callService.isVideoOff() ? 'video-off' : 'video'" [size]="20"></app-icon>
          </button>

          <!-- End Call Button -->
          <button
            type="button"
            (click)="callService.endCall()"
            class="px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all duration-200 hover:scale-105"
          >
            <app-icon name="phone-off" [size]="18"></app-icon>
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CallOverlayComponent {
  callService = inject(CallService);

  @ViewChild('localVideoRef') localVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideoRef') remoteVideoRef?: ElementRef<HTMLVideoElement>;

  constructor() {
    // Reactively bind streams to video elements whenever streams change
    effect(() => {
      const local = this.callService.localStream();
      if (this.localVideoRef?.nativeElement && local) {
        this.localVideoRef.nativeElement.srcObject = local;
      }
    });

    effect(() => {
      const remote = this.callService.remoteStream();
      if (this.remoteVideoRef?.nativeElement && remote) {
        this.remoteVideoRef.nativeElement.srcObject = remote;
      }
    });
  }
}
