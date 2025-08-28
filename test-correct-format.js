// Тест с правильным форматом customFields согласно документации WEEEK API
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

// ID кастомных полей
const CUSTOM_FIELDS = {
  MEDIA_TYPE: '9faeb00e-bce5-4ccb-accf-d2af3bff65da',    // Media Type (select)
  LINK: '9faeb02c-4521-480f-aeaf-54e2a234b2ae',          // Link (link)
  CREATION_DATE: '9faeb096-8a8d-401c-95c9-0a38e6c87a80'  // Creation Date (datetime)
};

async function testCorrectFormat() {
  try {
    console.log('🧪 Тестирую правильный формат customFields согласно документации WEEEK API');
    
    // Согласно документации: customFields должен быть объектом с ключ-значение
    const payload = {
      title: 'Тест правильного формата customFields',
      description: 'Тестирую формат согласно документации WEEEK API',
      projectId: PROJECT_ID,
      customFields: {
        [CUSTOM_FIELDS.MEDIA_TYPE]: '9faebbd6-83ed-4722-a2f4-7e8726825adc',    // select поле - ID опции "Фото"
        [CUSTOM_FIELDS.LINK]: 'https://example.com/test',                      // link поле
        [CUSTOM_FIELDS.CREATION_DATE]: '2024-04-24T00:00:00Z'                 // datetime поле в ISO 8601
      }
    };
    
    console.log('📤 Отправляю payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await weeekApi.post('/tm/tasks', payload);
    
    console.log('\n✅ Задача создана успешно!');
    console.log('🆔 ID задачи:', response.data.task.id);
    
    console.log('\n📋 Ответ с кастомными полями:');
    console.log(JSON.stringify(response.data.task.customFields, null, 2));
    
    // Проверяем, заполнились ли кастомные поля
    const hasValues = response.data.task.customFields.some(field => field.value !== null);
    console.log(`\n🎯 Кастомные поля заполнены: ${hasValues ? 'ДА' : 'НЕТ'}`);
    
    if (hasValues) {
      console.log('🎉 УСПЕХ! Найден рабочий формат!');
      
      // Показываем заполненные поля
      response.data.task.customFields.forEach(field => {
        if (field.value !== null) {
          console.log(`  ✅ ${field.name || field.id}: ${field.value}`);
        } else {
          console.log(`  ❌ ${field.name || field.id}: пусто`);
        }
      });
    } else {
      console.log('😞 Кастомные поля не заполнились');
      console.log('💡 Возможно, нужны другие значения или формат');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    return null;
  }
}

// Запускаем тест
testCorrectFormat().catch(console.error); 