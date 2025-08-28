/**
 * ⚠️  DEPRECATED: WEEEK Integration
 * 
 * This module is deprecated and will be removed in future versions.
 * The main functionality of this application is Google Sheets export.
 * 
 * WEEEK integration is kept for backward compatibility only.
 * Do not use for new projects.
 */

import axios, { AxiosInstance } from 'axios';
import { 
  WeeekCustomField, 
  WeeekTaskPayload, 
  WeeekTask, 
  Config 
} from '../types';

interface WeeekCustomFieldCreate {
  name: string;
  type: string;
  options?: Array<{ name: string }>;
}

interface WeeekCustomFieldResponse {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; name: string }>;
}

interface WeeekTaskResponse {
  id: string;
  title: string;
  description?: string;
  customFields?: Record<string, any>;
}

export class WeeekClient {
  private readonly api: AxiosInstance;
  private readonly config: Config;
  private existingLinksMap: Map<string, boolean> | null = null;

  constructor(config: Config) {
    this.config = config;
    this.api = axios.create({
      baseURL: 'https://api.weeek.net/public/v1',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.weeekApiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MediaSync/1.0'
      }
    });
  }

  /**
   * Проверяет доступность API WEEEK
   */
  async testConnection(): Promise<boolean> {
    try {
      // Проверяем доступность API через endpoint задач
      const response = await this.api.get('/tm/tasks');
      return response.status === 200;
    } catch (error) {
      console.error('Ошибка при проверке соединения с WEEEK API:', error);
      return false;
    }
  }

  /**
   * Получает список кастомных полей для рабочего пространства
   */
  async getCustomFields(): Promise<WeeekCustomField[]> {
    try {
      const response = await this.api.get('/custom-fields');
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((field: WeeekCustomFieldResponse) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          options: field.options
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении кастомных полей:', error);
      return [];
    }
  }

  /**
   * Создает кастомное поле
   */
  async createCustomField(field: WeeekCustomFieldCreate): Promise<WeeekCustomField | null> {
    try {
      const response = await this.api.post(
        '/custom-fields',
        field
      );
      
      if (response.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          type: response.data.type,
          options: response.data.options
        };
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при создании кастомного поля:', error);
      return null;
    }
  }

  /**
   * Возвращает ID кастомных полей для колонок Link, Creation Date и Media Type
   */
  async ensureCustomFields(): Promise<{
    sourceUrlId: string;
    originalDateId: string;
    mediaTypeId: string;
  }> {
    console.log('🔍 Использую хардкоженные ID кастомных полей...');
    
    // Хардкожим ID кастомных полей для проекта 16
    const result = {
      sourceUrlId: '9fafcb38-56c0-491a-9ca5-55b4afc8c8d5',      // Link
      originalDateId: '9fafcb85-de56-4479-ac61-44d20511d729',   // Creation Date
      mediaTypeId: '9fafcb44-238f-413f-b7a0-b9608bef253a'        // Media Type
    };
    
    console.log('🔧 Возвращаю ID кастомных полей:', result);
    return result;
  }

  /**
   * Создает задачу в WEEEK
   */
  async createTask(payload: WeeekTaskPayload): Promise<WeeekTask | null> {
    try {
      console.log('📥 Получен payload от TaskBuilder:', JSON.stringify(payload, null, 2));
      
      // Подготавливаем данные для API
      const apiPayload: any = {
        title: payload.title,
        description: payload.description
      };

      // Добавляем теги если они есть - в WEEEK это колонка Tags с мультиселектом
      if (payload.tags && payload.tags.length > 0) {
        // Пробуем отправить как строку через запятую
        apiPayload.tags = payload.tags.join(', ');
        
        // Также пробуем как массив
        apiPayload.tagArray = payload.tags;
      }

      // Добавляем кастомные поля в правильном формате для WEEEK API
      if (payload.customFields && Object.keys(payload.customFields).length > 0) {
        // WEEEK API ожидает customFields как объект с ключ-значение
        // где ключ = ID кастомного поля, значение = значение поля
        apiPayload.customFields = payload.customFields;
        
        console.log('🔧 Отправляю customFields в формате объекта:', payload.customFields);
      }

      // Добавляем ID проекта если указан
      if (payload.projectId) {
        apiPayload.projectId = payload.projectId;
      }

      console.log('📤 Отправляю в WEEEK API:', JSON.stringify(apiPayload, null, 2));
      const response = await this.api.post('/tm/tasks', apiPayload);
      
      if (response.data) {
        console.log('✅ Ответ от WEEEK API:', JSON.stringify(response.data, null, 2));
        return {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          customFields: response.data.customFields
        };
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Детали ошибки:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Ищет существующие задачи по заголовку или описанию
   */
  async searchTasks(query: string): Promise<WeeekTask[]> {
    try {
      // WEEEK API может не поддерживать полнотекстовый поиск
      // Поэтому получаем все задачи и фильтруем локально
      const response = await this.api.get('/tm/tasks');
      
      if (response.data && Array.isArray(response.data)) {
        return response.data
          .filter((task: any) => 
            task.title?.includes(query) || 
            task.description?.includes(query)
          )
          .map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            customFields: task.customFields
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при поиске задач:', error);
      return [];
    }
  }

  /**
   * Загружает все существующие ссылки в Map для быстрой проверки
   */
  private async loadExistingLinks(): Promise<void> {
    if (this.existingLinksMap !== null) {
      return; // Уже загружено
    }

    try {
      console.log('🔍 Загружаю все существующие задачи для проверки дублирования...');
      const response = await this.api.get('/tm/tasks');
      
      if (!response.data || !response.data.success || !Array.isArray(response.data.tasks)) {
        console.log('⚠️  Не удалось получить задачи из API');
        this.existingLinksMap = new Map();
        return;
      }

      let tasks = response.data.tasks;
      const projectId = this.config.weeekSpaceOrProjectId;

      // Если указан проект, фильтруем задачи по проекту
      if (projectId) {
        tasks = tasks.filter((task: any) => task.projectId == projectId);
        console.log(`🔍 Фильтруем задачи по проекту ${projectId}, найдено ${tasks.length} задач`);
      }

      // Создаем Map с ссылками из кастомного поля Link
      this.existingLinksMap = new Map();
      const linkFieldId = '9fafcb38-56c0-491a-9ca5-55b4afc8c8d5'; // ID поля Link

      for (const task of tasks) {
        if (task.customFields && Array.isArray(task.customFields)) {
          const linkField = task.customFields.find((field: any) => field.id === linkFieldId);
          if (linkField && linkField.value) {
            this.existingLinksMap.set(linkField.value, true);
          }
        }
      }

      console.log(`✅ Загружено ${this.existingLinksMap.size} существующих ссылок в Map`);
    } catch (error) {
      console.error('Ошибка при загрузке существующих ссылок:', error);
      this.existingLinksMap = new Map();
    }
  }

  /**
   * Проверяет, существует ли уже задача с указанной ссылкой
   */
  async taskExists(fileName: string, sourceUrl: string): Promise<boolean> {
    try {
      // Загружаем существующие ссылки если еще не загружены
      await this.loadExistingLinks();
      
      // Проверяем наличие ссылки в Map
      const exists = this.existingLinksMap!.has(sourceUrl);
      
      if (exists) {
        console.log(`🔍 Найдена существующая задача по ссылке: ${sourceUrl}`);
      } else {
        console.log(`🔍 Ссылка ${sourceUrl} не найдена в существующих задачах`);
      }
      
      return exists;
    } catch (error) {
      console.error('Ошибка при проверке существования задачи:', error);
      return false;
    }
  }

  /**
   * Создает задачи батчами
   */
  async createTasksBatch(
    tasks: WeeekTaskPayload[], 
    batchSize: number = 20
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      console.log(`Обрабатываю батч ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`);
      
      for (const task of batch) {
        try {
          await this.createTask(task);
          results.success++;
          
          // Небольшая задержка между запросами
          if (this.config.requestDelayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.requestDelayMs));
          }
        } catch (error) {
          results.failed++;
          const errorMsg = `Ошибка при создании задачи "${task.title}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }
    
    return results;
  }

  /**
   * Получает список тегов из WEEEK
   */
  async getTags(): Promise<any[]> {
    try {
      const response = await this.api.get('/tags');
      console.log('🏷️  Существующие теги в WEEEK:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении тегов:', error);
      return [];
    }
  }
} 