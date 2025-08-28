import { google } from 'googleapis';
import { GoogleDocsConfig, SpreadsheetRow, GoogleDocsExportResult } from '../types';

export class GoogleDocsClient {
  private auth: any;
  private sheets: any;
  private config: GoogleDocsConfig;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
    this.initializeAuth();
  }

  /**
   * Инициализирует аутентификацию Google
   */
  private initializeAuth(): void {
    try {
      if (!this.config.credentialsPath) {
        throw new Error('GOOGLE_CREDENTIALS_PATH не указан в конфигурации');
      }

      // Загружаем учетные данные из файла
      const fs = require('fs');
      const credentials = JSON.parse(fs.readFileSync(this.config.credentialsPath, 'utf8'));
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets API инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации Google Sheets API:', error);
      throw error;
    }
  }

  /**
   * Читает существующие данные из таблицы
   */
  private async readExistingData(sheetName: string): Promise<{ existingLinks: Set<string>, lastRowIndex: number }> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${sheetName}!A:E`
      });

      const values = response.data.values || [];
      const existingLinks = new Set<string>();
      
      // Пропускаем заголовок (первая строка)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row && row.length > 1 && row[1]) { // row[1] - колонка "Ссылка"
          existingLinks.add(row[1]);
        }
      }

      return {
        existingLinks,
        lastRowIndex: values.length
      };
    } catch (error) {
      console.warn('⚠️  Не удалось прочитать существующие данные:', error);
      return {
        existingLinks: new Set<string>(),
        lastRowIndex: 1 // Только заголовок
      };
    }
  }

  /**
   * Экспортирует данные в Google Sheets
   */
  async exportToSpreadsheet(
    rows: SpreadsheetRow[], 
    sheetName: string = 'Sheet1'
  ): Promise<GoogleDocsExportResult> {
    try {
      if (!this.config.spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID не указан в конфигурации');
      }

      console.log(`📊 Экспортирую ${rows.length} строк в Google Sheets...`);

      // Читаем существующие данные для проверки уникальности
      const { existingLinks, lastRowIndex } = await this.readExistingData(sheetName);
      console.log(`📋 Найдено ${existingLinks.size} существующих ссылок в таблице`);

      // Фильтруем только новые файлы (по ссылке)
      const newRows = rows.filter(row => !existingLinks.has(row.link));
      console.log(`🆕 Новых файлов для добавления: ${newRows.length}/${rows.length}`);

      if (newRows.length === 0) {
        console.log('✅ Все файлы уже существуют в таблице');
        return {
          success: true,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`,
          rowsExported: 0
        };
      }

      // Подготавливаем данные с формулами для изображений
      const data = newRows.map(row => [
        row.fileName,
        row.link,
        row.mediaType,
        row.creationDate,
        // Используем НОВЫЙ API Mail.ru для реальных миниатюр!
        row.thumbnailUrl ? `=IMAGE("${row.thumbnailUrl}",1)` : 'Миниатюра недоступна'
      ]);

      // Если это первая запись, добавляем заголовки
      if (lastRowIndex === 1) {
        const headers = ['Название', 'Ссылка', 'Тип медиа', 'Дата создания', 'Изображение'];
        data.unshift(headers);
        console.log('📝 Добавляю заголовки таблицы');
      }

      // Добавляем новые данные в конец таблицы
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${sheetName}!A${lastRowIndex}`,
        valueInputOption: 'USER_ENTERED', // Позволяет интерпретировать формулы
        requestBody: {
          values: data
        }
      });

      // Форматируем заголовки (жирный шрифт, фон)
      await this.formatHeaders(sheetName, 5); // 5 колонок

      // Автоматически подгоняем ширину колонок
      await this.autoResizeColumns(sheetName, 5); // 5 колонок

      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`;
      
      console.log(`✅ Экспорт завершен: ${newRows.length} новых строк добавлено`);
      console.log(`🔗 Ссылка на таблицу: ${spreadsheetUrl}`);

      return {
        success: true,
        spreadsheetUrl,
        rowsExported: newRows.length
      };

    } catch (error) {
      console.error('❌ Ошибка экспорта в Google Sheets:', error);
      return {
        success: false,
        rowsExported: 0,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка']
      };
    }
  }

  /**
   * Форматирует заголовки таблицы
   */
  private async formatHeaders(sheetName: string, columnCount: number): Promise<void> {
    try {
      const requests = [
        {
          repeatCell: {
            range: {
              sheetId: await this.getSheetId(sheetName),
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: { requests }
      });

      console.log('✅ Заголовки отформатированы');
    } catch (error) {
      console.warn('⚠️  Не удалось отформатировать заголовки:', error);
    }
  }

  /**
   * Автоматически подгоняет ширину колонок
   */
  private async autoResizeColumns(sheetName: string, columnCount: number): Promise<void> {
    try {
      const requests = [];
      
      for (let i = 0; i < columnCount; i++) {
        // Для колонки с изображениями (последняя) устанавливаем фиксированную ширину
        if (i === columnCount - 1) {
          requests.push({
            updateDimensionProperties: {
              range: {
                sheetId: await this.getSheetId(sheetName),
                dimension: 'COLUMNS',
                startIndex: i,
                endIndex: i + 1
              },
              properties: {
                pixelSize: 150 // Ширина 150 пикселей для миниатюр
              },
              fields: 'pixelSize'
            }
          });
        } else {
          // Для остальных колонок автоматически подгоняем ширину
          requests.push({
            autoResizeDimensions: {
              dimensions: {
                sheetId: await this.getSheetId(sheetName),
                dimension: 'COLUMNS',
                startIndex: i,
                endIndex: i + 1
              }
            }
          });
        }
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: { requests }
      });

      console.log('✅ Ширина колонок настроена (последняя колонка - 150px для изображений)');
    } catch (error) {
      console.warn('⚠️  Не удалось настроить ширину колонок:', error);
    }
  }

  /**
   * Получает ID листа по имени
   */
  private async getSheetId(sheetName: string): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.config.spreadsheetId
    });

    const sheet = response.data.sheets.find((s: any) => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Лист "${sheetName}" не найден`);
    }

    return sheet.properties.sheetId;
  }

  /**
   * Вставляет изображения в последнюю колонку таблицы
   */
  private async insertImages(rows: SpreadsheetRow[], sheetName: string, columnCount: number): Promise<void> {
    try {
      const sheetId = await this.getSheetId(sheetName);
      const requests = [];
      
      // Начинаем с первой строки данных (после заголовков)
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.thumbnailUrl) {
          requests.push({
            insertImage: {
              url: row.thumbnailUrl,
              sheetId: sheetId,
              location: {
                index: columnCount - 1, // Последняя колонка
                rowIndex: i + 1 // +1 потому что первая строка - заголовки
              },
              objectId: `image_${i}`,
              width: 100,
              height: 100
            }
          });
        }
      }

      if (requests.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.config.spreadsheetId,
          requestBody: { requests }
        });
        console.log(`✅ Вставлено изображений: ${requests.length}`);
      }
    } catch (error) {
      console.warn('⚠️  Не удалось вставить изображения:', error);
    }
  }
} 