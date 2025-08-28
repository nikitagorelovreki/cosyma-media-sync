#!/usr/bin/env node
const axios = require('axios');

// Тестовые данные
const testFile = {
  weblink: 'P1ZJ/WGntm7zig',
  fileName: 'DSC05390.JPG',
  mediaType: 'photo'
};

async function testAllMailruAPIs() {
  console.log('🔍 Тестирую ВСЕ возможные API Mail.ru для получения миниатюр...\n');

  const apis = [
    // 1. Стандартные API миниатюр
    {
      name: 'Стандартный API миниатюр (img.imgsmail.ru)',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?size=200x200`
    },
    {
      name: 'Стандартный API миниатюр (без размера)',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}`
    },
    
    // 2. API через cloud.mail.ru
    {
      name: 'API файла (cloud.mail.ru)',
      url: `https://cloud.mail.ru/api/v2/file?weblink=${testFile.weblink}&path=${testFile.fileName}`
    },
    {
      name: 'API папки (cloud.mail.ru)',
      url: `https://cloud.mail.ru/api/v2/folder?weblink=${testFile.weblink}&path=${testFile.fileName}`
    },
    
    // 3. Прямые ссылки на файлы
    {
      name: 'Прямая ссылка на файл (GET)',
      url: `https://cloud.mail.ru/public/${testFile.weblink}/${testFile.fileName}`,
      method: 'GET'
    },
    {
      name: 'Прямая ссылка на файл (HEAD)',
      url: `https://cloud.mail.ru/public/${testFile.weblink}/${testFile.fileName}`,
      method: 'HEAD'
    },
    
    // 4. Альтернативные домены
    {
      name: 'Альтернативный домен (mail.ru)',
      url: `https://mail.ru/cloud/public/${testFile.weblink}/${testFile.fileName}`
    },
    
    // 5. API с авторизацией (попробуем без токена)
    {
      name: 'API с токеном (без токена)',
      url: `https://cloud.mail.ru/api/v2/thumbnail?weblink=${testFile.weblink}&path=${testFile.fileName}&size=200x200`
    },
    
    // 6. Старые версии API
    {
      name: 'API v1 (старая версия)',
      url: `https://cloud.mail.ru/api/v1/file?weblink=${testFile.weblink}&path=${testFile.fileName}`
    },
    
    // 7. Прямые ссылки на миниатюры с разными размерами
    {
      name: 'Миниатюра 100x100',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?size=100x100`
    },
    {
      name: 'Миниатюра 150x150',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?size=150x150`
    },
    {
      name: 'Миниатюра 300x300',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?size=300x300`
    },
    
    // 8. API для видео
    {
      name: 'API видео миниатюры',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?type=video&size=320x240`
    }
  ];

  for (const api of apis) {
    console.log(`📋 ${api.name}:`);
    console.log(`🔗 URL: ${api.url}`);
    
    try {
      const method = api.method || 'HEAD';
      const response = await axios({
        method: method,
        url: api.url,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,application/json,*/*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      });
      
      console.log(`✅ Статус: ${response.status}`);
      console.log(`📏 Content-Type: ${response.headers['content-type'] || 'не указан'}`);
      console.log(`📊 Content-Length: ${response.headers['content-length'] || 'не указан'}`);
      
      // Если это JSON ответ, покажем структуру
      if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        console.log(`📄 JSON ответ: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Статус: ${error.response.status}`);
        console.log(`🚫 Ошибка: ${error.response.statusText}`);
        
        // Покажем заголовки ответа для анализа
        if (error.response.headers) {
          console.log(`📋 Заголовки: ${JSON.stringify(error.response.headers, null, 2).substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ Ошибка: ${error.message}`);
      }
    }
    
    console.log('---\n');
  }
}

// Запуск теста
testAllMailruAPIs().catch(console.error); 