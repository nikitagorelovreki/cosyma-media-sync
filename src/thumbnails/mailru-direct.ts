import { MediaItemWithThumbnail } from '../types';
import axios from 'axios';

export class MailruDirectThumbnailProvider {
  /**
   * Получает миниатюру через прямое скачивание файла
   */
  async getThumbnailUrl(item: MediaItemWithThumbnail): Promise<string | undefined> {
    try {
      if (item.provider !== 'mailru') {
        return undefined;
      }

      // Используем прямую ссылку на файл
      if (item.directUrl) {
        return item.directUrl;
      }

      // Если нет прямой ссылки, используем стандартную
      if (item.sourcePublicUrl) {
        const weblink = this.extractWeblink(item.sourcePublicUrl);
        if (weblink) {
          return `https://cloud.mail.ru/public/${weblink}/${item.fileName}`;
        }
      }

      return undefined;
    } catch (error) {
      console.warn(`⚠️  Не удалось получить прямую ссылку для ${item.fileName}:`, error);
      return undefined;
    }
  }

  private extractWeblink(url: string): string | undefined {
    const match = url.match(/\/public\/([^\/]+)/);
    return match ? match[1] : undefined;
  }
} 