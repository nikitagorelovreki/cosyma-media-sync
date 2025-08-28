/**
 * ⚠️  DEPRECATED: WEEEK Task Builder
 * 
 * This module is deprecated and will be removed in future versions.
 * The main functionality of this application is Google Sheets export.
 * 
 * WEEEK integration is kept for backward compatibility only.
 * Do not use for new projects.
 */

import { MediaItem, WeeekTaskPayload, MediaType } from '../types';
import * as crypto from 'crypto';

export class TaskBuilder {
  /**
   * Строит dedupId для предотвращения дублирования
   */
  static buildDedupId(item: MediaItem): string {
    const rootUrl = this.getRootUrl(item.sourcePublicUrl);
    const data = `${item.provider}|${rootUrl}|${item.pathKey}`;
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  /**
   * Извлекает корневой URL из публичной ссылки
   */
  private static getRootUrl(publicUrl: string): string {
    try {
      const url = new URL(publicUrl);
      // Убираем параметры и фрагменты, оставляем только базовый путь
      return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
      // Если не удалось распарсить URL, возвращаем как есть
      return publicUrl;
    }
  }

  /**
   * Формирует заголовок задачи
   */
  static buildTitle(item: MediaItem, dedupId: string): string {
    return item.fileName;
  }

  /**
   * Формирует описание задачи
   */
  static buildDescription(item: MediaItem, dedupId: string): string {
    // Используем прямую ссылку на файл для кликабельной ссылки
    const linkUrl = item.directUrl || item.sourcePublicUrl;
    return `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`;
  }

  /**
   * Формирует тег для типа медиа
   */
  static buildMediaTypeTag(mediaType: string): string | null {
    switch (mediaType) {
      case 'photo':
        return 'Photo';
      case 'video':
        return 'Video';
      default:
        return null;
    }
  }

  /**
   * Формирует значение для кастомного поля Original Upload Date
   */
  static buildOriginalDateValue(originalUploadedAt?: string): string | null {
    if (!originalUploadedAt) {
      return null;
    }
    
    try {
      // Преобразуем ISO строку в формат даты для WEEEK
      const date = new Date(originalUploadedAt);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Формат YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Строит полную задачу WEEEK
   */
  static buildTask(
    item: MediaItem,
    config: {
      customFieldIds: {
        sourceUrlId: string;
        originalDateId: string;
        mediaTypeId: string;
      };
      projectId?: string;
    }
  ): WeeekTaskPayload {
    const dedupId = this.buildDedupId(item);
    
    // Определяем тег для типа медиа
    const mediaTag = this.buildMediaTypeTag(item.mediaType);
    const tags = mediaTag ? [mediaTag] : [];
    
    console.log(`🏷️  Создаю теги для ${item.fileName}:`, tags);
    
    // Создаем кастомные поля для колонок
    const customFields: Record<string, any> = {};
    
    // Колонка Link - прямая ссылка на файл
    if (config.customFieldIds.sourceUrlId) {
      // Используем прямую ссылку на файл, если доступна, иначе публичную ссылку
      const linkUrl = item.directUrl || item.sourcePublicUrl;
      customFields[config.customFieldIds.sourceUrlId] = linkUrl;
    }
    
    // Колонка Creation Date - дата создания файла
    if (config.customFieldIds.originalDateId && item.originalUploadedAt) {
      try {
        const date = new Date(item.originalUploadedAt);
        const isoDate = date.toISOString(); // ISO 8601 format для datetime поля
        customFields[config.customFieldIds.originalDateId] = isoDate;
      } catch (error) {
        // Если не удалось распарсить дату, используем оригинальное значение
        customFields[config.customFieldIds.originalDateId] = item.originalUploadedAt;
      }
    }
    
    // Колонка Media Type - тип медиа (select поле)
    if (config.customFieldIds.mediaTypeId) {
      // Для select поля нужно передавать ID опции, а не текст
      const mediaTypeOptionId = this.getMediaTypeOptionId(item.mediaType);
      customFields[config.customFieldIds.mediaTypeId] = mediaTypeOptionId;
    }
    
    console.log(`🔧 Создаю кастомные поля для ${item.fileName}:`, customFields);
    
    return {
      title: this.buildTitle(item, dedupId),
      description: this.buildDescription(item, dedupId),
      tags,
      customFields,
      projectId: config.projectId
    };
  }

  /**
   * Получает отображаемое название типа медиа
   */
  private static getMediaTypeDisplay(mediaType: string): string {
    switch (mediaType) {
      case 'photo':
        return 'Фото';
      case 'video':
        return 'Видео';
      default:
        return 'Неизвестно';
    }
  }

  /**
   * Получает ID опции для select поля Media Type (проект 16)
   */
  private static getMediaTypeOptionId(mediaType: string): string {
    switch (mediaType) {
      case 'photo':
        return '9fafcb55-9bfc-4e71-bfc3-9d1a142a278d'; // ID опции "Photo"
      case 'video':
        return '9fafcb5e-4492-47b3-a79d-14de1c246cea'; // ID опции "Video"
      default:
        return '9fafcb55-9bfc-4e71-bfc3-9d1a142a278d'; // По умолчанию "Photo"
    }
  }

  /**
   * Получает отображаемое название провайдера
   */
  private static getProviderDisplay(provider: string): string {
    switch (provider) {
      case 'yandex_disk':
        return 'Яндекс.Диск';
      case 'yandex_360':
        return 'Яндекс.360';
      case 'mailru':
        return 'Mail.ru Cloud';
      default:
        return provider;
    }
  }

  /**
   * Форматирует размер файла в читаемом виде
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
} 