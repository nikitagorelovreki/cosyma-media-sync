/**
 * ⚠️  WEEEK Integration (DEPRECATED)
 * 
 * This is the WEEEK integration entry point, which is deprecated.
 * The main functionality of this application is Google Sheets export.
 * 
 * For new projects, use:
 *   npm run google-docs          # Export to Google Sheets
 *   npm run google-docs:dry-run  # Preview export
 * 
 * WEEEK integration is kept for backward compatibility only.
 */

import dotenv from 'dotenv';
import { ConfigLoader } from './config';
import { MediaSync } from './sync/media-sync';
import { SyncResult } from './types';

async function main() {
  try {
    console.log('🚀 Media Sync - Синхронизация медиафайлов в WEEEK');
    console.log('=' .repeat(60));
    
    // Проверяем аргументы командной строки
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run') || args.includes('-d');
    
    if (isDryRun) {
      console.log('🔍 Режим DRY-RUN активирован');
    }
    
    // Загружаем конфигурацию
    console.log('📋 Загружаю конфигурацию...');
    const config = ConfigLoader.load();
    ConfigLoader.printConfig(config);
    
    // Создаем экземпляр синхронизации
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
      console.log('  npm run dev -- --dry-run                    # Интерактивный режим с dry-run');
      console.log('  echo "ссылка1\\nссылка2" | npm run dev      # Режим pipe');
      console.log('  npm run dev < links.txt                     # Чтение из файла');
      process.exit(1);
    }
    
    console.log(`\n🔗 Найдено ${inputLinks.length} ссылок для обработки`);
    
    // Запускаем синхронизацию
    const result: SyncResult = await mediaSync.sync(inputLinks, isDryRun);
    
    // Выводим результаты
    console.log('\n📊 РЕЗУЛЬТАТЫ СИНХРОНИЗАЦИИ:');
    console.log('=' .repeat(40));
    console.log(`✅ Создано: ${result.created}`);
    console.log(`⏭️  Пропущено: ${result.skipped}`);
    
    if (result.errors.length > 0) {
      console.log(`❌ Ошибки: ${result.errors.length}`);
      console.log('\nДетали ошибок:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.url}: ${error.error}`);
      });
    }
    
    if (isDryRun) {
      console.log('\n💡 Для реального запуска уберите флаг --dry-run');
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

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Получен сигнал прерывания, завершаю работу...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Получен сигнал завершения, завершаю работу...');
  process.exit(0);
});

// Запускаем приложение
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Неожиданная ошибка:', error);
    process.exit(1);
  });
} 