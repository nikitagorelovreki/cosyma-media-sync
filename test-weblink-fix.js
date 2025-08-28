#!/usr/bin/env node

function extractWeblink(url) {
  // Извлекаем weblink из URL вида: https://cloud.mail.ru/public/P1ZJ/WGntm7zig
  // Включаем ВСЮ структуру папок после /public/
  const match = url.match(/\/public\/(.+)/);
  return match ? match[1] : undefined;
}

function generateThumbnailUrl(weblink, fileName) {
  return `https://thumb.cloud.mail.ru/weblink/thumb/xw1/${weblink}/${fileName}`;
}

// Тестовые URL
const testUrls = [
  'https://cloud.mail.ru/public/P1ZJ/WGntm7zig',
  'https://cloud.mail.ru/public/P1ZJ/WGntm7zig/видео',
  'https://cloud.mail.ru/public/ABC123/TestFolder/SubFolder'
];

const testFiles = [
  'DSC07768.JPG',
  'DSC07383.JPG',
  'video.mp4'
];

console.log('🔍 Тестирую исправление извлечения weblink...\n');

testUrls.forEach((url, urlIndex) => {
  console.log(`📁 URL ${urlIndex + 1}: ${url}`);
  
  const weblink = extractWeblink(url);
  console.log(`🔗 Извлеченный weblink: ${weblink}`);
  
  testFiles.forEach((fileName, fileIndex) => {
    const thumbnailUrl = generateThumbnailUrl(weblink, fileName);
    console.log(`  📸 ${fileName}: ${thumbnailUrl}`);
  });
  
  console.log('---\n');
});

console.log('✅ Тест завершен!');
console.log('📋 Теперь weblink включает всю структуру папок.'); 