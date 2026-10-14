export type StorageType = 'storage' | 'external';
export type StorageProvider = 'supabase' | 'google_drive';

export type ResourceType =
  | 'PDF'
  | 'Document'
  | 'Spreadsheet'
  | 'Video'
  | 'Course'
  | 'Tutorial'
  | 'Practice'
  | 'Interview'
  | 'Resume'
  | 'Documentation'
  | 'Website'
  | 'Other';

export const RESOURCE_CATEGORIES = [
  'Data Structures & Algorithms',
  'Quantitative & Logical Aptitude',
  'Database Management Systems & SQL',
  'Operating Systems',
  'Computer Networks',
  'System Design (HLD & LLD)',
  'Java & Spring Boot',
  'Python & Machine Learning',
  'Full Stack & Web Development',
  'Cloud & DevOps',
  'HR & Behavioral Interview Prep',
  'Top Tech Company Specific Kits',
  'Resume Templates & Action Verbs',
  'Placement Files & Roadmaps'
] as const;

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number];

export const RESOURCE_TYPES: ResourceType[] = [
  'PDF',
  'Document',
  'Spreadsheet',
  'Video',
  'Course',
  'Tutorial',
  'Practice',
  'Interview',
  'Resume',
  'Documentation',
  'Website',
  'Other'
];

export interface ResourceFolder {
  id: string;
  name: string;
  category: string;
  parentFolderId?: string | null;
  ownerId?: string;
  isGlobal: boolean;
  filesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceFile {
  id: string;
  folderId?: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  subtopic?: string;
  resourceType?: ResourceType;
  provider?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  size: number; // in bytes
  sizeFormatted: string; // e.g. "2.4 MB"
  storageType?: StorageType;
  filePath?: string;
  fileUrl: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  bucketName?: string;
  isPrivate?: boolean;
  isActive?: boolean;
  storageProvider?: StorageProvider;
  externalFileId?: string;
  mimeType?: string;
  uploadedBy?: string;
  uploaderName?: string;
  downloadsCount: number;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceBookmark {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
}
