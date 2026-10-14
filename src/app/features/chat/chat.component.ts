import { Component, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { CallService } from '../../core/services/call.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { ChatMessage } from '../../core/models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="h-[calc(100vh-8.5rem)] bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-300">
      
      <!-- Left Sidebar: Conversations List -->
      <div
        class="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-white"
        [ngClass]="mobileChatOpen() ? 'hidden md:flex' : 'flex'"
      >
        <!-- Header & Search -->
        <div class="p-4 border-b border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900">{{ listHeaderTitle() }}</h2>
              <span class="w-2 h-2 rounded-full" [ngClass]="chatService.isOnline() ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            </div>
            <span
              class="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              [ngClass]="portalRole() === 'alumni' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' : 'bg-blue-50 text-blue-700 border border-blue-200/60'"
            >
              {{ chatService.conversations().length }} Approved
            </span>
          </div>

          <div class="relative">
            <app-icon name="search" [size]="16" customClass="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              [placeholder]="searchPlaceholder()"
              class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
        </div>

        <!-- Connection Notice Banner if offline -->
        <div
          *ngIf="!chatService.isOnline()"
          class="px-4 py-2 bg-amber-50 border-b border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2"
        >
          <app-icon name="alert-triangle" [size]="14" customClass="text-amber-600 shrink-0"></app-icon>
          <span>Offline mode. Messages will deliver when back online.</span>
        </div>

        <!-- Conversations Stream -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          <div
            *ngFor="let conv of filteredConversations()"
            (click)="selectConversation(conv.id)"
            class="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative group"
            [ngClass]="chatService.activeConversationId() === conv.id ? (portalRole() === 'alumni' ? 'bg-purple-50/70 border-l-4 border-purple-600' : 'bg-blue-50/70 border-l-4 border-blue-600') : ''"
          >
            <div class="relative shrink-0">
              <img
                [src]="conv.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                [alt]="conv.participantName"
                (error)="onAvatarError($event, conv.participantName)"
                class="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <span
                *ngIf="conv.isOnline"
                class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20"
                title="Online"
              ></span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <h4 class="text-xs font-bold text-slate-900 truncate">{{ conv.participantName }}</h4>
                  <span
                    class="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md shrink-0"
                    [ngClass]="{
                      'bg-purple-100 text-purple-700': conv.participantRole === 'alumni',
                      'bg-indigo-100 text-indigo-700': conv.participantRole === 'recruiter',
                      'bg-emerald-100 text-emerald-700': conv.participantRole === 'admin',
                      'bg-blue-100 text-blue-700': conv.participantRole === 'student'
                    }"
                  >
                    {{ conv.participantRole }}
                  </span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono shrink-0">{{ conv.lastMessageTime }}</span>
              </div>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">{{ conv.participantHeadline }}</p>
              <p
                class="text-xs text-slate-600 truncate mt-1"
                [ngClass]="conv.unreadCount > 0 ? 'font-semibold text-slate-950' : 'text-slate-500'"
              >
                {{ conv.lastMessage }}
              </p>
            </div>

            <!-- Unread Badge -->
            <span
              *ngIf="conv.unreadCount > 0"
              class="w-5 h-5 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 self-center shadow-xs"
              [ngClass]="portalRole() === 'alumni' ? 'bg-purple-600' : 'bg-blue-600'"
            >
              {{ conv.unreadCount }}
            </span>
          </div>

          <!-- Empty search or no approved contacts state -->
          <div
            *ngIf="filteredConversations().length === 0"
            class="p-6 text-center text-xs text-slate-400 space-y-3"
          >
            <!-- Search yielded no results -->
            <ng-container *ngIf="searchQuery.trim()">
              <app-icon name="search" [size]="24" customClass="mx-auto text-slate-300"></app-icon>
              <p class="font-semibold text-slate-700">No matching contacts found</p>
              <p class="text-[11px] text-slate-400">Try searching a different name or topic</p>
            </ng-container>

            <!-- Student: No approved mentors yet -->
            <ng-container *ngIf="!searchQuery.trim() && portalRole() === 'student'">
              <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
                <app-icon name="users" [size]="24"></app-icon>
              </div>
              <p class="font-bold text-slate-800 text-sm">No Approved Mentors Yet</p>
              <p class="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                You do not have any accepted mentorship connections yet. Explore the verified directory and send connection requests to start chatting.
              </p>
              <a
                routerLink="/student/alumni"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <app-icon name="user-plus" [size]="14"></app-icon>
                <span>Browse Alumni Mentors</span>
              </a>
            </ng-container>

            <!-- Alumni: No approved students yet -->
            <ng-container *ngIf="!searchQuery.trim() && portalRole() === 'alumni'">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <app-icon name="user-check" [size]="24"></app-icon>
              </div>
              <p class="font-bold text-slate-800 text-sm">No Approved Students Yet</p>
              <p class="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                You don't have any active student mentees. Check your dashboard to accept incoming student connection requests.
              </p>
              <a
                routerLink="/alumni/dashboard"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>Review Pending Requests</span>
              </a>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Right Main Chat Arena -->
      <div
        class="flex-1 flex flex-col bg-slate-50/50 min-w-0 h-full"
        [ngClass]="!mobileChatOpen() ? 'hidden md:flex' : 'flex'"
      >
        <!-- Chat Header (Active Conversation) -->
        <ng-container *ngIf="chatService.activeConversation() as activeConv; else noActiveConvTemplate">
          <div class="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
            <div class="flex items-center gap-3 min-w-0">
              <!-- Mobile back button -->
              <button
                type="button"
                (click)="mobileChatOpen.set(false)"
                class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg md:hidden"
                aria-label="Back to contacts list"
              >
                <app-icon name="arrow-left" [size]="18"></app-icon>
              </button>

              <div class="relative shrink-0">
                <img
                  [src]="activeConv.participantAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'"
                  [alt]="activeConv.participantName"
                  (error)="onAvatarError($event, activeConv.participantName)"
                  class="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                />
                <span
                  *ngIf="activeConv.isOnline"
                  class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20"
                  title="Online"
                ></span>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 truncate">{{ activeConv.participantName }}</h3>
                  <span
                    class="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full"
                    [ngClass]="{
                      'bg-purple-100 text-purple-700': activeConv.participantRole === 'alumni',
                      'bg-indigo-100 text-indigo-700': activeConv.participantRole === 'recruiter',
                      'bg-emerald-100 text-emerald-700': activeConv.participantRole === 'admin',
                      'bg-blue-100 text-blue-700': activeConv.participantRole === 'student'
                    }"
                  >
                    {{ activeConv.participantRole }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 truncate">{{ activeConv.participantHeadline }}</p>
              </div>
            </div>

            <!-- Video / Audio Calling Controls -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="startCall('audio')"
                class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
                title="Start Voice Call"
              >
                <app-icon name="phone" [size]="17"></app-icon>
              </button>
              <button
                type="button"
                (click)="startCall('video')"
                class="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors shadow-2xs"
                title="Start 1-on-1 Video Session"
              >
                <app-icon name="video" [size]="17"></app-icon>
              </button>
            </div>
          </div>

          <!-- Message History Arena (STRICT CONVERSATION ISOLATION) -->
          <div
            #messagesContainer
            class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/50"
          >
            <div
              *ngFor="let msg of chatService.activeMessages()"
              class="flex items-end gap-2.5"
              [ngClass]="msg.senderId === authService.currentUser()?.id ? 'justify-end' : 'justify-start'"
            >
              <!-- Avatar for other user -->
              <img
                *ngIf="msg.senderId !== authService.currentUser()?.id"
                [src]="msg.senderAvatar || activeConv.participantAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'"
                [alt]="msg.senderName"
                (error)="onAvatarError($event, msg.senderName)"
                class="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs mb-0.5"
              />

              <!-- Message Bubble -->
              <div
                class="max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all"
                [ngClass]="
                  msg.senderId === authService.currentUser()?.id
                    ? (portalRole() === 'alumni' ? 'bg-purple-600 text-white rounded-br-xs' : 'bg-blue-600 text-white rounded-br-xs')
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                "
              >
                <p class="whitespace-pre-wrap break-words">{{ msg.messageText || msg.content }}</p>

                <!-- Attachment pill if present -->
                <div
                  *ngIf="msg.attachmentName"
                  class="mt-2.5 p-2 rounded-xl flex items-center gap-2 border"
                  [ngClass]="
                    msg.senderId === authService.currentUser()?.id
                      ? (portalRole() === 'alumni' ? 'bg-purple-700/80 text-white border-purple-500/40' : 'bg-blue-700/80 text-white border-blue-500/40')
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  "
                >
                  <app-icon name="file" [size]="16"></app-icon>
                  <div class="min-w-0 flex-1">
                    <span class="text-xs font-semibold truncate block">{{ msg.attachmentName }}</span>
                    <span class="text-[10px] opacity-75 block font-mono">{{ msg.attachmentSize || 'Document' }}</span>
                  </div>
                  <a
                    *ngIf="msg.attachmentUrl"
                    [href]="msg.attachmentUrl"
                    target="_blank"
                    class="p-1 rounded hover:bg-black/10 transition-colors"
                    title="Download attachment"
                  >
                    <app-icon name="download" [size]="14"></app-icon>
                  </a>
                </div>

                <!-- Footer: Timestamp + Delivery/Read Status -->
                <div class="flex items-center justify-end gap-1.5 mt-1.5 text-[10px]">
                  <span [ngClass]="msg.senderId === authService.currentUser()?.id ? 'text-white/80' : 'text-slate-400'">
                    {{ msg.createdAt | date:'shortTime' }}
                  </span>

                  <!-- Status icon for self messages -->
                  <ng-container *ngIf="msg.senderId === authService.currentUser()?.id">
                    <span *ngIf="msg.pending" class="text-white/70 flex items-center gap-1 font-mono">
                      <span>• sending</span>
                    </span>

                    <div *ngIf="msg.failed" class="flex items-center gap-1 text-rose-300 font-bold">
                      <span>• failed</span>
                      <button
                        type="button"
                        (click)="chatService.retryMessage(msg)"
                        class="underline hover:text-white font-extrabold cursor-pointer ml-1"
                        title="Retry sending message"
                      >
                        Retry
                      </button>
                    </div>

                    <span
                      *ngIf="!msg.pending && !msg.failed && msg.isRead"
                      class="text-emerald-300 font-bold text-[11px]"
                      title="Read by recipient"
                    >
                      ✓✓
                    </span>

                    <span
                      *ngIf="!msg.pending && !msg.failed && !msg.isRead"
                      class="text-white/70 font-medium text-[11px]"
                      title="Delivered"
                    >
                      ✓
                    </span>
                  </ng-container>
                </div>
              </div>
            </div>

            <!-- Empty messages in this conversation -->
            <div
              *ngIf="chatService.activeMessages().length === 0"
              class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400"
            >
              <div
                class="w-14 h-14 rounded-3xl flex items-center justify-center mb-3 shadow-xs"
                [ngClass]="portalRole() === 'alumni' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'"
              >
                <app-icon name="message-square" [size]="26"></app-icon>
              </div>
              <h4 class="text-sm font-bold text-slate-800">No messages yet</h4>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">
                Start the 1-on-1 mentorship conversation with {{ activeConv.participantName }}. Send a greeting or ask a question!
              </p>
            </div>
          </div>

          <!-- Message Input Box -->
          <div class="p-4 bg-white border-t border-slate-200/80 shrink-0">
            <form (submit)="sendTextMessage($event)" class="flex items-center gap-2">
              <label
                class="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Attach document or code snippet"
              >
                <app-icon name="paperclip" [size]="19"></app-icon>
                <input type="file" (change)="handleAttachment($event)" class="hidden" />
              </label>

              <input
                type="text"
                [(ngModel)]="newMessageText"
                name="message"
                [placeholder]="'Message ' + activeConv.participantName + '...'"
                autocomplete="off"
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-slate-50/50"
              />

              <button
                type="submit"
                [disabled]="!newMessageText.trim() || chatService.isSending()"
                class="px-4 sm:px-5 py-2.5 rounded-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                [ngClass]="portalRole() === 'alumni' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'"
              >
                <app-icon name="send" [size]="15"></app-icon>
                <span class="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </ng-container>

        <!-- No conversation selected empty state -->
        <ng-template #noActiveConvTemplate>
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div
              class="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-xs"
              [ngClass]="portalRole() === 'alumni' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'"
            >
              <app-icon name="message-square" [size]="32"></app-icon>
            </div>

            <!-- Student context empty state -->
            <ng-container *ngIf="portalRole() === 'student'">
              <h3 class="text-base font-bold text-slate-800">Select an Approved Mentor</h3>
              <p class="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                Choose an alumni mentor on the left to start 1-on-1 real-time messaging, review system architectures, or practice technical questions.
              </p>
            </ng-container>

            <!-- Alumni context empty state -->
            <ng-container *ngIf="portalRole() === 'alumni'">
              <h3 class="text-base font-bold text-slate-800">Select a Student Mentee</h3>
              <p class="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                Choose an approved student on the left to review their career roadmap, answer questions, or schedule a technical session.
              </p>
            </ng-container>

            <!-- Recruiter / Admin fallback -->
            <ng-container *ngIf="portalRole() !== 'student' && portalRole() !== 'alumni'">
              <h3 class="text-base font-bold text-slate-800">Placement Conversations</h3>
              <p class="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                Select a conversation on the left to start messaging.
              </p>
            </ng-container>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class ChatComponent {
  chatService = inject(ChatService);
  callService = inject(CallService);
  authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  searchQuery = '';
  newMessageText = '';
  mobileChatOpen = signal(false);

  portalRole = computed<'student' | 'alumni' | 'recruiter' | 'admin'>(() => {
    const url = this.router.url;
    if (url.includes('/student/')) return 'student';
    if (url.includes('/alumni/')) return 'alumni';
    if (url.includes('/recruiter/')) return 'recruiter';
    if (url.includes('/admin/')) return 'admin';
    return (this.authService.actualRole() as any) || 'student';
  });

  listHeaderTitle = computed(() => {
    const r = this.portalRole();
    if (r === 'student') return 'My Mentors';
    if (r === 'alumni') return 'My Students';
    if (r === 'recruiter') return 'Candidates';
    return 'Placement Messages';
  });

  searchPlaceholder = computed(() => {
    const r = this.portalRole();
    if (r === 'student') return 'Search approved mentors...';
    if (r === 'alumni') return 'Search approved student mentees...';
    if (r === 'recruiter') return 'Search candidates...';
    return 'Search conversations...';
  });

  filteredConversations = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    const all = this.chatService.conversations();
    if (!query) return all;
    return all.filter(c =>
      c.participantName.toLowerCase().includes(query) ||
      (c.participantHeadline && c.participantHeadline.toLowerCase().includes(query)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(query))
    );
  });

  constructor() {
    this.initRoleChat();

    // Auto-scroll effect whenever messages change
    effect(() => {
      const msgs = this.chatService.activeMessages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  async initRoleChat() {
    await this.chatService.loadConversations(this.portalRole());
  }

  selectConversation(convId: string) {
    this.chatService.setActiveConversation(convId);
    this.mobileChatOpen.set(true);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendTextMessage(event: Event) {
    event.preventDefault();
    const text = this.newMessageText.trim();
    if (!text) return;

    this.chatService.sendMessage(text);
    this.newMessageText = '';
    setTimeout(() => this.scrollToBottom(), 50);
  }

  handleAttachment(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.chatService.sendMessage('Attached file for review:', {
        name: file.name,
        url: 'https://careernexus.edu/attachments/' + encodeURIComponent(file.name),
        size: `${(file.size / 1024).toFixed(0)} KB`
      });
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  startCall(type: 'audio' | 'video') {
    const activeConv = this.chatService.activeConversation();
    if (!activeConv) return;

    this.callService.startCall({
      id: activeConv.participantId,
      name: activeConv.participantName,
      avatar: activeConv.participantAvatar,
      role: activeConv.participantRole
    }, type);
  }

  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  onAvatarError(event: Event, name?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff&bold=true`;
  }
}
