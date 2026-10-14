import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../shared/ui/toast.component';
import { CallOverlayComponent } from '../../shared/ui/call-overlay.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    ToastContainerComponent,
    CallOverlayComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-row">
      <!-- Desktop Persistent Sidebar -->
      <div class="hidden lg:block">
        <app-sidebar></app-sidebar>
      </div>

      <!-- Mobile Drawer Sidebar Backdrop -->
      <div
        *ngIf="mobileSidebarOpen()"
        class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden transition-opacity"
        (click)="closeMobileSidebar()"
      ></div>

      <!-- Mobile Slide-out Drawer -->
      <div
        class="fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-300 ease-in-out"
        [ngClass]="mobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
      >
        <app-sidebar [isMobile]="true" (closeSidebar)="closeMobileSidebar()"></app-sidebar>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 min-h-screen">
        <app-header (toggleSidebar)="toggleMobileSidebar()"></app-header>
        
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Floating Toast Container -->
      <app-toast-container></app-toast-container>

      <!-- Global Calling Overlay -->
      <app-call-overlay></app-call-overlay>
    </div>
  `
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  mobileSidebarOpen = signal(false);

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
