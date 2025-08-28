#!/usr/bin/env node
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Включаем CORS для Google Sheets
app.use(cors());

// Middleware для логирования
app.use((req: any, res: any, next: any) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  next();
});

// Прокси для миниатюр Mail.ru
app.get('/thumbnail/*', async (req: any, res: any) => {
  try {
    const encodedUrl = req.params[0];
    const originalUrl = decodeURIComponent(encodedUrl);
    
    console.log(`🖼️  Запрос миниатюры: ${originalUrl}`);
    
    // Получаем изображение от Mail.ru
    const response = await axios.get(originalUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://cloud.mail.ru/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    // Передаем заголовки
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });

    // Потоково передаем изображение
    response.data.pipe(res);
    
    console.log(`✅ Миниатюра успешно передана`);
    
  } catch (error) {
    console.error(`❌ Ошибка получения миниатюры:`, error);
    res.status(500).json({ 
      error: 'Не удалось получить миниатюру',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Прокси-сервер запущен на порту ${PORT}`);
  console.log(`🔗 URL для Google Sheets: http://localhost:${PORT}/thumbnail/`);
  console.log(`📋 Пример использования: http://localhost:${PORT}/thumbnail/${encodeURIComponent('https://img.imgsmail.ru/thumbnails/P1ZJ/DSC05390.JPG?size=200x200')}`);
});

export default app; 