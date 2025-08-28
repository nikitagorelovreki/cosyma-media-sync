# Cosyma Media Sync - Google Sheets Integration

🚀 **Автоматический экспорт медиафайлов в Google Sheets с миниатюрами**

Приложение для автоматического сбора медиафайлов из различных облачных хранилищ и экспорта их в Google Sheets с автоматическим получением миниатюр.

## ✨ Основные возможности

### 🎯 **Google Sheets Export (Основная функция)**
- 📊 Автоматическое создание таблиц с медиафайлами
- 🖼️ Автоматическое получение миниатюр для фото и видео
- 📁 Поддержка папок и подпапок
- 🔄 Дублирование на основе ссылок
- 📅 Автоматическое определение дат создания
- 🏷️ Определение типа медиа (фото/видео)

### ☁️ **Поддерживаемые облачные хранилища**
- **Mail.ru Cloud** - полная поддержка с миниатюрами
- **Yandex.Disk** - полная поддержка с миниатюрами
- **Другие провайдеры** - расширяемая архитектура

### 🖼️ **Система миниатюр**
- Автоматическое получение превью из API провайдеров
- Оптимизированные размеры для Google Sheets
- Fallback на генерацию миниатюр через API

## ⚠️ **WEEEK Integration (DEPRECATED)**

> **Внимание:** WEEEK интеграция больше не поддерживается и будет удалена в следующих версиях.
> 
> Основной функционал приложения - экспорт в Google Sheets.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка Google Sheets
1. Создайте Google Service Account
2. Скачайте JSON ключ
3. Создайте Google Sheets таблицу
4. Скопируйте ID таблицы

### 3. Настройка переменных окружения
```bash
cp env.google-docs.example .env
```

Заполните `.env` файл:
```env
GOOGLE_DOCS_ENABLED=true
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_CREDENTIALS_PATH=path/to/your/credentials.json
```

### 4. Запуск экспорта
```bash
# Экспорт в Google Sheets
echo "https://cloud.mail.ru/public/your-link" | npm run google-docs

# Предварительный просмотр (dry-run)
echo "https://cloud.mail.ru/public/your-link" | npm run google-docs:dry-run
```

## 📊 Структура Google Sheets

Приложение создает таблицу с колонками:
- **Название** - имя файла
- **Ссылка** - прямая ссылка на файл
- **Медиатип** - фото/видео
- **Дата создания** - дата загрузки файла
- **Миниатюра** - изображение превью

## 🔧 Команды

```bash
# Основной экспорт в Google Sheets
npm run google-docs

# Предварительный просмотр
npm run google-docs:dry-run

# WEEEK интеграция (DEPRECATED)
npm run sync
npm run sync:dry-run
```

## 📁 Структура проекта

```
src/
├── google-docs/          # 🎯 Google Sheets интеграция
│   ├── client.ts        # Google Sheets API клиент
│   ├── exporter.ts      # Логика экспорта
│   └── index.ts         # Точка входа
├── providers/            # Провайдеры облачных хранилищ
│   ├── mailru.ts        # Mail.ru Cloud
│   └── yandex.ts        # Yandex.Disk
├── thumbnails/          # Система миниатюр
│   └── provider.ts      # Провайдеры миниатюр
├── weeek/               # ⚠️ WEEEK интеграция (DEPRECATED)
└── types/               # TypeScript типы
```

## 🌟 Особенности

- **Автоматическое дублирование** - файлы не добавляются повторно
- **Умная обработка папок** - рекурсивный обход структуры
- **Оптимизированные API вызовы** - минимум запросов к серверам
- **Обработка ошибок** - graceful fallback при проблемах
- **Логирование** - подробная информация о процессе

## 📝 Примеры использования

### Экспорт папки Mail.ru Cloud
```bash
echo "https://cloud.mail.ru/public/your-folder" | npm run google-docs
```

### Экспорт папки Yandex.Disk
```bash
echo "https://disk.yandex.ru/d/your-folder" | npm run google-docs
```

### Экспорт нескольких ссылок
```bash
echo "https://cloud.mail.ru/public/link1
https://disk.yandex.ru/d/link2" | npm run google-docs
```

## 🔒 Безопасность

- Google Service Account для безопасного доступа
- Переменные окружения для конфиденциальных данных
- Автоматическое исключение ключей из git

## 🤝 Поддержка

- **Основная функция**: Google Sheets экспорт
- **WEEEK интеграция**: DEPRECATED, не поддерживается
- **Новые провайдеры**: расширяемая архитектура

## 📄 Лицензия

MIT License

---

**Примечание**: Это приложение оптимизировано для работы с Google Sheets. WEEEK интеграция сохранена для обратной совместимости, но не рекомендуется к использованию. 