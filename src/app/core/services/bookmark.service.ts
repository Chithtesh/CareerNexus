import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export type BookmarkType = 'job' | 'alumni' | 'resource';

export interface BookmarkItem {
  id: string;
  type: BookmarkType;
  itemId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private toast = inject(ToastService);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  private bookmarksSignal = signal<BookmarkItem[]>([
    { id: 'b-01', type: 'job', itemId: 'j-01', createdAt: '2026-09-20T00:00:00Z' },
    { id: 'b-02', type: 'alumni', itemId: 'a-01', createdAt: '2026-09-22T00:00:00Z' },
    { id: 'b-03', type: 'resource', itemId: 'file-01', createdAt: '2026-09-24T00:00:00Z' }
  ]);

  bookmarks = computed(() => this.bookmarksSignal());

  constructor() {
    this.loadBookmarks();
  }

  async loadBookmarks() {
    if (!this.supabase.client) return;
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not load bookmarks from DB:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: BookmarkItem[] = data.map((d: any) => ({
          id: d.id,
          type: d.item_type as BookmarkType,
          itemId: d.item_id,
          createdAt: d.created_at
        }));
        this.bookmarksSignal.set(mapped);
      }
    } catch (err) {
      console.warn('Error loading bookmarks:', err);
    }
  }

  isBookmarked(type: BookmarkType, itemId: string): boolean {
    return this.bookmarksSignal().some(b => b.type === type && b.itemId === itemId);
  }

  async toggleBookmark(type: BookmarkType, itemId: string, title?: string) {
    const exists = this.isBookmarked(type, itemId);
    const user = this.authService.currentUser();

    if (exists) {
      this.bookmarksSignal.update(list => list.filter(b => !(b.type === type && b.itemId === itemId)));
      this.toast.info('Bookmark Removed', `${title || 'Item'} removed from your saved list.`);

      if (this.supabase.client && user) {
        try {
          await this.supabase.client
            .from('bookmarks')
            .delete()
            .match({ user_id: user.id, item_type: type, item_id: itemId });
        } catch (err) {
          console.warn('Error deleting bookmark from DB:', err);
        }
      }
    } else {
      const newItem: BookmarkItem = {
        id: `b-${Date.now()}`,
        type,
        itemId,
        createdAt: new Date().toISOString()
      };
      this.bookmarksSignal.update(list => [newItem, ...list]);
      this.toast.success('Bookmarked', `${title || 'Item'} saved to your bookmarks.`);

      if (this.supabase.client && user) {
        try {
          const { data, error } = await this.supabase.client
            .from('bookmarks')
            .insert({
              user_id: user.id,
              item_type: type,
              item_id: itemId
            })
            .select()
            .single();

          if (data) {
            this.bookmarksSignal.update(list =>
              list.map(b => b.id === newItem.id ? { ...b, id: data.id } : b)
            );
          }
        } catch (err) {
          console.warn('Error saving bookmark to DB:', err);
        }
      }
    }
  }
}
