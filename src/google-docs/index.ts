#!/usr/bin/env node

import { ConfigLoader } from '../config';
import { GoogleDocsClient } from './client';
import { GoogleDocsExporter } from './exporter';
import { MediaSync } from '../sync/media-sync';
import { MediaItemWithThumbnail } from '../types';

async function main() {
  try {
    console.log('🚀 Media Sync - Экспорт в Google Docs');
    console.log('=' .repeat(50));
    
    // Проверяем аргументы командной строки
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run') || args.includes('-d');
    
    if (isDryRun) {
      console.log('🔍 Режим DRY-RUN активирован');
    }
    
    // Загружаем конфигурацию
    console.log('📋 Загружаю конфигурацию...');
    const config = ConfigLoader.load();
    
    // Проверяем, включен ли Google Docs
    if (!config.googleDocs?.enabled) {
      console.error('❌ Google Docs не включен в конфигурации');
      console.log('Добавьте в .env файл:');
      console.log('GOOGLE_DOCS_ENABLED=true');
      console.log('GOOGLE_SPREADSHEET_ID=your_spreadsheet_id');
      console.log('GOOGLE_CREDENTIALS_PATH=path/to/credentials.json');
      process.exit(1);
    }
    
    // Инициализируем Google Docs клиент
    console.log('🔧 Инициализирую Google Docs...');
    const googleDocsClient = new GoogleDocsClient(config.googleDocs);
    const exporter = new GoogleDocsExporter(googleDocsClient);
    
    // Создаем экземпляр синхронизации для получения медиафайлов
    const mediaSync = new MediaSync(config);
    
    // Читаем ссылки из stdin или файла
    let inputLinks: string[] = [];
    
    if (process.stdin.isTTY) {
      // Интерактивный режим
      console.log('\n📝 Введите ссылки на облачные ресурсы (по одной на строку):');
      console.log('Для завершения ввода нажмите Ctrl+D (Unix) или Ctrl+Z (Windows)');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      inputLinks = await new Promise<string[]>((resolve) => {
        const links: string[] = [];
        rl.on('line', (line: string) => {
          const trimmed = line.trim();
          if (trimmed) {
            links.push(trimmed);
          }
        });
        rl.on('close', () => resolve(links));
      });
      
    } else {
      // Режим pipe из файла
      const fs = require('fs');
      const input = fs.readFileSync(0, 'utf-8');
      // Разбиваем по переносам строк И по пробелам для поддержки нескольких ссылок в одной строке
      inputLinks = input
        .split(/[\n\s]+/) // Разбиваем по переносам строк и пробелам
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    }
    
    if (inputLinks.length === 0) {
      console.log('❌ Не указаны ссылки для обработки');
      console.log('Использование:');
      console.log('  npm run google-docs -- --dry-run                    # Интерактивный режим с dry-run');
      console.log('  echo "ссылка1\\nссылка2" | npm run google-docs      # Режим pipe');
      console.log('  npm run google-docs < links.txt                     # Чтение из файла');
      process.exit(1);
    }
    
    console.log(`\n🔗 Найдено ${inputLinks.length} ссылок для обработки`);
    
    if (isDryRun) {
      console.log('⚠️  Режим DRY-RUN - экспорт не будет выполнен');
      console.log('📊 Показываю план экспорта...');
      
      // Получаем медиафайлы для dry-run
      const mediaItems = await mediaSync.collectMediaItems(inputLinks);
      const enrichedItems = mediaItems as MediaItemWithThumbnail[];
      
      // Показываем план экспорта
      exporter.createExportSummary(enrichedItems);
      
      console.log('\n💡 Для реального экспорта уберите флаг --dry-run');
      
    } else {
      // Реальный экспорт
      console.log('🚀 Начинаю экспорт в Google Docs...');
      
      // Получаем медиафайлы
      const mediaItems = await mediaSync.collectMediaItems(inputLinks);
      const enrichedItems = mediaItems as MediaItemWithThumbnail[];
      
      // Экспортируем в Google Docs
      const result = await exporter.exportMediaItems(enrichedItems);
      
      // Показываем сводку
      exporter.createExportSummary(enrichedItems);
      
      if (result.success) {
        console.log('\n🎉 ЭКСПОРТ ЗАВЕРШЕН УСПЕШНО!');
        console.log('=' .repeat(40));
        console.log(`✅ Экспортировано строк: ${result.rowsExported}`);
        console.log(`🔗 Ссылка на таблицу: ${result.spreadsheetUrl}`);
      } else {
        console.log('\n❌ ЭКСПОРТ ЗАВЕРШЕН С ОШИБКАМИ');
        console.log('=' .repeat(40));
        console.log(`❌ Ошибки: ${result.errors?.length || 0}`);
        if (result.errors) {
          result.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
          });
        }
        process.exit(1);
      }
    }
    
    console.log('\n🎉 Готово!');
    
  } catch (error) {
    console.error('\n💥 Критическая ошибка:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    
    if (error instanceof Error && error.stack) {
      console.error('\nСтек вызовов:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  main();
} 