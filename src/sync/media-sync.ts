import { MediaItem, NormalizedLink, SyncResult, Config } from '../types';
import { LinkNormalizer } from '../input/links';
import { ProviderFactory } from '../providers/factory';
import { WeeekClient } from '../weeek/client';
import { TaskBuilder } from '../weeek/task-builder';

export class MediaSync {
  private readonly config: Config;
  private readonly weeekClient: WeeekClient;

  constructor(config: Config) {
    this.config = config;
    this.weeekClient = new WeeekClient(config);
  }

  /**
   * Выполняет синхронизацию медиафайлов
   */
  async sync(inputLinks: string[], isDryRun: boolean = false): Promise<SyncResult> {
    console.log(`Начинаю синхронизацию ${inputLinks.length} ссылок...`);
    if (isDryRun) {
      console.log('⚠️  Режим DRY-RUN - задачи не будут созданы');
    }

    const result: SyncResult = {
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Проверяем соединение с WEEEK
      console.log('Проверяю соединение с WEEEK...');
      if (!await this.weeekClient.testConnection()) {
        throw new Error('Не удалось подключиться к WEEEK API');
      }
      console.log('✅ Соединение с WEEEK установлено');

      // 2. Обеспечиваем существование кастомных полей
      console.log('Проверяю кастомные поля...');
      // Получаем ID кастомных полей
      const customFieldIds = await this.weeekClient.ensureCustomFields();
      console.log('🔧 Получены ID кастомных полей:', customFieldIds);
      console.log('✅ Кастомные поля готовы');

      // 3. Нормализуем и валидируем ссылки
      console.log('Нормализую ссылки...');
      const validLinks = LinkNormalizer.validateLinks(inputLinks);
      if (validLinks.length === 0) {
        throw new Error('Нет валидных ссылок для обработки');
      }
      console.log(`✅ Найдено ${validLinks.length} валидных ссылок`);

      // 4. Собираем медиафайлы
      console.log('Собираю медиафайлы...');
      const allMediaItems = await this.collectMediaItems(validLinks);
      console.log(`✅ Собрано ${allMediaItems.length} медиафайлов`);

      // 5. Фильтруем только медиафайлы
      const mediaItems = allMediaItems.filter(item => 
        item.mediaType === 'photo' || item.mediaType === 'video'
      );
      console.log(`✅ Отфильтровано ${mediaItems.length} медиафайлов`);

      if (isDryRun) {
        // В режиме dry-run показываем план
        await this.showDryRunPlan(mediaItems, customFieldIds);
        return result;
      }

      // 6. Создаем задачи в WEEEK
      console.log('Создаю задачи в WEEEK...');
      if (this.config.weeekSpaceOrProjectId) {
        console.log(`📁 Проект: ${this.config.weeekSpaceOrProjectId}`);
      } else {
        console.log('⚠️  ID проекта не указан - задачи будут созданы в корневом проекте');
      }
      const syncResult = await this.createTasks(mediaItems, customFieldIds);
      
      result.created = syncResult.success;
      result.skipped = syncResult.failed;
      result.errors = syncResult.errors.map(error => ({ url: 'TASK_CREATION', error }));

      console.log(`✅ Синхронизация завершена: ${result.created} создано, ${result.skipped} пропущено`);
      
    } catch (error) {
      const errorMsg = `Критическая ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      result.errors.push({ url: 'SYSTEM', error: errorMsg });
    }

    return result;
  }

  /**
   * Собирает медиафайлы из всех ссылок
   */
  public async collectMediaItems(links: string[]): Promise<MediaItem[]> {
    const allItems: MediaItem[] = [];
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`Обрабатываю ссылку ${i + 1}/${links.length}: ${link}`);
      
      try {
        const normalizedLink = LinkNormalizer.normalize(link);
        const provider = ProviderFactory.getProviderForUrl(link);
        
        const items = await provider.listMediaItems(link, normalizedLink.provider);
        allItems.push(...items);
        
        console.log(`  ✅ Найдено ${items.length} файлов`);
        
        // Небольшая задержка между запросами
        if (i < links.length - 1 && this.config.requestDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.requestDelayMs));
        }
        
      } catch (error) {
        const errorMsg = `Ошибка при обработке ссылки "${link}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
        console.error(`  ❌ ${errorMsg}`);
        // Продолжаем обработку других ссылок
      }
    }
    
    return allItems;
  }

  /**
   * Создает задачи в WEEEK
   */
  private async createTasks(
    mediaItems: MediaItem[], 
    customFieldIds: { sourceUrlId: string; originalDateId: string; mediaTypeId: string; }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const tasksToCreate: any[] = [];
    let skippedCount = 0;
    
    // Проверяем существующие задачи и строим новые
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      console.log(`Подготавливаю задачу ${i + 1}/${mediaItems.length}: ${item.fileName}`);
      
      try {
        const dedupId = TaskBuilder.buildDedupId(item);
        
        // Проверяем, не существует ли уже такая задача
        // Передаем название файла и прямую ссылку для проверки дублирования
        const linkToCheck = item.directUrl || item.sourcePublicUrl;
        if (await this.weeekClient.taskExists(item.fileName, linkToCheck)) {
          console.log(`  ⏭️  Задача уже существует, пропускаю`);
          skippedCount++;
          continue;
        }
        
        // Строим задачу
        const task = TaskBuilder.buildTask(item, {
          customFieldIds,
          projectId: this.config.weeekSpaceOrProjectId
        });
        
        tasksToCreate.push(task);
        console.log(`  ✅ Задача подготовлена`);
        
      } catch (error) {
        const errorMsg = `Ошибка при подготовке задачи для "${item.fileName}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
        console.error(`  ❌ ${errorMsg}`);
        // Продолжаем обработку других файлов
      }
    }
    
    console.log(`Подготовлено ${tasksToCreate.length} задач для создания, пропущено ${skippedCount} дубликатов`);
    
    if (tasksToCreate.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }
    
    // Создаем задачи батчами
    const batchResult = await this.weeekClient.createTasksBatch(tasksToCreate, this.config.maxTasksPerBatch);
    
    // Добавляем пропущенные дубликаты к общему результату
    return {
      success: batchResult.success,
      failed: batchResult.failed + skippedCount,
      errors: batchResult.errors
    };
  }

  /**
   * Показывает план синхронизации в режиме dry-run
   */
  private async showDryRunPlan(
    mediaItems: MediaItem[], 
    customFieldIds: { sourceUrlId: string; originalDateId: string; mediaTypeId: string; }
  ): Promise<void> {
    console.log('\n📋 ПЛАН СИНХРОНИЗАЦИИ:');
    console.log('=' .repeat(80));
    
    let newTasksCount = 0;
    let existingTasksCount = 0;
    
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const dedupId = TaskBuilder.buildDedupId(item);
      const task = TaskBuilder.buildTask(item, {
        customFieldIds,
        projectId: this.config.weeekSpaceOrProjectId
      });
      
      // Проверяем, существует ли уже задача
      const linkToCheck = item.directUrl || item.sourcePublicUrl;
      const exists = await this.weeekClient.taskExists(item.fileName, linkToCheck);
      
      if (exists) {
        console.log(`${i + 1}. ${task.title} ⏭️  УЖЕ СУЩЕСТВУЕТ`);
        existingTasksCount++;
      } else {
        console.log(`${i + 1}. ${task.title} ✅ БУДЕТ СОЗДАНА`);
        newTasksCount++;
      }
      
      console.log(`   Ссылка: ${item.sourcePublicUrl}`);
      if (this.config.weeekSpaceOrProjectId) {
        console.log(`   Проект: ${this.config.weeekSpaceOrProjectId}`);
      }
      console.log('');
    }
    
    console.log(`📊 СТАТИСТИКА:`);
    console.log(`   Новых задач: ${newTasksCount}`);
    console.log(`   Уже существует: ${existingTasksCount}`);
    console.log(`   Всего файлов: ${mediaItems.length}`);
    console.log('');
    
    if (this.config.weeekSpaceOrProjectId) {
      console.log(`📁 Проект: ${this.config.weeekSpaceOrProjectId}`);
    }
    console.log(`🏷️  Теги: Photo для фото, Video для видео`);
  }

  /**
   * Форматирует размер файла
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
} 