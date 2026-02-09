
import { DataType } from '../types';

/**
 * Brain 1: Schema Detection
 * Responsibilities: Detect types and basic null/unique counts.
 */
export class SchemaDetector {
  static detectType(values: any[]): DataType {
    const nonNulls = values.filter(v => v !== null);
    if (nonNulls.length === 0) return 'unknown';

    const isNumeric = nonNulls.every(v => !isNaN(Number(v)));
    if (isNumeric) return 'numeric';

    const isBoolean = nonNulls.every(v => {
      const s = String(v).toLowerCase();
      return ['true', 'false', '1', '0', 'yes', 'no'].includes(s);
    });
    if (isBoolean) return 'boolean';

    const isDate = nonNulls.every(v => !isNaN(Date.parse(String(v))));
    if (isDate) return 'date';

    return 'categorical';
  }

  static getColumnMetadata(name: string, values: any[]) {
    const type = this.detectType(values);
    const nullCount = values.filter(v => v === null).length;
    const uniqueValues = new Set(values.filter(v => v !== null));
    
    return {
      name,
      type,
      nullCount,
      uniqueCount: uniqueValues.size,
    };
  }
}
