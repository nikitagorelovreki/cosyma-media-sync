# 🚀 Быстрый старт Media Sync

## 1. Установка
```bash
npm install
```

## 2. Настройка
```bash
cp env.example .env
# Отредактируйте .env файл с вашими данными WEEEK
```

## 3. Запуск

### Тестовый режим (dry-run):
```bash
npm run dev -- --dry-run
```

### Реальный запуск:
```bash
npm run dev
```

### Из файла:
```bash
npm run dev < examples/links.txt
```

## 📋 Что нужно в .env:
- `WEEEK_API_TOKEN` - ваш токен из developers.weeek.net
- `WEEEK_BOARD_ID` - ID доски в WEEEK
- `WEEEK_COLUMN_ID` - ID колонки в доске

## 🔗 Поддерживаемые ссылки:
- Яндекс.Диск: `https://disk.yandex.ru/d/...`
- Яндекс.360: `https://disk.360.yandex.ru/d/...`
- Mail.ru: `https://cloud.mail.ru/public/...`

## ✅ Готово!
Система автоматически:
- Создаст кастомные поля в WEEEK
- Соберет медиафайлы из ссылок
- Создаст задачи с метаданными
- Предотвратит дублирование 