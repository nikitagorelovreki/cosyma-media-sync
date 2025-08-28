#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки синхронизации
 * Запускает систему в режиме dry-run с тестовыми данными
 */

// Тестовый файл для проверки синхронизации
const { MediaSync } = require('./dist/index');
const { ConfigLoader } = require('./dist/config');

async function testSync() {
  try {
    // Загружаем конфигурацию
    const config = ConfigLoader.load();
    console.log('✅ Конфигурация загружена');
    
    // Создаем экземпляр синхронизации
    const mediaSync = new MediaSync(config);
    
    // Тестовые ссылки
    const testLinks = [
      'https://disk.yandex.ru/d/test-photo.jpg',
      'https://disk.yandex.ru/d/test-video.mp4'
    ];
    
    console.log('\n🧪 Тестирую синхронизацию в режиме DRY-RUN...');
    console.log('=' .repeat(60));
    
    // Запускаем синхронизацию в режиме dry-run
    const result = await mediaSync.sync(testLinks, true);
    
    console.log('\n✅ Тест завершен');
    console.log(`Результат: ${result.created} создано, ${result.skipped} пропущено`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    process.exit(1);
  }
}

// Запускаем тест
testSync(); 