import { MediaType } from '../types';

export class MediaFilter {
  private static readonly PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'bmp', 'tiff']);
  private static readonly VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mpeg', 'mkv', 'webm', 'flv', 'wmv', '3gp']);

  /**
   * Определяет тип медиа по MIME-типу
   */
  static detectMediaTypeByMime(mimeType: string): MediaType {
    if (!mimeType) return 'unknown';
    
    const mime = mimeType.toLowerCase();
    
    if (mime.startsWith('image/')) {
      return 'photo';
    }
    
    if (mime.startsWith('video/')) {
      return 'video';
    }
    
    return 'unknown';
  }

  /**
   * Определяет тип медиа по расширению файла
   */
  static detectMediaTypeByExtension(fileName: string): MediaType {
    if (!fileName) return 'unknown';
    
    const extension = this.getFileExtension(fileName).toLowerCase();
    
    if (this.PHOTO_EXTENSIONS.has(extension)) {
      return 'photo';
    }
    
    if (this.VIDEO_EXTENSIONS.has(extension)) {
      return 'video';
    }
    
    return 'unknown';
  }

  /**
   * Определяет тип медиа с приоритетом MIME над расширением
   */
  static detectMediaType(fileName: string, mimeType?: string): MediaType {
    // Сначала пробуем по MIME-типу
    if (mimeType) {
      const mimeResult = this.detectMediaTypeByMime(mimeType);
      if (mimeResult !== 'unknown') {
        return mimeResult;
      }
    }
    
    // Fallback на расширение
    return this.detectMediaTypeByExtension(fileName);
  }

  /**
   * Проверяет, является ли файл медиафайлом
   */
  static isMediaFile(fileName: string, mimeType?: string): boolean {
    const mediaType = this.detectMediaType(fileName, mimeType);
    return mediaType === 'photo' || mediaType === 'video';
  }

  /**
   * Извлекает расширение файла из имени
   */
  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return '';
    }
    return fileName.substring(lastDotIndex + 1);
  }

  /**
   * Получает список поддерживаемых расширений для фото
   */
  static getSupportedPhotoExtensions(): string[] {
    return Array.from(this.PHOTO_EXTENSIONS);
  }

  /**
   * Получает список поддерживаемых расширений для видео
   */
  static getSupportedVideoExtensions(): string[] {
    return Array.from(this.VIDEO_EXTENSIONS);
  }
} 