export type Provider = 'yandex_disk' | 'yandex_360' | 'mailru';
export type MediaType = 'photo' | 'video' | 'unknown';
export type LinkKind = 'file' | 'folder';

export interface MediaItem {
  provider: Provider;
  sourcePublicUrl: string;
  directUrl?: string;
  pathKey: string;
  fileName: string;
  mediaType: MediaType;
  originalUploadedAt?: string; // ISO 8601
  sizeBytes?: number;
}

export interface NormalizedLink {
  url: string;
  provider: Provider;
  kind: LinkKind;
}

export interface WeeekCustomField {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; name: string }>;
}

export interface WeeekTaskPayload {
  title: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  projectId?: string; // ID проекта для создания задачи
}

export interface WeeekTask {
  id: string;
  title: string;
  description?: string;
  customFields?: Record<string, any>;
}

export interface Config {
  weeekApiToken: string;
  weeekSpaceOrProjectId?: string;
  maxTasksPerBatch: number;
  maxRetries: number;
  requestDelayMs: number;
  customFieldIds: {
    sourceUrlId: string;
    originalDateId: string;
    mediaTypeId: string;
  };
  googleDocs?: GoogleDocsConfig;
}

export interface SyncResult {
  created: number;
  skipped: number;
  errors: Array<{ url: string; error: string }>;
} 

// Новые типы для Google Docs экспорта
export interface GoogleDocsConfig {
  enabled: boolean;
  spreadsheetId?: string;
  credentialsPath?: string;
}

export interface MediaItemWithThumbnail extends MediaItem {
  thumbnailUrl?: string;
}

export interface GoogleDocsExportResult {
  success: boolean;
  spreadsheetUrl?: string;
  rowsExported: number;
  errors?: string[];
}

export interface SpreadsheetRow {
  fileName: string;
  link: string;
  mediaType: string;
  creationDate: string;
  thumbnailUrl?: string;
} 