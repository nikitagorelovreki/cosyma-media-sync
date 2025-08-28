import { MediaItemWithThumbnail, SpreadsheetRow, GoogleDocsExportResult } from '../types';
import { GoogleDocsClient } from './client';
import { ThumbnailManager } from '../thumbnails/provider';

export class GoogleDocsExporter {
  private googleDocsClient: GoogleDocsClient;
  private thumbnailManager: ThumbnailManager;

  constructor(googleDocsClient: GoogleDocsClient) {
    this.googleDocsClient = googleDocsClient;
    this.thumbnailManager = new ThumbnailManager();
  }

  /**
   * Экспортирует медиафайлы в Google Sheets
   */
  async exportMediaItems(
    items: MediaItemWithThumbnail[],
    sheetName: string = 'Sheet1'
  ): Promise<GoogleDocsExportResult> {
    try {
      console.log('📊 Начинаю экспорт в Google Docs...');
      console.log(`📁 Всего файлов для экспорта: ${items.length}`);

      // Обогащаем файлы миниатюрами
      const enrichedItems = await this.thumbnailManager.enrichWithThumbnails(items);

      // Преобразуем в строки для таблицы
      const rows = this.convertToSpreadsheetRows(enrichedItems);

      // Экспортируем в Google Sheets
      const result = await this.googleDocsClient.exportToSpreadsheet(rows, sheetName);

      if (result.success) {
        console.log('🎉 Экспорт в Google Docs завершен успешно!');
        console.log(`📊 Экспортировано строк: ${result.rowsExported}`);
        console.log(`🔗 Ссылка на таблицу: ${result.spreadsheetUrl}`);
      } else {
        console.error('❌ Ошибка экспорта в Google Docs:', result.errors);
      }

      return result;

    } catch (error) {
      console.error('💥 Критическая ошибка при экспорте:', error);
      return {
        success: false,
        rowsExported: 0,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка']
      };
    }
  }

  /**
   * Преобразует медиафайлы в строки для таблицы
   */
  private convertToSpreadsheetRows(items: MediaItemWithThumbnail[]): SpreadsheetRow[] {
    return items.map(item => ({
      fileName: item.fileName,
      link: item.directUrl || item.sourcePublicUrl,
      mediaType: this.formatMediaType(item.mediaType),
      creationDate: this.formatDate(item.originalUploadedAt),
      thumbnailUrl: item.thumbnailUrl
    }));
  }

  /**
   * Форматирует тип медиа для отображения
   */
  private formatMediaType(mediaType: string): string {
    switch (mediaType) {
      case 'photo':
        return 'Фото';
      case 'video':
        return 'Видео';
      default:
        return mediaType;
    }
  }

  /**
   * Форматирует дату для отображения
   */
  private formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Неизвестно';
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Создает сводку по экспорту
   */
  createExportSummary(items: MediaItemWithThumbnail[]): void {
    const photoCount = items.filter(item => item.mediaType === 'photo').length;
    const videoCount = items.filter(item => item.mediaType === 'video').length;
    const thumbnailCount = items.filter(item => item.thumbnailUrl).length;

    console.log('\n📊 СВОДКА ЭКСПОРТА:');
    console.log('=' .repeat(40));
    console.log(`📁 Всего файлов: ${items.length}`);
    console.log(`📸 Фото: ${photoCount}`);
    console.log(`🎥 Видео: ${videoCount}`);
    console.log(`🖼️  Изображения: ${thumbnailCount}/${items.length}`);
    console.log(`📊 Строк в таблице: ${items.length + 1}`); // +1 для заголовка
    console.log(`🖼️  Колонка "Изображение" будет содержать реальные миниатюры через новый API Mail.ru!`);
  }
} 