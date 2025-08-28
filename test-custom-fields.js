// Тест для подбора правильного формата кастомных полей WEEEK API
const axios = require('axios');
require('dotenv').config();

const WEEEK_API_TOKEN = process.env.WEEEK_API_TOKEN;
const PROJECT_ID = process.env.WEEEK_SPACE_OR_PROJECT_ID;

if (!WEEEK_API_TOKEN || !PROJECT_ID) {
  console.error('❌ Не указаны WEEEK_API_TOKEN или WEEEK_SPACE_OR_PROJECT_ID в .env');
  process.exit(1);
}

const weeekApi = axios.create({
  baseURL: 'https://api.weeek.net/public/v1',
  headers: {
    'Authorization': `Bearer ${WEEEK_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ID кастомных полей из вашего WEEEK
const CUSTOM_FIELDS = {
  MEDIA_TYPE: '9faeb00e-bce5-4ccb-accf-d2af3bff65da',    // Media Type (select)
  LINK: '9faeb02c-4521-480f-aeaf-54e2a234b2ae',          // Link (link)
  CREATION_DATE: '9faeb096-8a8d-401c-95c9-0a38e6c87a80'  // Creation Date (datetime)
};

async function testCustomFieldFormat(formatName, payload) {
  try {
    console.log(`\n🧪 Тестирую формат: ${formatName}`);
    console.log('📤 Отправляю:', JSON.stringify(payload, null, 2));
    
    const response = await weeekApi.post('/tm/tasks', payload);
    
    console.log('✅ Успешно создана задача:', response.data.task.id);
    console.log('📋 Ответ с кастомными полями:', JSON.stringify(response.data.task.customFields, null, 2));
    
    // Проверяем, заполнились ли кастомные поля
    const hasValues = response.data.task.customFields.some(field => field.value !== null);
    console.log(`🎯 Кастомные поля заполнены: ${hasValues ? 'ДА' : 'НЕТ'}`);
    
    return { success: true, taskId: response.data.task.id, hasValues };
  } catch (error) {
    console.error(`❌ Ошибка в формате ${formatName}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  console.log('🚀 Начинаю тестирование форматов кастомных полей WEEEK API');
  console.log('📁 Проект ID:', PROJECT_ID);
  console.log('🔑 API токен:', WEEEK_API_TOKEN.substring(0, 10) + '...');
  
  const results = [];
  
  // Тест 1: Простой массив customFields
  const test1 = await testCustomFieldFormat('Простой массив customFields', {
    title: 'Тест 1: Простой массив',
    description: 'Тестирую простой массив customFields',
    projectId: PROJECT_ID,
    customFields: [
      { id: CUSTOM_FIELDS.MEDIA_TYPE, value: 'Фото' },
      { id: CUSTOM_FIELDS.LINK, value: 'https://example.com/test' },
      { id: CUSTOM_FIELDS.CREATION_DATE, value: '2024-04-24' }
    ]
  });
  results.push({ name: 'Простой массив customFields', ...test1 });
  
  // Тест 2: Объект customFields
  const test2 = await testCustomFieldFormat('Объект customFields', {
    title: 'Тест 2: Объект customFields',
    description: 'Тестирую объект customFields',
    projectId: PROJECT_ID,
    customFields: {
      [CUSTOM_FIELDS.MEDIA_TYPE]: 'Видео',
      [CUSTOM_FIELDS.LINK]: 'https://example.com/video',
      [CUSTOM_FIELDS.CREATION_DATE]: '2024-04-25'
    }
  });
  results.push({ name: 'Объект customFields', ...test2 });
  
  // Тест 3: Отдельные поля с префиксом
  const test3 = await testCustomFieldFormat('Отдельные поля с префиксом', {
    title: 'Тест 3: Отдельные поля с префиксом',
    description: 'Тестирую отдельные поля с префиксом',
    projectId: PROJECT_ID,
    [`field_${CUSTOM_FIELDS.MEDIA_TYPE}`]: 'Фото',
    [`field_${CUSTOM_FIELDS.LINK}`]: 'https://example.com/photo',
    [`field_${CUSTOM_FIELDS.CREATION_DATE}`]: '2024-04-26'
  });
  results.push({ name: 'Отдельные поля с префиксом', ...test3 });
  
  // Тест 4: В metadata
  const test4 = await testCustomFieldFormat('В metadata', {
    title: 'Тест 4: В metadata',
    description: 'Тестирую кастомные поля в metadata',
    projectId: PROJECT_ID,
    metadata: {
      mediaType: 'Видео',
      link: 'https://example.com/metadata',
      creationDate: '2024-04-27'
    }
  });
  results.push({ name: 'В metadata', ...test4 });
  
  // Тест 5: В properties
  const test5 = await testCustomFieldFormat('В properties', {
    title: 'Тест 5: В properties',
    description: 'Тестирую кастомные поля в properties',
    projectId: PROJECT_ID,
    properties: {
      mediaType: 'Фото',
      link: 'https://example.com/properties',
      creationDate: '2024-04-28'
    }
  });
  results.push({ name: 'В properties', ...test5 });
  
  // Тест 6: Сложный формат для select поля
  const test6 = await testCustomFieldFormat('Сложный формат для select', {
    title: 'Тест 6: Сложный формат для select',
    description: 'Тестирую сложный формат для select поля',
    projectId: PROJECT_ID,
    customFields: [
      { 
        id: CUSTOM_FIELDS.MEDIA_TYPE, 
        value: { 
          id: 'photo', 
          name: 'Фото',
          label: 'Фото'
        }
      },
      { id: CUSTOM_FIELDS.LINK, value: 'https://example.com/complex' },
      { id: CUSTOM_FIELDS.CREATION_DATE, value: '2024-04-29' }
    ]
  });
  results.push({ name: 'Сложный формат для select', ...test6 });
  
  // Тест 7: Формат для datetime поля
  const test7 = await testCustomFieldFormat('Формат для datetime', {
    title: 'Тест 7: Формат для datetime',
    description: 'Тестирую формат для datetime поля',
    projectId: PROJECT_ID,
    customFields: [
      { id: CUSTOM_FIELDS.MEDIA_TYPE, value: 'Видео' },
      { id: CUSTOM_FIELDS.LINK, value: 'https://example.com/datetime' },
      { 
        id: CUSTOM_FIELDS.CREATION_DATE, 
        value: {
          date: '2024-04-30',
          time: '12:00:00',
          timestamp: new Date('2024-04-30T12:00:00Z').getTime()
        }
      }
    ]
  });
  results.push({ name: 'Формат для datetime', ...test7 });
  
  // Выводим результаты
  console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const values = result.hasValues ? '🎯 ЗАПОЛНЕНО' : '❌ ПУСТО';
    console.log(`${index + 1}. ${status} ${result.name}: ${values}`);
    if (result.taskId) {
      console.log(`   ID задачи: ${result.taskId}`);
    }
  });
  
  // Находим лучший результат
  const bestResult = results.find(r => r.success && r.hasValues);
  if (bestResult) {
    console.log(`\n🎉 ЛУЧШИЙ ФОРМАТ: ${bestResult.name}`);
    console.log('✅ Кастомные поля успешно заполнены!');
  } else {
    console.log('\n😞 Ни один формат не сработал');
    console.log('💡 Возможно, нужны другие параметры или формат');
  }
}

// Запускаем тесты
runTests().catch(console.error); 