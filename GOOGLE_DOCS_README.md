# 📊 Google Sheets Integration - Основное руководство

## 🎯 Обзор

**Google Sheets Integration** - это основная функция приложения Cosyma Media Sync, которая автоматически экспортирует медиафайлы из облачных хранилищ в Google Sheets с миниатюрами.

## ✨ Возможности

### 🔄 **Автоматический экспорт**
- Сбор медиафайлов из папок и подпапок
- Автоматическое определение типа медиа (фото/видео)
- Получение дат создания файлов
- Предотвращение дублирования на основе ссылок

### 🖼️ **Система миниатюр**
- Автоматическое получение превью из API провайдеров
- Оптимизированные размеры для Google Sheets
- Fallback на генерацию миниатюр через API
- Поддержка различных форматов изображений

### 📁 **Поддерживаемые провайдеры**
- **Mail.ru Cloud** - полная поддержка с миниатюрами
- **Yandex.Disk** - полная поддержка с миниатюрами
- **Расширяемая архитектура** для новых провайдеров

## 🚀 Установка и настройка

### 1. **Создание Google Service Account**

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API:
   - В меню слева выберите "APIs & Services" → "Library"
   - Найдите "Google Sheets API"
   - Нажмите "Enable"

4. Создайте Service Account:
   - В меню слева выберите "APIs & Services" → "Credentials"
   - Нажмите "Create Credentials" → "Service Account"
   - Заполните название и описание
   - Нажмите "Create and Continue"

5. Скачайте JSON ключ:
   - В списке Service Accounts нажмите на созданный аккаунт
   - Перейдите на вкладку "Keys"
   - Нажмите "Add Key" → "Create new key"
   - Выберите "JSON" и скачайте файл

### 2. **Настройка Google Sheets**

1. Создайте новую таблицу в [Google Sheets](https://sheets.google.com)
2. Скопируйте ID таблицы из URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit
   ```
3. Предоставьте доступ Service Account:
   - В настройках таблицы нажмите "Share"
   - Добавьте email Service Account (из JSON файла)
   - Дайте права "Editor"

### 3. **Настройка переменных окружения**

```bash
cp env.google-docs.example .env
```

Заполните `.env` файл:
```env
# Google Sheets Configuration
GOOGLE_DOCS_ENABLED=true
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=path/to/your/credentials.json

# Optional: Sheet configuration
GOOGLE_SHEET_NAME=Sheet1
```

## 🔧 Использование

### **Основные команды**

```bash
# Экспорт в Google Sheets
echo "https://cloud.mail.ru/public/your-folder" | npm run google-docs

# Предварительный просмотр (dry-run)
echo "https://cloud.mail.ru/public/your-folder" | npm run google-docs:dry-run

# Экспорт из файла
npm run google-docs < links.txt
```

### **Поддерживаемые форматы ссылок**

#### Mail.ru Cloud
```
https://cloud.mail.ru/public/folder-name
https://cloud.mail.ru/public/folder-name/subfolder
```

#### Yandex.Disk
```
https://disk.yandex.ru/d/folder-id
https://disk.360.yandex.ru/d/folder-id
```

### **Примеры использования**

```bash
# Экспорт одной папки
echo "https://cloud.mail.ru/public/photos-2024" | npm run google-docs

# Экспорт нескольких папок
echo "https://cloud.mail.ru/public/photos-2024
https://disk.yandex.ru/d/videos-2024" | npm run google-docs

# Экспорт из файла
cat > links.txt << EOF
https://cloud.mail.ru/public/folder1
https://disk.yandex.ru/d/folder2
EOF
npm run google-docs < links.txt
```

## 📊 Структура таблицы

Приложение автоматически создает таблицу с колонками:

| Колонка | Описание | Пример |
|---------|----------|---------|
| **Название** | Имя файла | `IMG_001.jpg` |
| **Ссылка** | Прямая ссылка на файл | `https://...` |
| **Медиатип** | Тип медиа | `фото` / `видео` |
| **Дата создания** | Дата загрузки файла | `2024-01-15` |
| **Миниатюра** | Изображение превью | `[изображение]` |

## 🖼️ Система миниатюр

### **Автоматическое получение**
- **Mail.ru Cloud**: использует официальное API миниатюр
- **Yandex.Disk**: использует поле `preview` из API ответа
- **Fallback**: генерация миниатюр через API провайдеров

### **Оптимизация**
- Автоматический выбор размера для Google Sheets
- Сжатие и оптимизация изображений
- Кэширование для повторного использования

## 🔄 Дублирование

### **Алгоритм предотвращения**
1. Чтение существующих ссылок из таблицы
2. Сравнение с новыми файлами по ссылкам
3. Добавление только новых, уникальных файлов
4. Обновление статистики экспорта

### **Преимущества**
- Безопасный повторный запуск
- Экономия времени и ресурсов
- Автоматическое обновление данных

## ⚙️ Настройки

### **Переменные окружения**

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `GOOGLE_DOCS_ENABLED` | Включить Google Sheets интеграцию | `false` |
| `GOOGLE_SPREADSHEET_ID` | ID Google Sheets таблицы | - |
| `GOOGLE_CREDENTIALS_PATH` | Путь к JSON ключу Service Account | - |
| `GOOGLE_SHEET_NAME` | Название листа в таблице | `Sheet1` |

### **Дополнительные настройки**

```env
# Размер батча для экспорта
GOOGLE_BATCH_SIZE=100

# Задержка между запросами (мс)
GOOGLE_REQUEST_DELAY=1000

# Максимум повторов при ошибках
GOOGLE_MAX_RETRIES=3
```

## 🚨 Ограничения и особенности

### **Google Sheets API**
- Лимит: 100 запросов в минуту
- Максимум 10,000,000 ячеек на таблицу
- Размер изображения: до 2MB

### **Провайдеры**
- **Mail.ru Cloud**: стабильное API, полная поддержка
- **Yandex.Disk**: может требовать обхода SmartCaptcha
- **Другие**: расширяемая архитектура

### **Производительность**
- Рекомендуется: до 1000 файлов за раз
- Для больших папок используйте батчи
- Используйте `--dry-run` для оценки

## 🛠️ Разработка

### **Архитектура**

```
src/google-docs/
├── client.ts        # Google Sheets API клиент
├── exporter.ts      # Логика экспорта и форматирования
└── index.ts         # Точка входа и CLI интерфейс
```

### **Расширение функционала**

1. **Новые провайдеры**: добавьте в `src/providers/`
2. **Новые типы медиа**: обновите `src/types/index.ts`
3. **Дополнительные колонки**: модифицируйте `src/google-docs/exporter.ts`

## 🔍 Отладка

### **Режим dry-run**
```bash
npm run google-docs:dry-run
```
Показывает:
- Список найденных файлов
- Планируемые изменения
- Статистику без реального экспорта

### **Логирование**
- Подробные логи процесса экспорта
- Информация о каждом файле
- Ошибки и предупреждения

### **Частые проблемы**

1. **"API not enabled"**: включите Google Sheets API
2. **"Permission denied"**: проверьте права Service Account
3. **"Invalid spreadsheet ID"**: проверьте ID таблицы
4. **"Credentials not found"**: проверьте путь к JSON файлу

## 📚 Дополнительные ресурсы

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/service-accounts)

## 🤝 Поддержка

- **Основная функция**: Google Sheets экспорт
- **Статус**: Активно поддерживается
- **Версии**: Совместимо с последними версиями Google Sheets API

---

**Google Sheets Integration** - это мощный инструмент для автоматизации экспорта медиафайлов с миниатюрами в удобном табличном формате! 🎉 