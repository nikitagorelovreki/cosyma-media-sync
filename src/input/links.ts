import { NormalizedLink, Provider, LinkKind } from '../types';

export class LinkNormalizer {
  /**
   * Нормализует и классифицирует входную ссылку
   */
  static normalize(url: string): NormalizedLink {
    const normalizedUrl = url.trim();
    
    // Определяем провайдера
    const provider = this.detectProvider(normalizedUrl);
    
    // Определяем тип (файл или папка)
    const kind = this.detectKind(normalizedUrl, provider);
    
    return {
      url: normalizedUrl,
      provider,
      kind
    };
  }

  /**
   * Определяет провайдера по URL
   */
  private static detectProvider(url: string): Provider {
    if (url.includes('disk.yandex.ru') || url.includes('disk.360.yandex.ru')) {
      // Для Яндекс.Диска и Яндекс.360 обрабатываем одинаково
      return url.includes('360') ? 'yandex_360' : 'yandex_disk';
    }
    
    if (url.includes('cloud.mail.ru')) {
      return 'mailru';
    }
    
    throw new Error(`Неподдерживаемый провайдер для URL: ${url}`);
  }

  /**
   * Определяет тип ресурса (файл или папка)
   */
  private static detectKind(url: string, provider: Provider): LinkKind {
    if (provider === 'yandex_disk' || provider === 'yandex_360') {
      // Яндекс.Диск: i/ - файл, d/ - папка
      if (url.includes('/i/')) {
        return 'file';
      }
      if (url.includes('/d/')) {
        return 'folder';
      }
      throw new Error(`Неопределенный тип ресурса Яндекс.Диска: ${url}`);
    }
    
    if (provider === 'mailru') {
      // Mail.ru: обычно папки, но может быть и файл
      // По умолчанию считаем папкой, так как большинство публичных ссылок - это папки
      return 'folder';
    }
    
    throw new Error(`Неопределенный тип ресурса для провайдера ${provider}: ${url}`);
  }

  /**
   * Валидирует массив ссылок
   */
  static validateLinks(links: string[]): string[] {
    const validLinks: string[] = [];
    const errors: string[] = [];
    
    for (const link of links) {
      try {
        this.normalize(link);
        validLinks.push(link);
      } catch (error) {
        errors.push(`Ошибка валидации "${link}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('Предупреждения при валидации ссылок:');
      errors.forEach(error => console.warn(`  - ${error}`));
    }
    
    return validLinks;
  }
} 