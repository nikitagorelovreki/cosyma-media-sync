import axios, { AxiosInstance } from 'axios';
import { MediaItem, Provider } from '../types';
import { MediaFilter } from '../filters/media';

interface MailruFile {
  name: string;
  size: number;
  type: 'file' | 'folder';
  weblink?: string;
  path?: string;
  mtime?: string;
}

interface MailruResponse {
  body: {
    list: MailruFile[];
    count: number;
    limit: number;
    offset: number;
  };
  status: number;
}

export class MailruProvider {
  private readonly api: AxiosInstance;
  private readonly baseUrl = 'https://cloud.mail.ru/api/v2';

  constructor() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'MediaSync/1.0',
        'Referer': 'https://cloud.mail.ru/'
      }
    });
  }

  /**
   * Получает список медиафайлов из публичной ссылки
   */
  async listMediaItems(publicUrl: string, provider: Provider): Promise<MediaItem[]> {
    const items: MediaItem[] = [];
    
    try {
      // Извлекаем weblink из публичной ссылки
      const weblink = this.extractWeblink(publicUrl);
      if (!weblink) {
        throw new Error(`Не удалось извлечь weblink из URL: ${publicUrl}`);
      }

      // Рекурсивно обходим папку
      await this.traverseFolder(weblink, publicUrl, provider, items, '', 0, 500, new Set());
    } catch (error) {
      console.error(`Ошибка при получении медиафайлов из ${publicUrl}:`, error);
      throw error;
    }
    
    return items;
  }

  /**
   * Извлекает weblink из публичной ссылки Mail.ru
   */
  private extractWeblink(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split('/');
      
      // Ищем weblink в пути
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'public' && i + 1 < pathParts.length) {
          // Возвращаем весь путь после public/ как weblink
          return pathParts.slice(i + 1).join('/');
        }
      }
      
      // Альтернативный способ - ищем в query параметрах
      const weblink = url.searchParams.get('weblink');
      if (weblink) {
        return weblink;
      }
      
      return null;
    } catch (error) {
      console.error(`Ошибка при парсинге URL ${publicUrl}:`, error);
      return null;
    }
  }

  /**
   * Рекурсивно обходит папку и собирает медиафайлы
   */
  private async traverseFolder(
    weblink: string,
    publicUrl: string,
    provider: Provider,
    items: MediaItem[],
    path: string = '',
    offset: number = 0,
    limit: number = 500,
    visitedPaths: Set<string> = new Set()
  ): Promise<void> {
          try {
        // Проверяем на циклические ссылки
        const currentPath = path || '/';
        if (visitedPaths.has(currentPath)) {
          console.log(`⚠️  Пропускаем циклическую ссылку: ${currentPath}`);
          return;
        }
        visitedPaths.add(currentPath);
        
        console.log(`🔍 Запрос к Mail.ru API: weblink=${weblink}, path=${path}`);
        
        const response = await this.api.get<MailruResponse>(
        `${this.baseUrl}/folder`,
        {
          params: {
            weblink,
            limit,
            offset,
            sort: 'name'
          }
        }
      );

      console.log(`📡 Mail.ru API ответ: статус=${response.data.status}, данные=`, response.data);

      if (response.data.status !== 200) {
        throw new Error(`API вернул статус ${response.data.status}: ${JSON.stringify(response.data)}`);
      }

      const body = response.data.body;
      if (!body || !body.list) {
        return;
      }

      // Обрабатываем текущую страницу
      for (const item of body.list) {
        if (item.type === 'file') {
          // Проверяем, что это медиафайл
          if (MediaFilter.isMediaFile(item.name)) {
            const mediaItem = this.mapToMediaItem(item, publicUrl, provider, path);
            items.push(mediaItem);
          }
        } else if (item.type === 'folder') {
          // Рекурсивно обходим подпапку
          // Для подпапок используем weblink из item, если доступен
          const subWeblink = item.weblink || weblink;
          const subPath = item.path || (path ? `${path}/${item.name}` : item.name);
          console.log(`📁 Обрабатываем подпапку: ${item.name}, weblink: ${subWeblink}, путь: ${subPath}`);
          
          // Проверяем, не зациклились ли мы
          if (visitedPaths.has(subPath)) {
            console.log(`⚠️  Пропускаем уже посещённый путь: ${subPath}`);
            continue;
          }
          
          await this.traverseFolder(subWeblink, publicUrl, provider, items, subPath, 0, limit, visitedPaths);
        }
      }

      // Проверяем, есть ли еще страницы
      if (body.list.length === limit && offset + limit < body.count) {
        await this.traverseFolder(weblink, publicUrl, provider, items, path, offset + limit, limit, visitedPaths);
      }
    } catch (error) {
      console.error(`Ошибка при обходе папки ${path} в weblink ${weblink}:`, error);
      throw error;
    }
  }

  /**
   * Преобразует файл Mail.ru в MediaItem
   */
  private mapToMediaItem(
    file: MailruFile,
    publicUrl: string,
    provider: Provider,
    folderPath?: string
  ): MediaItem {
    const pathKey = folderPath ? `${folderPath}/${file.name}` : file.name;
    
    // Определяем дату загрузки
    let originalUploadedAt: string | undefined;
    if (file.mtime) {
      // Преобразуем timestamp в ISO строку
      try {
        const timestamp = parseInt(file.mtime);
        if (!isNaN(timestamp)) {
          originalUploadedAt = new Date(timestamp * 1000).toISOString();
        }
      } catch (error) {
        console.warn(`Не удалось преобразовать mtime ${file.mtime} для файла ${file.name}`);
      }
    }

    // Определяем тип медиа по расширению (MIME недоступен в Mail.ru API)
    const mediaType = MediaFilter.detectMediaType(file.name);

    // Создаем прямую ссылку на файл
    let directUrl: string | undefined;
    if (file.type === 'file') {
      // Формируем прямую ссылку на файл в Mail.ru Cloud
      // Правильная ссылка: http://cloud.mail.ru/public/P1ZJ/WGntm7zig/путь/к/файлу
      // Извлекаем базовый URL из publicUrl (убираем параметры и хвост)
      const baseUrl = publicUrl.split('?')[0]; // Убираем параметры после ?
      if (folderPath) {
        // Если файл в подпапке, добавляем путь к папке
        const encodedFolderPath = encodeURIComponent(folderPath);
        const encodedFileName = encodeURIComponent(file.name);
        directUrl = `${baseUrl}/${encodedFolderPath}/${encodedFileName}`;
      } else {
        // Если файл в корневой папке
        const encodedFileName = encodeURIComponent(file.name);
        directUrl = `${baseUrl}/${encodedFileName}`;
      }
    }

    return {
      provider,
      sourcePublicUrl: publicUrl,
      directUrl,
      pathKey,
      fileName: file.name,
      mediaType,
      originalUploadedAt,
      sizeBytes: file.size
    };
  }

  /**
   * Проверяет доступность API Mail.ru
   */
  async testConnection(weblink: string): Promise<boolean> {
    try {
      const response = await this.api.get<MailruResponse>(
        `${this.baseUrl}/folder`,
        {
          params: {
            weblink,
            limit: 1,
            offset: 0
          }
        }
      );
      
      return response.data.status === 200;
    } catch (error) {
      console.error('Ошибка при проверке соединения с Mail.ru API:', error);
      return false;
    }
  }
} 