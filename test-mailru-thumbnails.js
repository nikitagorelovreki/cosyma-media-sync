#!/usr/bin/env node
const axios = require('axios');

// Тестовые данные
const testFile = {
  weblink: 'P1ZJ/WGntm7zig',
  fileName: 'DSC05390.JPG',
  mediaType: 'photo'
};

async function testThumbnailMethods() {
  console.log('🔍 Тестирую различные способы получения миниатюр Mail.ru Cloud...\n');

  const methods = [
    {
      name: 'Стандартный API миниатюр',
      url: `https://img.imgsmail.ru/thumbnails/${testFile.weblink}/${testFile.fileName}?size=200x200`
    },
    {
      name: 'Прямая ссылка на файл',
      url: `https://cloud.mail.ru/public/${testFile.weblink}/${testFile.fileName}`
    },
    {
      name: 'API через cloud.mail.ru',
      url: `https://cloud.mail.ru/api/v2/file?weblink=${testFile.weblink}&path=${testFile.fileName}`
    },
    {
      name: 'Миниатюра через API',
      url: `https://cloud.mail.ru/api/v2/thumbnail?weblink=${testFile.weblink}&path=${testFile.fileName}&size=200x200`
    }
  ];

  for (const method of methods) {
    console.log(`📋 ${method.name}:`);
    console.log(`🔗 URL: ${method.url}`);
    
    try {
      const response = await axios.head(method.url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ Статус: ${response.status}`);
      console.log(`📏 Content-Type: ${response.headers['content-type'] || 'не указан'}`);
      console.log(`📊 Content-Length: ${response.headers['content-length'] || 'не указан'}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Статус: ${error.response.status}`);
        console.log(`🚫 Ошибка: ${error.response.statusText}`);
      } else {
        console.log(`❌ Ошибка: ${error.message}`);
      }
    }
    
    console.log('---\n');
  }
}

// Запуск теста
testThumbnailMethods().catch(console.error); 