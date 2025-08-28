import * as dotenv from 'dotenv';
import { Config } from '../types';

export class ConfigLoader {
  /**
   * Загружает конфигурацию из переменных окружения
   */
  static load(): Config {
    // Загружаем .env файл
    dotenv.config();
    
    const config: Config = {
      weeekApiToken: this.getRequiredEnv('WEEEK_API_TOKEN'),
      weeekSpaceOrProjectId: process.env.WEEEK_SPACE_OR_PROJECT_ID,
      maxTasksPerBatch: this.getNumberEnv('MAX_TASKS_PER_BATCH', 50),
      maxRetries: this.getNumberEnv('MAX_RETRIES', 3),
      requestDelayMs: this.getNumberEnv('REQUEST_DELAY_MS', 1000),
      customFieldIds: {
        sourceUrlId: '9fafcb38-56c0-491a-9ca5-55b4afc8c8d5',
        originalDateId: '9fafcb85-de56-4479-ac61-44d20511d729',
        mediaTypeId: '9fafcb44-238f-413f-b7a0-b9608bef253a'
      },
      // Новая конфигурация для Google Docs (опциональная)
      googleDocs: {
        enabled: process.env.GOOGLE_DOCS_ENABLED === 'true',
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH
      }
    };
    
    this.validateConfig(config);
    
    return config;
  }

  /**
   * Получает обязательную переменную окружения
   */
  private static getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Отсутствует обязательная переменная окружения: ${key}`);
    }
    return value;
  }

  /**
   * Получает числовую переменную окружения с значением по умолчанию
   */
  private static getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      console.warn(`Переменная ${key} содержит нечисловое значение "${value}", используется значение по умолчанию: ${defaultValue}`);
      return defaultValue;
    }
    
    return numValue;
  }

  /**
   * Валидирует конфигурацию
   */
  private static validateConfig(config: Config): void {
    if (!config.weeekApiToken || config.weeekApiToken.trim() === '') {
      throw new Error('WEEEK_API_TOKEN не может быть пустым');
    }
    
    if (!config.weeekSpaceOrProjectId) {
      console.warn('⚠️  WEEEK_SPACE_OR_PROJECT_ID не указан - задачи будут создаваться в корневом проекте');
    }
    
    if (config.maxTasksPerBatch < 1 || config.maxTasksPerBatch > 100) {
      throw new Error('MAX_TASKS_PER_BATCH должен быть в диапазоне 1-100');
    }
    
    if (config.maxRetries < 0 || config.maxRetries > 10) {
      throw new Error('MAX_RETRIES должен быть в диапазоне 0-10');
    }
    
    if (config.requestDelayMs < 0 || config.requestDelayMs > 10000) {
      throw new Error('REQUEST_DELAY_MS должен быть в диапазоне 0-10000');
    }
  }

  /**
   * Выводит текущую конфигурацию (без токенов)
   */
  static printConfig(config: Config): void {
    console.log('Конфигурация:');
    if (config.weeekSpaceOrProjectId) {
      console.log(`  WEEEK Space/Project ID: ${config.weeekSpaceOrProjectId}`);
    }
    console.log(`  Максимум задач в батче: ${config.maxTasksPerBatch}`);
    console.log(`  Максимум повторов: ${config.maxRetries}`);
    console.log(`  Задержка между запросами: ${config.requestDelayMs}ms`);
    console.log(`  WEEEK API Token: ${config.weeekApiToken.substring(0, 8)}...`);
    
    // Показываем конфигурацию Google Docs если включена
    if (config.googleDocs?.enabled) {
      console.log('  Google Docs: ВКЛЮЧЕНО');
      if (config.googleDocs.spreadsheetId) {
        console.log(`  Google Spreadsheet ID: ${config.googleDocs.spreadsheetId}`);
      }
    } else {
      console.log('  Google Docs: ВЫКЛЮЧЕНО');
    }
  }
} 