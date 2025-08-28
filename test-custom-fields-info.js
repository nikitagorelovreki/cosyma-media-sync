// Тест для получения информации о кастомных полях WEEEK
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

async function getCustomFieldsInfo() {
  try {
    console.log('🔍 Получаю информацию о кастомных полях...');
    
    // Получаем все кастомные поля
    const response = await weeekApi.get('/custom-fields');
    console.log('📋 Все кастомные поля:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении кастомных полей:', error.response?.data || error.message);
    return null;
  }
}

async function getProjectInfo() {
  try {
    console.log('🔍 Получаю информацию о проекте...');
    
    const response = await weeekApi.get(`/tm/projects/${PROJECT_ID}`);
    console.log('📁 Информация о проекте:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении информации о проекте:', error.response?.data || error.message);
    return null;
  }
}

async function getTaskInfo(taskId) {
  try {
    console.log(`🔍 Получаю информацию о задаче ${taskId}...`);
    
    const response = await weeekApi.get(`/tm/tasks/${taskId}`);
    console.log('📝 Информация о задаче:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении информации о задаче:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateTask(taskId) {
  try {
    console.log(`🔧 Пробую обновить задачу ${taskId}...`);
    
    // Пробуем обновить существующую задачу
    const updatePayload = {
      customFields: [
        { id: '9faeb00e-bce5-4ccb-accf-d2af3bff65da', value: 'Фото' },
        { id: '9faeb02c-4521-480f-aeaf-54e2a234b2ae', value: 'https://example.com/update' },
        { id: '9faeb096-8a8d-401c-95c9-0a38e6c87a80', value: '2024-04-24' }
      ]
    };
    
    console.log('📤 Отправляю обновление:', JSON.stringify(updatePayload, null, 2));
    
    const response = await weeekApi.put(`/tm/tasks/${taskId}`, updatePayload);
    console.log('✅ Задача обновлена:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при обновлении задачи:', error.response?.data || error.message);
    return null;
  }
}

async function runInfoTests() {
  console.log('🚀 Начинаю анализ кастомных полей WEEEK');
  console.log('📁 Проект ID:', PROJECT_ID);
  console.log('🔑 API токен:', WEEEK_API_TOKEN.substring(0, 10) + '...');
  
  // Получаем информацию о кастомных полях
  const customFields = await getCustomFieldsInfo();
  
  // Получаем информацию о проекте
  const projectInfo = await getProjectInfo();
  
  // Получаем информацию о последней созданной задаче
  const lastTaskId = 406; // Из предыдущего теста
  const taskInfo = await getTaskInfo(lastTaskId);
  
  // Пробуем обновить задачу
  const updateResult = await testUpdateTask(lastTaskId);
  
  console.log('\n📊 АНАЛИЗ ЗАВЕРШЕН');
  console.log('=' .repeat(50));
  
  if (customFields) {
    console.log('✅ Информация о кастомных полях получена');
  }
  
  if (projectInfo) {
    console.log('✅ Информация о проекте получена');
  }
  
  if (taskInfo) {
    console.log('✅ Информация о задаче получена');
  }
  
  if (updateResult) {
    console.log('✅ Задача успешно обновлена');
  }
}

// Запускаем тесты
runInfoTests().catch(console.error); 