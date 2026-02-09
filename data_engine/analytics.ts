
import { NumericStats, CategoricalStats } from '../types';

export class AnalyticsEngine {
  static calculateNumericStats(values: number[]): NumericStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const min = sorted[0];
    const max = sorted[n - 1];
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Skewness Detection
    let skewness: 'positive' | 'negative' | 'normal' = 'normal';
    if (mean > median + (stdDev * 0.1)) skewness = 'positive';
    else if (mean < median - (stdDev * 0.1)) skewness = 'negative';

    // IQR Outliers
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliersCount = values.filter(v => v < lowerBound || v > upperBound).length;

    return { min, max, mean, median, stdDev, outliersCount, skewness };
  }

  static calculateCategoricalStats(values: any[]): CategoricalStats {
    const counts: Record<string, number> = {};
    let topValue = 'N/A';
    let topValueCount = 0;

    values.forEach(v => {
      const s = String(v);
      counts[s] = (counts[s] || 0) + 1;
      if (counts[s] > topValueCount) {
        topValueCount = counts[s];
        topValue = s;
      }
    });

    return { topValue, topValueCount };
  }
}
