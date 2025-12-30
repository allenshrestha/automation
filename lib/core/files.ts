import * as Papa from 'papaparse';
import * as XLSX from 'exceljs';
import * as fs from 'fs';
import { logger } from './logger';

/**
 * FILE PROCESSOR
 * 
 * 
 * Features:
 * - Read/write CSV files
 * - Read/write Excel files
 * - Automatic parsing
 * - Type-safe operations
 * 
 * Usage:
 * const data = await Files.readCSV<Member>('./members.csv');
 * await Files.writeCSV('./output.csv', data);
 */

export class Files {
  /**
   * Read CSV file
   */
  static async readCSV<T>(filePath: string): Promise<T[]> {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim(), // Clean headers
        complete: (results) => {
          logger.info({ filePath, rows: results.data.length }, 'CSV file read');
          resolve(results.data as T[]);
        },
        error: (error: any) => {
          logger.error({ filePath, error }, 'CSV parse error');
          reject(error);
        },
      });
    });
  }

  /**
   * Write CSV file
   */
  static writeCSV(filePath: string, data: any[]) {
    const csv = Papa.unparse(data);
    fs.writeFileSync(filePath, csv);
    logger.info({ filePath, rows: data.length }, 'CSV file written');
  }

  /**
   * Read Excel file
   */
  static async readExcel(filePath: string, sheetName?: string): Promise<any[]> {
    const workbook = new XLSX.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = sheetName
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0];

    if (!worksheet) {
      throw new Error(`Worksheet not found: ${sheetName || 'first sheet'}`);
    }

    const data: any[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Extract headers
        row.eachCell((cell) => headers.push(cell.text.trim()));
      } else {
        // Extract data
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        data.push(rowData);
      }
    });

    logger.info({ filePath, rows: data.length, sheet: sheetName || 'default' }, 'Excel file read');
    return data;
  }

  /**
   * Write Excel file
   */
  static async writeExcel(filePath: string, data: any[], sheetName: string = 'Sheet1') {
    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Add data rows
      data.forEach((row) => {
        worksheet.addRow(Object.values(row));
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }

    await workbook.xlsx.writeFile(filePath);
    logger.info({ filePath, rows: data.length }, 'Excel file written');
  }

  /**
   * Check if file exists
   */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Create directory if it doesn't exist
   */
  static ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug({ dirPath }, 'Directory created');
    }
  }
}