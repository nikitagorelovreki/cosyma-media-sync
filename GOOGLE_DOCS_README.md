# Media Sync - Google Docs Экспорт

## 🚀 Новая функциональность

Этот модуль добавляет возможность экспорта медиафайлов в Google Sheets, создавая таблицу с 5 колонками:
1. **Название** - имя файла
2. **Ссылка** - прямая ссылка на файл
3. **Тип медиа** - Фото/Видео
4. **Дата создания** - дата создания файла
5. **Миниатюра** - URL миниатюры (если доступна)

## 📋 Требования

### 1. Google Cloud Project
- Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
- Включите Google Sheets API
- Создайте Service Account и скачайте credentials.json

### 2. Google Spreadsheet
- Создайте новую таблицу в Google Sheets
- Скопируйте ID из URL (часть между /d/ и /edit)

### 3. Установка зависимостей
```bash
npm install
```

## ⚙️ Настройка

### 1. Скопируйте пример конфигурации
```bash
cp env.google-docs.example .env
```

### 2. Заполните переменные окружения
```bash
# Включите Google Docs
GOOGLE_DOCS_ENABLED=true

# ID вашей Google таблицы
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Путь к файлу credentials.json
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

### 3. Разместите credentials.json
Поместите скачанный файл credentials.json в корень проекта.

## 🎯 Использование

### Экспорт в Google Docs
```bash
# Интерактивный режим
npm run google-docs

# Режим pipe (несколько ссылок)
echo "https://cloud.mail.ru/public/P1ZJ/WGntm7zig https://cloud.mail.ru/public/7JS8/9BmCCHwv7" | npm run google-docs

# Чтение из файла
npm run google-docs < links.txt
```

### Dry-run (проверка без экспорта)
```bash
npm run google-docs:dry-run
```

## 📊 Структура таблицы

| Название | Ссылка | Тип медиа | Дата создания | Миниатюра |
|-----------|--------|-----------|---------------|-----------|
| photo1.jpg | https://... | Фото | 21.01.2025 13:33 | https://... |
| video1.mp4 | https://... | Видео | 21.01.2025 14:06 | https://... |

## 🔧 Особенности

### Миниатюры
- **Mail.ru Cloud**: автоматически генерируются миниатюры 200x200 для фото, 320x240 для видео
- **Яндекс.Диск**: используются API превью с автоматическим определением размера

### Форматирование
- Заголовки автоматически форматируются (жирный шрифт, синий фон)
- Ширина колонок автоматически подгоняется под содержимое
- Даты форматируются в удобном для чтения виде

### Производительность
- Миниатюры загружаются асинхронно
- Поддержка больших объемов файлов
- Автоматическая обработка ошибок

## 🚨 Важно

- **Старая функциональность WEEEK остается нетронутой**
- Google Docs функциональность работает параллельно
- Можно использовать оба режима независимо друг от друга

## 🔍 Отладка

### Проверка конфигурации
```bash
npm run google-docs:dry-run
```

### Логи
Программа выводит подробные логи о процессе экспорта:
- Количество найденных файлов
- Процесс получения миниатюр
- Статус экспорта в Google Sheets
- Ссылка на созданную таблицу

## 📝 Примеры

### Экспорт одной папки
```bash
echo "https://cloud.mail.ru/public/P1ZJ/WGntm7zig" | npm run google-docs
```

### Экспорт нескольких источников
```bash
echo "https://disk.yandex.ru/d/xNv4Njt4wmH7xQ https://cloud.mail.ru/public/7JS8/9BmCCHwv7" | npm run google-docs
```

### Создание файла со ссылками
```bash
cat > links.txt << EOF
https://cloud.mail.ru/public/P1ZJ/WGntm7zig
https://disk.yandex.ru/d/xNv4Njt4wmH7xQ
EOF

npm run google-docs < links.txt
```

## 🎉 Результат

После успешного экспорта вы получите:
- ✅ Таблицу в Google Sheets с 5 колонками
- ✅ Все медиафайлы с метаданными
- ✅ Миниатюры для фото и видео
- 🔗 Ссылку на таблицу для дальнейшего использования 