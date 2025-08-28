import { Provider } from '../types';
import { YandexProvider } from './yandex';
import { MailruProvider } from './mailru';

export interface MediaProvider {
  listMediaItems(publicUrl: string, provider: Provider): Promise<any[]>;
}

export class ProviderFactory {
  /**
   * Создает провайдер для указанного сервиса
   */
  static createProvider(providerType: Provider): MediaProvider {
    switch (providerType) {
      case 'yandex_disk':
      case 'yandex_360':
        return new YandexProvider();
      
      case 'mailru':
        return new MailruProvider();
      
      default:
        throw new Error(`Неподдерживаемый провайдер: ${providerType}`);
    }
  }

  /**
   * Получает провайдер для URL
   */
  static getProviderForUrl(url: string): MediaProvider {
    if (url.includes('disk.yandex.ru') || url.includes('disk.360.yandex.ru')) {
      return new YandexProvider();
    }
    
    if (url.includes('cloud.mail.ru')) {
      return new MailruProvider();
    }
    
    throw new Error(`Не удалось определить провайдер для URL: ${url}`);
  }
} 