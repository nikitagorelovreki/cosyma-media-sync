#!/usr/bin/env node
const { MailruAuthClient } = require('./src/mailru/auth-client.js');

async function testAuth() {
  console.log('🔐 Тест авторизации в Mail.ru Cloud\n');
  
  // Запрашиваем данные для авторизации
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    const login = await question('📧 Введите логин (email): ');
    const password = await question('🔒 Введите пароль: ');
    const domain = await question('🌐 Введите домен (mail.ru/bk.ru/inbox.ru) [mail.ru]: ') || 'mail.ru';

    console.log('\n🚀 Начинаю авторизацию...\n');

    const client = new MailruAuthClient({ login, password, domain });
    
    const isAuthenticated = await client.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Авторизация успешна! Тестирую получение миниатюры...\n');
      
      // Тестируем получение миниатюры
      const thumbnail = await client.getThumbnailWithAuth('P1ZJ/WGntm7zig', 'DSC05390.JPG');
      
      if (thumbnail) {
        console.log('🎉 Миниатюра получена!');
        console.log(`📏 Размер base64: ${thumbnail.length} символов`);
        console.log(`🔗 Начинается с: ${thumbnail.substring(0, 50)}...`);
      } else {
        console.log('❌ Не удалось получить миниатюру');
      }
      
    } else {
      console.log('❌ Авторизация не удалась');
    }

  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  } finally {
    rl.close();
  }
}

// Запуск теста
testAuth().catch(console.error); 