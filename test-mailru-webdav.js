#!/usr/bin/env node
const axios = require('axios');

// Тестовые данные
const testFile = {
  weblink: 'P1ZJ/WGntm7zig',
  fileName: 'DSC05390.JPG'
};

async function testWebDAV() {
  console.log('🔍 Тестирую WebDAV API Mail.ru Cloud...\n');

  const webdavUrls = [
    {
      name: 'WebDAV через cloud.mail.ru',
      url: `https://cloud.mail.ru/public/${testFile.weblink}/${testFile.fileName}`
    },
    {
      name: 'WebDAV через mail.ru',
      url: `https://mail.ru/cloud/public/${testFile.weblink}/${testFile.fileName}`
    },
    {
      name: 'WebDAV с авторизацией',
      url: `https://cloud.mail.ru/webdav/public/${testFile.weblink}/${testFile.fileName}`
    },
    {
      name: 'Прямой доступ через WebDAV',
      url: `https://webdav.cloud.mail.ru/public/${testFile.weblink}/${testFile.fileName}`
    }
  ];

  for (const webdav of webdavUrls) {
    console.log(`📋 ${webdav.name}:`);
    console.log(`🔗 URL: ${webdav.url}`);
    
    try {
      // Пробуем PROPFIND (WebDAV метод)
      const response = await axios({
        method: 'PROPFIND',
        url: webdav.url,
        timeout: 10000,
        headers: {
          'Depth': '0',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ Статус: ${response.status}`);
      console.log(`📏 Content-Type: ${response.headers['content-type'] || 'не указан'}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Статус: ${error.response.status}`);
        console.log(`🚫 Ошибка: ${error.response.statusText}`);
        
        // Если PROPFIND не поддерживается, пробуем GET
        if (error.response.status === 405) {
          console.log(`🔄 Пробую GET метод...`);
          try {
            const getResponse = await axios.get(webdav.url, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            console.log(`✅ GET успешен: ${getResponse.status}`);
          } catch (getError) {
            console.log(`❌ GET тоже не работает: ${getError.response?.status || getError.message}`);
          }
        }
      } else {
        console.log(`❌ Ошибка: ${error.message}`);
      }
    }
    
    console.log('---\n');
  }
}

// Запуск теста
testWebDAV().catch(console.error); 