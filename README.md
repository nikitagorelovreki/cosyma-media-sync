# Media Sync - Синхронизация медиафайлов в WEEEK

Система для одноразовой синхронизации медиафайлов из облачных сервисов в WEEEK (ВИК) через публичное API.

## 🎯 Возможности

- **Поддерживаемые провайдеры:**
  - Яндекс.Диск (включая Яндекс.360)
  - Mail.ru Cloud
- **Типы медиа:** фото (jpg, png, webp, heic) и видео (mp4, mov, avi, mkv)
- **Автоматическое создание задач** в WEEEK с кастомными полями
- **Автоматические теги** - Photo для фото, Video для видео
- **Предотвращение дублирования** через dedup-идентификаторы
- **Режим dry-run** для предварительного просмотра
- **Батчевая обработка** с настраиваемыми задержками

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка конфигурации

Скопируйте `env.example` в `.env` и заполните необходимые параметры:

```bash
cp env.example .env
```

```env
# WEEEK API Configuration
WEEEK_API_TOKEN=your_weeek_api_token_here
WEEEK_SPACE_OR_PROJECT_ID=your_space_or_project_id_here

# Optional: Rate limiting and retry settings
MAX_TASKS_PER_BATCH=50
MAX_RETRIES=3
REQUEST_DELAY_MS=1000
```

**Важно:** `WEEEK_SPACE_OR_PROJECT_ID` должен содержать ID проекта или рабочего пространства, где будут создаваться задачи. Если не указать, задачи будут создаваться в корневом проекте.

### 3. Получение токена WEEEK

1. Перейдите в [developers.weeek.net](https://developers.weeek.net)
2. Создайте рабочее пространство
3. Сгенерируйте access token в разделе "Generating access token"
4. **Для указания проекта:** скопируйте ID проекта из URL вашего проекта в WEEEK (например, `https://weeek.net/project/12345` → ID = `12345`)

### 4. Запуск синхронизации

#### Интерактивный режим (dry-run):
```bash
npm run dev -- --dry-run
```

#### Режим pipe из файла:
```bash
echo "https://disk.yandex.ru/d/example" | npm run dev
```

#### Чтение из файла:
```bash
npm run dev < links.txt
```

## 📋 Поддерживаемые форматы ссылок

### Яндекс.Диск / Яндекс.360
- **Файл:** `https://disk.yandex.ru/i/...`
- **Папка:** `https://disk.yandex.ru/d/...`
- **360:** `https://disk.360.yandex.ru/d/...`

### Mail.ru Cloud
- **Публичная папка:** `https://cloud.mail.ru/public/...`

## 🔧 Архитектура

```
src/
├── config/          # Загрузка конфигурации
├── input/           # Нормализация ссылок
├── filters/         # Фильтрация медиафайлов
├── providers/       # Провайдеры облачных сервисов
├── weeek/           # Клиент WEEEK API
├── sync/            # Основная логика синхронизации
└── types/           # TypeScript типы
```

## 📊 Процесс синхронизации

1. **Валидация ссылок** - проверка и нормализация входных URL
2. **Определение провайдера** - автоматический выбор обработчика
3. **Сбор метаданных** - получение списка файлов и папок
4. **Фильтрация медиа** - отбор только фото и видео файлов
5. **Проверка дублирования** - поиск существующих задач
6. **Создание задач** - батчевое создание в WEEEK

## 🎨 Структура задач в WEEEK

### Заголовок
```
MEDIA:: filename.jpg [a1b2c3d4]
```

### Описание
- Тип медиа (фото/видео)
- Провайдер (Яндекс.Диск/Mail.ru)
- Размер файла
- Дата загрузки (если доступна)
- Исходная ссылка
- Прямая ссылка для скачивания (Яндекс)
- Dedup ID

### Кастомные поля
- **Media Type:** Photo/Video
- **Original Upload Date:** дата загрузки
- **Source URL:** исходная публичная ссылка

## ⚙️ Настройки

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `WEEEK_API_TOKEN` | Bearer токен для API | - |
| `WEEEK_BOARD_ID` | ID доски в WEEEK | - |
| `WEEEK_COLUMN_ID` | ID колонки в доске | - |
| `MAX_TASKS_PER_BATCH` | Размер батча для создания задач | 50 |
| `MAX_RETRIES` | Максимум повторов при ошибках | 3 |
| `REQUEST_DELAY_MS` | Задержка между запросами (мс) | 1000 |

## 🔍 Режим Dry-Run

Используйте флаг `--dry-run` для предварительного просмотра:

```bash
npm run dev -- --dry-run
```

Это покажет:
- Список найденных медиафайлов
- Планируемые задачи
- Статистику без реального создания

## 📝 Примеры использования

### Синхронизация одной папки
```bash
echo "https://disk.yandex.ru/d/example_folder" | npm run dev
```

### Синхронизация нескольких ресурсов
```bash
cat > links.txt << EOF
https://disk.yandex.ru/d/folder1
https://disk.yandex.ru/d/folder2
https://cloud.mail.ru/public/example
EOF

npm run dev < links.txt
```

### Предварительный просмотр
```bash
echo "https://disk.yandex.ru/d/example" | npm run dev -- --dry-run
```

## 🚨 Ограничения

- **Mail.ru Cloud:** использует неофициальное API, стабильность не гарантирована
- **Даты загрузки:** могут отсутствовать в публичных метаданных
- **Большие папки:** рекомендуется ограничить `MAX_TASKS_PER_BATCH`
- **Rate limiting:** настройте `REQUEST_DELAY_MS` для избежания блокировки

## 🛠️ Разработка

### Сборка
```bash
npm run build
```

### Запуск собранной версии
```bash
npm start
```

### Разработка с hot-reload
```bash
npm run dev
```

## 📚 API документация

- [WEEEK API](https://developers.weeek.net)
- [Яндекс.Диск API](https://yandex.ru/dev/disk/rest/)
- [Mail.ru Cloud](https://cloud.mail.ru/) (неофициальное API)

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте конфигурацию в `.env`
2. Убедитесь в доступности API WEEEK
3. Проверьте корректность ссылок
4. Используйте режим `--dry-run` для диагностики

## 📄 Лицензия

MIT License 