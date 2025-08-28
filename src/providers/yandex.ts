import axios, { AxiosInstance } from 'axios';
import { MediaItem, Provider } from '../types';
import { MediaFilter } from '../filters/media';

interface YandexResource {
  name: string;
  path: string;
  type: 'file' | 'dir';
  mime_type?: string;
  created?: string;
  modified?: string;
  size?: number;
  public_url?: string;
  preview?: string; // Добавляем поле preview
}

interface YandexResponse {
  public_key: string;
  name: string;
  created?: string;
  modified?: string;
  path: string;
  type: 'file' | 'dir';
  mime_type?: string;
  size?: number;
  _embedded?: {
    items: YandexResource[];
    limit: number;
    offset: number;
    total: number;
  };
}

export class YandexProvider {
  private readonly api: AxiosInstance;
  private readonly baseUrl = 'https://cloud-api.yandex.net/v1/disk';

  constructor() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Referer': 'https://disk.yandex.ru/',
        'Origin': 'https://disk.yandex.ru',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Authorization': 'OAuth y0__xDu18eLqveAAhif5Tkgyd3emBQRgv1JG_NTosrUIWv7aM9BiKZ4Tw'
      }
    });
  }

  /**
   * Извлекает только ID из публичного URL
   */
      private extractPublicKey(url: string): string {
      // Возвращаем полный URL как public_key
      // https://disk.360.yandex.ru/d/xNv4Njt4wmH7xQ -> https://disk.360.yandex.ru/d/xNv4Njt4wmH7xQ
      return url;
    }

  /**
   * Получает список медиафайлов из публичной ссылки
   */
  async listMediaItems(publicUrl: string, provider: Provider): Promise<MediaItem[]> {
    const items: MediaItem[] = [];
    
    try {
      if (publicUrl.includes('/i/')) {
        // Одиночный файл
        const item = await this.getSingleFile(publicUrl, provider);
        if (item) {
          items.push(item);
        }
      } else if (publicUrl.includes('/d/')) {
        // Папка - рекурсивно обходим содержимое
        await this.traverseFolder(publicUrl, provider, items);
      }
    } catch (error) {
      console.error(`Ошибка при получении медиафайлов из ${publicUrl}:`, error);
      throw error;
    }
    
    return items;
  }

  /**
   * Получает информацию об одиночном файле
   */
  private async getSingleFile(publicUrl: string, provider: Provider): Promise<MediaItem | null> {
    try {
      const response = await this.api.get<YandexResponse>(
        `${this.baseUrl}/public/resources`,
        {
          params: {
            public_key: publicUrl
          }
        }
      );

      const resource = response.data;
      
      // Проверяем, что это файл
      if (resource.type !== 'file') {
        return null;
      }

      // Проверяем, что это медиафайл
      if (!MediaFilter.isMediaFile(resource.name, resource.mime_type)) {
        return null;
      }

      return this.mapToMediaItem(resource, publicUrl, provider);
    } catch (error) {
      console.error(`Ошибка при получении файла ${publicUrl}:`, error);
      throw error;
    }
  }

  /**
   * Рекурсивно обходит папку и собирает медиафайлы
   */
  private async traverseFolder(
    publicUrl: string, 
    provider: Provider, 
    items: MediaItem[],
    path: string = '',
    offset: number = 0,
    limit: number = 200
  ): Promise<void> {
    try {
      // Правильно кодируем параметры для API согласно документации
      const params: any = {
        public_key: this.extractPublicKey(publicUrl), // Только ID из URL
        limit,
        offset
      };
      
      // Кодируем путь только если он есть и не пустой
      if (path && path.trim()) {
        // Axios автоматически кодирует параметры, поэтому НЕ кодируем дополнительно
        params.path = path;
        console.log(`🔗 Запрос к API: public_key="${this.extractPublicKey(publicUrl)}" path="${path}"`);
      } else {
        console.log(`🔗 Запрос к API: public_key="${this.extractPublicKey(publicUrl)}" (корневая папка)`);
      }

      const response = await this.api.get<YandexResponse>(
        `${this.baseUrl}/public/resources`,
        { params }
      );

      console.log(`🔍 Полный ответ API:`, JSON.stringify(response.data, null, 2));

      const embedded = response.data._embedded;
      if (!embedded || !embedded.items) {
        console.log(`📋 Нет данных в ответе API для path="${path}"`);
        return;
      }
      
      console.log(`📋 API вернул ${embedded.items.length} элементов для path="${path}"`);
      console.log(`📋 Всего элементов: ${embedded.total || 'неизвестно'}`);

      // Обрабатываем текущую страницу
      for (const item of embedded.items) {
        if (item.type === 'file') {
          // Проверяем, что это медиафайл
          if (MediaFilter.isMediaFile(item.name, item.mime_type)) {
            const mediaItem = this.mapToMediaItem(item, publicUrl, provider, path);
            items.push(mediaItem);
          }
        } else if (item.type === 'dir') {
          // Рекурсивно обходим подпапку согласно документации API
          const subPath = path ? `${path}/${item.name}` : `/${item.name}`;
          console.log(`📁 Обрабатываем подпапку: ${item.name} -> path: ${subPath}`);
          
          // Добавляем задержку между запросами
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          // Рекурсивно обходим подпапку
          await this.traverseFolder(publicUrl, provider, items, subPath, 0, limit);
        }
      }

      // Проверяем, есть ли еще страницы
      if (embedded.items.length === limit && offset + limit < embedded.total) {
        // Добавляем задержку между страницами
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        await this.traverseFolder(publicUrl, provider, items, path, offset + limit, limit);
      }
    } catch (error) {
      console.error(`Ошибка при обходе папки ${path} в ${publicUrl}:`, error);
      throw error;
    }
  }

  /**
   * Преобразует ресурс Яндекс.Диска в MediaItem
   */
  private mapToMediaItem(
    resource: YandexResource, 
    publicUrl: string, 
    provider: Provider,
    folderPath?: string
  ): MediaItem {
    const pathKey = folderPath ? `${folderPath}/${resource.name}` : resource.name;
    
    // Определяем дату загрузки
    let originalUploadedAt: string | undefined;
    if (resource.created) {
      originalUploadedAt = resource.created;
    } else if (resource.modified) {
      originalUploadedAt = resource.modified;
    }

    // Определяем тип медиа
    const mediaType = MediaFilter.detectMediaType(resource.name, resource.mime_type);

    // Формируем ссылки для Yandex.Disk
    let directUrl: string | undefined;
    let viewUrl: string | undefined;
    let previewUrl: string | undefined;
    
    if (resource.type === 'file') {
      // Ссылка для просмотра файла (используем public_url из API если есть, иначе формируем)
      if (resource.public_url) {
        viewUrl = resource.public_url;
      } else {
        // Формируем ссылку для просмотра на основе корневой папки
        const rootFolder = publicUrl.split('/d/')[0] + '/d/' + publicUrl.split('/d/')[1];
        viewUrl = `${rootFolder}/${encodeURIComponent(pathKey)}`;
      }
      
      // Ссылка для скачивания через API
      const encodedPath = encodeURIComponent(pathKey);
      const publicKey = this.extractPublicKey(publicUrl);
      directUrl = `${this.baseUrl}/public/resources/download?public_key=${encodeURIComponent(publicKey)}&path=${encodedPath}`;
      
      // Миниатюра из API (если есть)
      if (resource.preview) {
        previewUrl = resource.preview;
      }
    }

    return {
      provider,
      sourcePublicUrl: publicUrl,
      directUrl: viewUrl || directUrl, // Приоритет ссылке для просмотра
      pathKey,
      fileName: resource.name,
      mediaType,
      originalUploadedAt,
      sizeBytes: resource.size,
      // Добавляем поле для миниатюры
      previewUrl
    };
  }
} 