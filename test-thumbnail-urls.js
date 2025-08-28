#!/usr/bin/env node

// Тестовые данные
const testFiles = [
  {
    fileName: 'DSC06673.JPG',
    weblink: 'P1ZJ/WGntm7zig',
    mediaType: 'photo'
  },
  {
    fileName: 'DSC07383.JPG', 
    weblink: 'P1ZJ/WGntm7zig',
    mediaType: 'photo'
  },
  {
    fileName: '2_5319042908463064952.MOV',
    weblink: 'P1ZJ/WGntm7zig',
    mediaType: 'video'
  }
];

function generateThumbnailUrl(weblink, fileName) {
  // НОВЫЙ API миниатюр Mail.ru Cloud!
  // Формат: https://thumb.cloud.mail.ru/weblink/thumb/xw1/{weblink}/{filename}
  return `https://thumb.cloud.mail.ru/weblink/thumb/xw1/${weblink}/${fileName}`;
}

function generateImageFormula(thumbnailUrl) {
  return `=IMAGE("${thumbnailUrl}",1)`;
}

console.log('🔍 Тестирую генерацию URL миниатюр и формул IMAGE...\n');

testFiles.forEach((file, index) => {
  console.log(`📁 Файл ${index + 1}: ${file.fileName}`);
  console.log(`📸 Тип: ${file.mediaType}`);
  
  const thumbnailUrl = generateThumbnailUrl(file.weblink, file.fileName);
  console.log(`🔗 URL миниатюры: ${thumbnailUrl}`);
  
  const imageFormula = generateImageFormula(thumbnailUrl);
  console.log(`📊 Формула IMAGE: ${imageFormula}`);
  
  console.log('---\n');
});

console.log('✅ Все URL и формулы сгенерированы!');
console.log('📋 Скопируйте любую формулу в Google Sheets для тестирования.'); 