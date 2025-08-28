import { MediaItemWithThumbnail } from '../types';

export interface ThumbnailProvider {
  getThumbnailUrl(item: MediaItemWithThumbnail): Promise<string | undefined>;
}

export class MailruThumbnailProvider implements ThumbnailProvider {
  /**
   * Получает URL миниатюры для Mail.ru Cloud
   */
  async getThumbnailUrl(item: MediaItemWithThumbnail): Promise<string | undefined> {
    try {
      if (item.provider !== 'mailru') {
        return undefined;
      }

      // НОВЫЙ API миниатюр Mail.ru Cloud!
      // Формат: https://thumb.cloud.mail.ru/weblink/thumb/xw1/{weblink}/{filename}
      const weblink = this.extractWeblink(item.sourcePublicUrl);
      if (!weblink) {
        return undefined;
      }

      // Используем новый API thumb.cloud.mail.ru
      return `https://thumb.cloud.mail.ru/weblink/thumb/xw1/${weblink}/${item.fileName}`;
      
    } catch (error) {
      console.warn(`⚠️  Не удалось получить миниатюру для ${item.fileName}:`, error);
      return undefined;
    }
  }

  private extractWeblink(url: string): string | undefined {
    // Извлекаем weblink из URL вида: https://cloud.mail.ru/public/P1ZJ/WGntm7zig
    // Включаем ВСЮ структуру папок после /public/
    const match = url.match(/\/public\/(.+)/);
    return match ? match[1] : undefined;
  }
}

export class YandexThumbnailProvider implements ThumbnailProvider {
  /**
   * Получает URL миниатюры для Яндекс.Диска
   */
  async getThumbnailUrl(item: MediaItemWithThumbnail): Promise<string | undefined> {
    try {
      if (item.provider !== 'yandex_disk' && item.provider !== 'yandex_360') {
        return undefined;
      }

      // Если у нас есть previewUrl из API, используем его
      if (item.previewUrl) {
        console.log(`🖼️  Используем миниатюру из API для ${item.fileName}`);
        return item.previewUrl;
      }

      // Иначе генерируем URL через API
      console.log(`🖼️  Генерируем URL миниатюры через API для ${item.fileName}`);
      const publicKey = encodeURIComponent(item.sourcePublicUrl);
      const path = encodeURIComponent(item.pathKey || item.fileName);
      
      // Размер миниатюры в зависимости от типа медиа
      const size = item.mediaType === 'photo' ? '200x200' : '320x240';
      
      // Используем правильный API endpoint для миниатюр
      return `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${publicKey}&path=${path}&preview_size=${size}&fields=_embedded.items.preview`;
    } catch (error) {
      console.warn(`⚠️  Не удалось получить миниатюру для ${item.fileName}:`, error);
      return undefined;
    }
  }
}

export class ThumbnailManager {
  private providers: Map<string, ThumbnailProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('mailru', new MailruThumbnailProvider());
    this.providers.set('yandex_disk', new YandexThumbnailProvider());
    this.providers.set('yandex_360', new YandexThumbnailProvider());
  }

  /**
   * Получает миниатюру для медиафайла
   */
  async getThumbnailUrl(item: MediaItemWithThumbnail): Promise<string | undefined> {
    const provider = this.providers.get(item.provider);
    if (!provider) {
      return undefined;
    }

    return await provider.getThumbnailUrl(item);
  }

  /**
   * Обогащает медиафайлы миниатюрами
   */
  async enrichWithThumbnails(items: MediaItemWithThumbnail[]): Promise<MediaItemWithThumbnail[]> {
    console.log('🖼️  Получаю миниатюры для медиафайлов...');
    
    const enrichedItems: MediaItemWithThumbnail[] = [];
    let thumbnailCount = 0;

    for (const item of items) {
      try {
        // Если у нас уже есть previewUrl из API, используем его
        if (item.previewUrl) {
          item.thumbnailUrl = item.previewUrl;
          thumbnailCount++;
          console.log(`✅ Используем миниатюру из API для ${item.fileName}`);
        } else {
          // Иначе получаем через провайдер
          const thumbnailUrl = await this.getThumbnailUrl(item);
          if (thumbnailUrl) {
            item.thumbnailUrl = thumbnailUrl;
            thumbnailCount++;
          }
        }
        enrichedItems.push(item);
      } catch (error) {
        console.warn(`⚠️  Ошибка при получении миниатюры для ${item.fileName}:`, error);
        enrichedItems.push(item);
      }
    }

    console.log(`✅ Получено миниатюр: ${thumbnailCount}/${items.length}`);
    return enrichedItems;
  }
} 