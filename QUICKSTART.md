# 🚀 Быстрый старт - Google Sheets Export

## ⚡ За 5 минут от установки до первого экспорта

### 1. Установка
```bash
git clone https://github.com/nikitagorelovreki/cosyma-media-sync.git
cd cosyma-media-sync
npm install
```

### 2. Настройка Google Sheets
1. **Создайте Google Service Account:**
   - Перейдите в [Google Cloud Console](https://console.cloud.google.com)
   - Создайте новый проект или выберите существующий
   - Включите Google Sheets API
   - Создайте Service Account
   - Скачайте JSON ключ

2. **Создайте Google Sheets таблицу:**
   - Создайте новую таблицу в [Google Sheets](https://sheets.google.com)
   - Скопируйте ID из URL: `https://docs.google.com/spreadsheets/d/`**`YOUR_ID_HERE`**`/edit`

3. **Настройте переменные окружения:**
```bash
cp env.google-docs.example .env
```

Заполните `.env`:
```env
GOOGLE_DOCS_ENABLED=true
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=path/to/your/credentials.json
```

### 3. Первый экспорт
```bash
# Экспорт папки Mail.ru Cloud
echo "https://cloud.mail.ru/public/your-folder" | npm run google-docs

# Экспорт папки Yandex.Disk  
echo "https://disk.yandex.ru/d/your-folder" | npm run google-docs
```

### 4. Предварительный просмотр
```bash
# Посмотреть что будет экспортировано (без реального экспорта)
echo "https://cloud.mail.ru/public/your-folder" | npm run google-docs:dry-run
```

## 🎯 Что получится

Таблица в Google Sheets с колонками:
- **Название** - имя файла
- **Ссылка** - прямая ссылка на файл  
- **Медиатип** - фото/видео
- **Дата создания** - дата загрузки
- **Миниатюра** - изображение превью

## 🔧 Основные команды

```bash
# Экспорт в Google Sheets
npm run google-docs

# Предварительный просмотр
npm run google-docs:dry-run

# WEEEK интеграция (DEPRECATED)
npm run sync
```

## ⚠️ Важно

- **WEEEK интеграция** больше не поддерживается
- **Основная функция** - экспорт в Google Sheets
- **Поддерживаются** Mail.ru Cloud и Yandex.Disk
- **Автоматически** получаются миниатюры для всех файлов

## 🆘 Проблемы?

1. Проверьте `.env` файл
2. Убедитесь что Google Sheets API включен
3. Проверьте права доступа Service Account
4. Используйте `--dry-run` для диагностики

---

**Готово!** Теперь у вас есть автоматический экспорт медиафайлов в Google Sheets! 🎉 