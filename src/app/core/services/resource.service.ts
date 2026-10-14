import { Injectable, signal, computed, inject } from '@angular/core';
import {
  ResourceFolder,
  ResourceFile,
  StorageType,
  StorageProvider,
  ResourceType,
  RESOURCE_CATEGORIES
} from '../models/resource.model';
import { CURATED_RESOURCE_FOLDERS, CURATED_RESOURCES } from '../data/curated-resources';
import { ToastService } from './toast.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  private readonly BOOKMARKS_STORAGE_KEY = 'careernexus_resource_bookmarks';

  private foldersSignal = signal<ResourceFolder[]>(CURATED_RESOURCE_FOLDERS);
  private filesSignal = signal<ResourceFile[]>(CURATED_RESOURCES);
  private currentFolderIdSignal = signal<string | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  private localBookmarksSignal = signal<Set<string>>(this.loadLocalBookmarks());

  folders = computed(() => this.foldersSignal());
  files = computed(() => this.filesSignal());
  currentFolderId = computed(() => this.currentFolderIdSignal());
  isLoading = computed(() => this.isLoadingSignal());

  currentFolder = computed(() => {
    const id = this.currentFolderIdSignal();
    return id ? this.foldersSignal().find(f => f.id === id) || null : null;
  });

  currentFolderFiles = computed(() => {
    const folderId = this.currentFolderIdSignal();
    if (!folderId) return this.filesSignal();
    return this.filesSignal().filter(f => f.folderId === folderId);
  });

  bookmarkedFiles = computed(() =>
    this.filesSignal().filter(f => f.isBookmarked)
  );

  constructor() {
    this.initResources();
  }

  private loadLocalBookmarks(): Set<string> {
    try {
      const stored = localStorage.getItem(this.BOOKMARKS_STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          return new Set<string>(arr);
        }
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  }

  private saveLocalBookmarks(bookmarks: Set<string>) {
    try {
      localStorage.setItem(this.BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    } catch {
      // ignore
    }
  }

  private async initResources() {
    await Promise.all([this.loadFolders(), this.loadFiles()]);
  }

  async loadFolders() {
    if (!this.supabase.client) return;
    try {
      this.isLoadingSignal.set(true);
      const { data, error } = await this.supabase.client
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch folders from Supabase, retaining curated folders:', error);
        return;
      }

      if (data && data.length > 0) {
        const dbFolders: ResourceFolder[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          parentFolderId: d.parent_folder_id,
          ownerId: d.owner_id,
          isGlobal: d.is_global ?? true,
          filesCount: d.files_count ?? 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));

        // Merge: keep all curated folders and add any custom folders created in DB
        const curatedMap = new Map<string, ResourceFolder>();
        CURATED_RESOURCE_FOLDERS.forEach(f => curatedMap.set(f.id, f));
        dbFolders.forEach(f => curatedMap.set(f.id, f));

        this.foldersSignal.set(Array.from(curatedMap.values()));
      }
    } catch (err) {
      console.warn('Error loading folders:', err);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async loadFiles() {
    const user = this.authService.currentUser();
    const bookmarkSet = new Set<string>(this.localBookmarksSignal());

    // 1. Fetch remote bookmarks if user is authenticated and Supabase is active
    if (this.supabase.client && user?.id) {
      try {
        const { data: bData, error: bErr } = await this.supabase.client
          .from('resource_bookmarks')
          .select('resource_id')
          .eq('user_id', user.id);

        if (!bErr && bData) {
          bData.forEach((b: any) => bookmarkSet.add(b.resource_id));
          this.localBookmarksSignal.set(bookmarkSet);
          this.saveLocalBookmarks(bookmarkSet);
        }
      } catch (err) {
        console.warn('Error fetching bookmarks:', err);
      }
    }

    // 2. Fetch files from Supabase
    if (this.supabase.client) {
      try {
        this.isLoadingSignal.set(true);
        const { data, error } = await this.supabase.client
          .from('files')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch files from Supabase, applying bookmarks to curated resources:', error);
          // Apply bookmarks to curated resources
          this.filesSignal.update(list =>
            list.map(f => ({ ...f, isBookmarked: bookmarkSet.has(f.id) }))
          );
          return;
        }

        if (data) {
          const dbFiles: ResourceFile[] = data.map((d: any) => {
            const rawStorageType = d.storage_type || (d.external_url ? 'external' : 'storage');
            return {
              id: d.id,
              folderId: d.folder_id,
              name: d.name || d.title || 'Resource',
              title: d.title || d.name || 'Resource',
              description: d.description || '',
              category: d.category || 'General',
              subtopic: d.subtopic || 'General',
              resourceType: (d.resource_type as ResourceType) || 'PDF',
              provider: d.provider || (rawStorageType === 'external' ? 'External' : 'Internal'),
              fileName: d.file_name,
              fileType: d.file_type,
              fileSize: d.file_size || Number(d.size) || 0,
              size: Number(d.size) || d.file_size || 1048576,
              sizeFormatted: d.size_formatted || '1.0 MB',
              storageType: rawStorageType as StorageType,
              filePath: d.file_path || '',
              fileUrl: d.file_url || d.external_url || '',
              externalUrl: d.external_url || (rawStorageType === 'external' ? d.file_url : undefined),
              thumbnailUrl: d.thumbnail_url,
              bucketName: d.bucket_name || 'resources',
              isPrivate: d.is_private ?? false,
              isActive: d.is_active ?? true,
              storageProvider: d.storage_provider || 'supabase',
              externalFileId: d.external_file_id,
              mimeType: d.mime_type || 'application/pdf',
              uploadedBy: d.uploaded_by || '',
              uploaderName: d.uploader_name || 'Placement Cell',
              downloadsCount: d.downloads_count || 0,
              isBookmarked: bookmarkSet.has(d.id),
              createdAt: d.created_at,
              updatedAt: d.updated_at
            };
          });

          // Merge: Start with curated files (with bookmark state) and overlay DB files
          const filesMap = new Map<string, ResourceFile>();
          CURATED_RESOURCES.forEach(f => {
            filesMap.set(f.id, {
              ...f,
              isBookmarked: bookmarkSet.has(f.id)
            });
          });

          dbFiles.forEach(f => {
            filesMap.set(f.id, f);
          });

          this.filesSignal.set(Array.from(filesMap.values()));
        }
      } catch (err) {
        console.warn('Error loading files:', err);
        this.filesSignal.update(list =>
          list.map(f => ({ ...f, isBookmarked: bookmarkSet.has(f.id) }))
        );
      } finally {
        this.isLoadingSignal.set(false);
      }
    } else {
      // Offline / no client: update bookmarks
      this.filesSignal.update(list =>
        list.map(f => ({ ...f, isBookmarked: bookmarkSet.has(f.id) }))
      );
    }
  }

  setCurrentFolder(folderId: string | null) {
    this.currentFolderIdSignal.set(folderId);
  }

  async createFolder(name: string, category: string): Promise<ResourceFolder> {
    const user = this.authService.currentUser();
    const newFolder: ResourceFolder = {
      id: `f-${Date.now()}`,
      name,
      category,
      isGlobal: true,
      filesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.supabase.client) {
      try {
        const { data, error } = await this.supabase.client
          .from('folders')
          .insert({
            name,
            category,
            is_global: true,
            files_count: 0,
            owner_id: user?.id || null
          })
          .select()
          .single();

        if (error) {
          console.warn('Error saving folder to DB:', error);
        } else if (data) {
          newFolder.id = data.id;
          newFolder.createdAt = data.created_at;
          newFolder.updatedAt = data.updated_at;
        }
      } catch (err) {
        console.warn('Failed to insert folder:', err);
      }
    }

    this.foldersSignal.update(list => [newFolder, ...list]);
    this.toast.success('Folder Created', `Folder "${name}" is now ready.`);
    return newFolder;
  }

  /**
   * Unified Resource Creation supporting both Supabase Storage uploads and verified External URLs.
   */
  async createResource(data: {
    title: string;
    category: string;
    subtopic?: string;
    resourceType: ResourceType;
    provider?: string;
    storageType: StorageType;
    externalUrl?: string;
    description?: string;
    folderId?: string;
    fileObj?: File;
    isActive?: boolean;
  }): Promise<ResourceFile> {
    const user = this.authService.currentUser();
    const bucketName = 'resources';
    let filePath = '';
    let fileUrl = '';
    let size = 0;
    let sizeFormatted = 'External Link';
    let mimeType = 'text/html';

    if (data.storageType === 'storage' && data.fileObj) {
      size = data.fileObj.size;
      sizeFormatted = `${(size / (1024 * 1024)).toFixed(1)} MB`;
      mimeType = data.fileObj.type || 'application/pdf';

      const cleanFileName = data.fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const storagePath = `${data.folderId || 'general'}/${Date.now()}_${cleanFileName}`;

      if (this.supabase.client) {
        try {
          const uploadResult = await this.supabase.uploadFile(bucketName, storagePath, data.fileObj);
          if (uploadResult) {
            filePath = uploadResult.path;
            fileUrl = uploadResult.url;
          }
        } catch (uploadErr) {
          console.warn('Supabase storage upload error:', uploadErr);
        }
      }
    } else if (data.storageType === 'external') {
      fileUrl = data.externalUrl?.trim() || '';
      size = 0;
      sizeFormatted = 'External Link';
      mimeType = 'text/html';
    }

    const newResource: ResourceFile = {
      id: `res-${Date.now()}`,
      folderId: data.folderId,
      name: data.title,
      title: data.title,
      description: data.description?.trim() || '',
      category: data.category,
      subtopic: data.subtopic?.trim() || 'General',
      resourceType: data.resourceType,
      provider: data.provider?.trim() || (data.storageType === 'external' ? 'External Provider' : 'Internal Placement Cell'),
      fileName: data.fileObj?.name,
      fileType: data.fileObj?.name.split('.').pop()?.toLowerCase() || (data.storageType === 'external' ? 'link' : 'pdf'),
      fileSize: size,
      size: size,
      sizeFormatted: sizeFormatted,
      storageType: data.storageType,
      filePath: filePath,
      fileUrl: fileUrl,
      externalUrl: data.storageType === 'external' ? data.externalUrl?.trim() : undefined,
      bucketName: data.storageType === 'storage' ? bucketName : undefined,
      isPrivate: false,
      isActive: data.isActive ?? true,
      storageProvider: data.storageType === 'storage' ? 'supabase' : undefined,
      mimeType: mimeType,
      uploadedBy: user?.id || 'u-admin-01',
      uploaderName: user?.fullName || 'Placement Cell Admin',
      downloadsCount: 0,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.supabase.client) {
      try {
        const payload: any = {
          name: newResource.title,
          title: newResource.title,
          description: newResource.description,
          category: newResource.category,
          subtopic: newResource.subtopic,
          resource_type: newResource.resourceType,
          provider: newResource.provider,
          storage_type: newResource.storageType,
          file_name: newResource.fileName,
          file_type: newResource.fileType,
          file_size: newResource.fileSize,
          size: newResource.size,
          size_formatted: newResource.sizeFormatted,
          file_path: filePath,
          file_url: fileUrl,
          external_url: newResource.externalUrl || null,
          bucket_name: newResource.bucketName || null,
          is_private: false,
          is_active: newResource.isActive,
          mime_type: mimeType,
          uploaded_by: user?.id || null,
          uploader_name: user?.fullName || 'Placement Cell Admin',
          downloads_count: 0
        };

        if (data.folderId && !data.folderId.startsWith('f-')) {
          payload.folder_id = data.folderId;
        }

        const { data: dbData, error } = await this.supabase.client
          .from('files')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.warn('Error inserting resource record into Supabase:', error);
        } else if (dbData) {
          newResource.id = dbData.id;
          newResource.createdAt = dbData.created_at;
          newResource.updatedAt = dbData.updated_at;
        }
      } catch (err) {
        console.warn('Failed to insert resource into DB:', err);
      }
    }

    this.filesSignal.update(list => [newResource, ...list]);
    this.toast.success('Resource Published', `"${newResource.title}" added to resource vault.`);
    return newResource;
  }

  /**
   * Alias for backward compatibility with existing components
   */
  async uploadFile(fileData: {
    name: string;
    folderId: string;
    category: string;
    size: number;
    mimeType: string;
    description?: string;
    storageProvider?: StorageProvider;
    fileObj?: File;
  }): Promise<ResourceFile> {
    return this.createResource({
      title: fileData.name,
      category: fileData.category,
      storageType: 'storage',
      resourceType: 'PDF',
      provider: 'Internal Placement Cell',
      folderId: fileData.folderId,
      description: fileData.description,
      fileObj: fileData.fileObj
    });
  }

  /**
   * Update resource metadata, with optional file replacement.
   */
  async updateResource(
    resourceId: string,
    updates: Partial<ResourceFile>,
    newFileObj?: File
  ): Promise<void> {
    const existing = this.filesSignal().find(f => f.id === resourceId);
    if (!existing) return;

    let updatedFilePath = existing.filePath;
    let updatedFileUrl = existing.fileUrl;
    let updatedSize = existing.size;
    let updatedSizeFormatted = existing.sizeFormatted;
    let updatedMimeType = existing.mimeType;
    let updatedFileName = existing.fileName;
    let updatedFileType = existing.fileType;

    // Handle file replacement if a new file is uploaded
    if (newFileObj && this.supabase.client) {
      try {
        const cleanFileName = newFileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
        const storagePath = `${existing.folderId || 'general'}/${Date.now()}_${cleanFileName}`;
        const uploadResult = await this.supabase.uploadFile('resources', storagePath, newFileObj);

        if (uploadResult) {
          // Clean up old file if it existed
          if (existing.filePath && existing.bucketName) {
            await this.supabase.deleteStorageFile(existing.bucketName, existing.filePath);
          }
          updatedFilePath = uploadResult.path;
          updatedFileUrl = uploadResult.url;
          updatedSize = newFileObj.size;
          updatedSizeFormatted = `${(updatedSize / (1024 * 1024)).toFixed(1)} MB`;
          updatedMimeType = newFileObj.type || 'application/pdf';
          updatedFileName = newFileObj.name;
          updatedFileType = newFileObj.name.split('.').pop()?.toLowerCase();
        }
      } catch (err) {
        console.warn('Error replacing storage file:', err);
      }
    }

    const merged: ResourceFile = {
      ...existing,
      ...updates,
      filePath: updatedFilePath,
      fileUrl: updates.externalUrl || updatedFileUrl,
      size: updatedSize,
      sizeFormatted: updatedSizeFormatted,
      mimeType: updatedMimeType,
      fileName: updatedFileName,
      fileType: updatedFileType,
      updatedAt: new Date().toISOString()
    };

    // Update in-memory signal
    this.filesSignal.update(list =>
      list.map(f => (f.id === resourceId ? merged : f))
    );

    // Update Supabase DB
    if (this.supabase.client && !resourceId.startsWith('res-') && !resourceId.startsWith('file-')) {
      try {
        const payload: any = {
          updated_at: new Date().toISOString()
        };
        if (updates.title !== undefined) {
          payload.title = updates.title;
          payload.name = updates.title;
        }
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.subtopic !== undefined) payload.subtopic = updates.subtopic;
        if (updates.resourceType !== undefined) payload.resource_type = updates.resourceType;
        if (updates.provider !== undefined) payload.provider = updates.provider;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.storageType !== undefined) payload.storage_type = updates.storageType;
        if (updates.externalUrl !== undefined) payload.external_url = updates.externalUrl;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (newFileObj) {
          payload.file_path = updatedFilePath;
          payload.file_url = updatedFileUrl;
          payload.file_name = updatedFileName;
          payload.file_type = updatedFileType;
          payload.file_size = updatedSize;
          payload.size = updatedSize;
          payload.size_formatted = updatedSizeFormatted;
          payload.mime_type = updatedMimeType;
        }

        await this.supabase.client.from('files').update(payload).eq('id', resourceId);
      } catch (err) {
        console.warn('Error updating resource in Supabase:', err);
      }
    }

    this.toast.success('Resource Updated', 'Resource details saved successfully.');
  }

  /**
   * Alias for backward compatibility
   */
  async updateFile(fileId: string, updates: Partial<ResourceFile>): Promise<void> {
    return this.updateResource(fileId, updates);
  }

  /**
   * Toggle resource active/inactive state (for Admin management)
   */
  async toggleResourceActive(resourceId: string, isActive: boolean): Promise<void> {
    this.filesSignal.update(list =>
      list.map(f => f.id === resourceId ? { ...f, isActive, updatedAt: new Date().toISOString() } : f)
    );

    if (this.supabase.client && !resourceId.startsWith('res-') && !resourceId.startsWith('file-')) {
      try {
        await this.supabase.client
          .from('files')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', resourceId);
      } catch (err) {
        console.warn('Error toggling active state in DB:', err);
      }
    }

    this.toast.info(
      isActive ? 'Resource Activated' : 'Resource Deactivated',
      isActive ? 'Resource is now visible to students.' : 'Resource hidden from student vault.'
    );
  }

  /**
   * Delete resource with Supabase Storage cleanup and bookmark removal
   */
  async deleteResource(resourceId: string): Promise<void> {
    const resource = this.filesSignal().find(f => f.id === resourceId);
    this.filesSignal.update(list => list.filter(f => f.id !== resourceId));

    // Remove from local bookmarks
    const bookmarks = new Set(this.localBookmarksSignal());
    bookmarks.delete(resourceId);
    this.localBookmarksSignal.set(bookmarks);
    this.saveLocalBookmarks(bookmarks);

    if (this.supabase.client && resource) {
      try {
        // Delete storage file if applicable
        if (resource.storageType === 'storage' && resource.filePath && resource.bucketName) {
          await this.supabase.deleteStorageFile(resource.bucketName, resource.filePath);
        }

        // Delete from bookmarks table
        await this.supabase.client
          .from('resource_bookmarks')
          .delete()
          .eq('resource_id', resourceId);

        // Delete from files table
        if (!resourceId.startsWith('res-') && !resourceId.startsWith('file-')) {
          await this.supabase.client.from('files').delete().eq('id', resourceId);
        }
      } catch (err) {
        console.warn('Error during resource deletion:', err);
      }
    }

    this.toast.info('Resource Deleted', `"${resource?.title || 'Resource'}" removed from system.`);
  }

  /**
   * Alias for backward compatibility
   */
  async deleteFile(fileId: string): Promise<void> {
    return this.deleteResource(fileId);
  }

  /**
   * Toggle Bookmark with Supabase sync and local persistence
   */
  async toggleBookmark(resourceId: string): Promise<void> {
    const user = this.authService.currentUser();
    const currentBookmarks = new Set(this.localBookmarksSignal());
    const isNowBookmarked = !currentBookmarks.has(resourceId);

    if (isNowBookmarked) {
      currentBookmarks.add(resourceId);
    } else {
      currentBookmarks.delete(resourceId);
    }

    this.localBookmarksSignal.set(currentBookmarks);
    this.saveLocalBookmarks(currentBookmarks);

    this.filesSignal.update(list =>
      list.map(f => (f.id === resourceId ? { ...f, isBookmarked: isNowBookmarked } : f))
    );

    const resource = this.filesSignal().find(f => f.id === resourceId);

    // Sync to Supabase if logged in
    if (this.supabase.client && user?.id) {
      try {
        if (isNowBookmarked) {
          await this.supabase.client.from('resource_bookmarks').upsert({
            user_id: user.id,
            resource_id: resourceId
          });
        } else {
          await this.supabase.client
            .from('resource_bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('resource_id', resourceId);
        }
      } catch (err) {
        console.warn('Error syncing bookmark to Supabase:', err);
      }
    }

    if (isNowBookmarked) {
      this.toast.success('Bookmarked', `"${resource?.title || 'Item'}" saved to your personal collection.`);
    } else {
      this.toast.info('Bookmark Removed', `"${resource?.title || 'Item'}" removed from bookmarks.`);
    }
  }

  /**
   * Open Resource: External URLs in new tab, Storage files in viewer/signed link
   */
  async openResource(resource: ResourceFile): Promise<void> {
    // 1. External Resource: Always open in new tab
    if (resource.storageType === 'external' || resource.externalUrl) {
      const url = resource.externalUrl || resource.fileUrl;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        window.open(url, '_blank', 'noopener,noreferrer');
        this.toast.info('Opening Resource', `Redirecting to ${resource.provider || 'external platform'}...`);
        return;
      }
    }

    // 2. Storage file: If public URL exists, open it
    if (resource.fileUrl && (resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://'))) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 3. Storage file with filePath: generate signed URL
    if (this.supabase.client && resource.filePath) {
      try {
        const signedUrl = await this.supabase.createSignedUrl(
          resource.bucketName || 'resources',
          resource.filePath,
          3600
        );
        if (signedUrl) {
          window.open(signedUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (err) {
        console.warn('Error creating signed URL for open:', err);
      }
    }

    this.toast.warning('Link Unavailable', 'Direct resource URL is not configured yet.');
  }

  /**
   * Download Resource: Only valid for Supabase Storage files.
   * For external resources, clearly informs the user and opens the live external resource instead.
   */
  async downloadFile(resource: ResourceFile): Promise<void> {
    // Check if it's an external link
    if (resource.storageType === 'external' || (!resource.filePath && resource.externalUrl)) {
      this.toast.info(
        'External Resource',
        `"${resource.title}" is hosted externally by ${resource.provider || 'the author'}. Opening resource directly...`
      );
      this.openResource(resource);
      return;
    }

    // Track download metric
    this.filesSignal.update(list =>
      list.map(f => (f.id === resource.id ? { ...f, downloadsCount: f.downloadsCount + 1 } : f))
    );

    if (this.supabase.client && !resource.id.startsWith('res-') && !resource.id.startsWith('file-')) {
      try {
        await this.supabase.client
          .from('files')
          .update({ downloads_count: resource.downloadsCount + 1 })
          .eq('id', resource.id);
      } catch (err) {
        console.warn('Error updating download count:', err);
      }
    }

    this.toast.info('Downloading File', `Retrieving "${resource.title}" from storage...`);

    // Download from Supabase Storage bucket
    if (this.supabase.client && resource.filePath) {
      try {
        const blob = await this.supabase.downloadFileBlob(
          resource.bucketName || 'resources',
          resource.filePath
        );
        if (blob) {
          const objectUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = resource.fileName || resource.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(objectUrl);
          this.toast.success('Download Complete', `"${resource.title}" saved to device.`);
          return;
        }

        // Fallback: create signed URL
        const signedUrl = await this.supabase.createSignedUrl(
          resource.bucketName || 'resources',
          resource.filePath,
          3600
        );
        if (signedUrl) {
          window.open(signedUrl, '_blank');
          this.toast.success('Download Link Ready', 'Opening file in browser.');
          return;
        }
      } catch (storageErr) {
        console.warn('Storage download error:', storageErr);
      }
    }

    // Public URL fallback
    if (resource.fileUrl && (resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://'))) {
      try {
        const response = await fetch(resource.fileUrl);
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = resource.fileName || resource.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(objectUrl);
          this.toast.success('Download Complete', `"${resource.title}" saved.`);
          return;
        }
      } catch {
        window.open(resource.fileUrl, '_blank');
        return;
      }
    }

    this.toast.warning(
      'Storage File Pending',
      `File "${resource.title}" is pending active cloud sync in the 'resources' storage bucket.`
    );
  }
}
