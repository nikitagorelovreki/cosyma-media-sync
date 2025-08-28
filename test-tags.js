// Тест для проверки тегов WEEEK
const { WeeekClient } = require('./dist/weeek/client');
const { ConfigLoader } = require('./dist/config');

async function testTags() {
  try {
    // Загружаем конфигурацию
    const config = ConfigLoader.load();
    console.log('✅ Конфигурация загружена');
    
    // Создаем клиент WEEEK
    const weeekClient = new WeeekClient(config);
    
    // Проверяем соединение
    console.log('🔍 Проверяю соединение с WEEEK...');
    if (!await weeekClient.testConnection()) {
      throw new Error('Не удалось подключиться к WEEEK API');
    }
    console.log('✅ Соединение с WEEEK установлено');
    
    // Получаем существующие теги
    console.log('🏷️  Получаю существующие теги...');
    const tags = await weeekClient.getTags();
    console.log('📋 Теги в WEEEK:', tags);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    process.exit(1);
  }
}

// Запускаем тест
testTags(); 