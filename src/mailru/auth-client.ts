import axios, { AxiosInstance } from 'axios';

export interface MailruAuthConfig {
  login: string;
  password: string;
  domain?: string; // mail.ru, bk.ru, inbox.ru
}

export class MailruAuthClient {
  private client: AxiosInstance;
  private config: MailruAuthConfig;
  private authToken?: string;
  private sessionId?: string;

  constructor(config: MailruAuthConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://cloud.mail.ru',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  /**
   * Авторизация в Mail.ru Cloud
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Авторизуюсь в Mail.ru Cloud...');
      
      // Шаг 1: Получаем страницу авторизации
      const authPageResponse = await this.client.get('/auth');
      console.log('✅ Страница авторизации получена');
      
      // Шаг 2: Отправляем логин и пароль
      const loginData = new URLSearchParams({
        Login: this.config.login,
        Password: this.config.password,
        Domain: this.config.domain || 'mail.ru',
        'saveauth': '1'
      });

      const loginResponse = await this.client.post('/auth', loginData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://cloud.mail.ru/auth'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });

      // Извлекаем cookies и токены
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        this.sessionId = this.extractSessionId(cookies);
        console.log('✅ Сессия получена');
      }

      // Шаг 3: Проверяем авторизацию
      const checkResponse = await this.client.get('/api/v2/user', {
        headers: {
          'Cookie': cookies?.join('; ') || ''
        }
      });

      if (checkResponse.data.status === 200) {
        console.log('🎉 Авторизация успешна!');
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Ошибка авторизации:', error);
      return false;
    }
  }

  /**
   * Получает миниатюру с авторизацией
   */
  async getThumbnailWithAuth(weblink: string, fileName: string, size: string = '200x200'): Promise<string | undefined> {
    if (!this.sessionId) {
      console.warn('⚠️  Не авторизован. Сначала выполните authenticate()');
      return undefined;
    }

    try {
      const thumbnailUrl = `https://img.imgsmail.ru/thumbnails/${weblink}/${fileName}?size=${size}`;
      
      const response = await axios.get(thumbnailUrl, {
        headers: {
          'Cookie': `session_id=${this.sessionId}`,
          'Referer': 'https://cloud.mail.ru/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        responseType: 'arraybuffer',
        timeout: 10000
      });

      if (response.status === 200) {
        // Конвертируем в base64 для вставки в Google Sheets
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      }

      return undefined;

    } catch (error) {
      console.warn(`⚠️  Не удалось получить миниатюру ${fileName}:`, error);
      return undefined;
    }
  }

  /**
   * Извлекает session_id из cookies
   */
  private extractSessionId(cookies: string[]): string | undefined {
    for (const cookie of cookies) {
      const match = cookie.match(/session_id=([^;]+)/);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  /**
   * Проверяет статус авторизации
   */
  isAuthenticated(): boolean {
    return !!this.sessionId;
  }
} 