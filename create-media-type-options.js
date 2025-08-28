// Создание опций для select поля Media Type в WEEEK
const axios = require('axios');
require('dotenv').config();

const WEEEK_API_TOKEN = process.env.WEEEK_API_TOKEN;
const MEDIA_TYPE_FIELD_ID = '9faeb00e-bce5-4ccb-accf-d2af3bff65da'; // ID поля Media Type

if (!WEEEK_API_TOKEN) {
  console.error('❌ Не указан WEEEK_API_TOKEN в .env');
  process.exit(1);
}

const weeekApi = axios.create({
  baseURL: 'https://api.weeek.net/public/v1',
  headers: {
    'Authorization': `Bearer ${WEEEK_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function createMediaTypeOption(name, color) {
  try {
    console.log(`🔧 Создаю опцию: ${name} (цвет: ${color})`);
    
    const payload = {
      name: name,
      color: color // Используем enum значения: blue, light_blue, dark_purple, purple, dark_pink, pink, light_pink, red
    };
    
    console.log('📤 Отправляю:', JSON.stringify(payload, null, 2));
    
    // Правильный эндпоинт согласно документации
    const response = await weeekApi.post(`/tm/custom-fields/${MEDIA_TYPE_FIELD_ID}/options`, payload);
    
    console.log('✅ Опция создана:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(`❌ Ошибка при создании опции "${name}":`, error.response?.data || error.message);
    return null;
  }
}

async function getCustomFieldOptions() {
  try {
    console.log('🔍 Получаю существующие опции для поля Media Type...');
    
    // Правильный эндпоинт согласно документации
    const response = await weeekApi.get(`/tm/custom-fields/${MEDIA_TYPE_FIELD_ID}/options`);
    
    console.log('📋 Существующие опции:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении опций:', error.response?.data || error.message);
    return null;
  }
}

async function runCreateOptions() {
  console.log('🚀 Создаю опции для select поля Media Type');
  console.log('🔑 API токен:', WEEEK_API_TOKEN.substring(0, 10) + '...');
  console.log('🏷️  ID поля Media Type:', MEDIA_TYPE_FIELD_ID);
  
  // Сначала получаем существующие опции
  const existingOptions = await getCustomFieldOptions();
  
  if (existingOptions && existingOptions.length > 0) {
    console.log('\n📋 Найдены существующие опции:');
    existingOptions.forEach(option => {
      console.log(`  - ${option.name} (ID: ${option.id})`);
    });
    
    // Проверяем, есть ли уже нужные опции
    const hasPhoto = existingOptions.some(opt => 
      opt.name.toLowerCase().includes('фото') || 
      opt.name.toLowerCase().includes('photo')
    );
    
    const hasVideo = existingOptions.some(opt => 
      opt.name.toLowerCase().includes('видео') || 
      opt.name.toLowerCase().includes('video')
    );
    
    if (hasPhoto && hasVideo) {
      console.log('\n✅ Нужные опции уже существуют!');
      console.log('🔧 ID для хардкода:');
      existingOptions.forEach(option => {
        if (option.name.toLowerCase().includes('фото') || option.name.toLowerCase().includes('photo')) {
          console.log(`  Фото: ${option.id}`);
        }
        if (option.name.toLowerCase().includes('видео') || option.name.toLowerCase().includes('video')) {
          console.log(`  Видео: ${option.id}`);
        }
      });
      return;
    }
  }
  
  // Создаем опции
  console.log('\n🔧 Создаю новые опции...');
  
  const photoOption = await createMediaTypeOption('Фото', 'blue');
  const videoOption = await createMediaTypeOption('Видео', 'red');
  
  console.log('\n📊 РЕЗУЛЬТАТЫ СОЗДАНИЯ:');
  console.log('=' .repeat(50));
  
  if (photoOption) {
    console.log(`✅ Фото: ${photoOption.option.id}`);
  }
  
  if (videoOption) {
    console.log(`✅ Видео: ${videoOption.option.id}`);
  }
  
  if (photoOption && videoOption) {
    console.log('\n🔧 ID для хардкода:');
    console.log(`  Фото: ${photoOption.option.id}`);
    console.log(`  Видео: ${videoOption.option.id}`);
  }
}

// Запускаем создание опций
runCreateOptions().catch(console.error); 