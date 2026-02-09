
import { DataType } from '../types';

/**
 * Brain 1: Cleaning
 * Responsibilities: Duplicates, null handling, casting.
 */
export class CleaningLayer {
  static removeDuplicates(rows: any[]): { cleaned: any[], duplicateCount: number } {
    const seen = new Set();
    const cleaned: any[] = [];
    let duplicateCount = 0;

    for (const row of rows) {
      const str = JSON.stringify(row);
      if (seen.has(str)) {
        duplicateCount++;
      } else {
        seen.add(str);
        cleaned.push(row);
      }
    }
    return { cleaned, duplicateCount };
  }

  static castAndFill(rows: any[], columns: { name: string, type: DataType }[]): any[] {
    return rows.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        let val = newRow[col.name];
        
        if (col.type === 'numeric') {
          newRow[col.name] = val === null ? null : Number(val);
        } else if (col.type === 'boolean') {
          if (val === null) newRow[col.name] = null;
          else {
            const s = String(val).toLowerCase();
            newRow[col.name] = ['true', '1', 'yes'].includes(s);
          }
        } else if (col.type === 'date') {
          newRow[col.name] = val === null ? null : new Date(val).toISOString();
        }
      });
      return newRow;
    });
  }
}
