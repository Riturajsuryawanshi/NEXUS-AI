
import { DataSummary, ColumnMetadata, NumericStats, CategoricalStats, DataSuggestion, OperationLog } from '../types';

export class SummaryGenerator {
  static generate(
    rows: any[], 
    columns: ColumnMetadata[], 
    duplicateCount: number,
    statsMap: Map<string, NumericStats | CategoricalStats>,
    history: OperationLog[]
  ): DataSummary {
    const columnSummary: any = {};
    const suggestions: DataSuggestion[] = [];
    let healthScore = 100;

    // Rule-Based Suggestions Engine
    if (duplicateCount > 0) {
      healthScore -= 10;
      suggestions.push({
        id: 'dup_01',
        type: 'warning',
        title: 'Redundant Data Found',
        description: `Found ${duplicateCount} exact duplicate rows.`,
        impact: 'Duplicates can skew averages and inflate metrics artificially.',
        actionLabel: 'Remove Duplicates'
      });
    }

    columns.forEach(col => {
      const stats = statsMap.get(col.name);
      columnSummary[col.name] = { ...col, stats };

      // Null Check
      if (col.nullCount > (rows.length * 0.1)) {
        healthScore -= 5;
        suggestions.push({
          id: `null_${col.name}`,
          type: 'critical',
          title: `Sparse Data: ${col.name}`,
          description: `${Math.round((col.nullCount / rows.length) * 100)}% of values are missing.`,
          impact: 'High null counts lead to unreliable statistical projections.',
          actionLabel: 'Impute Values'
        });
      }

      // Outlier Check
      if (stats && 'outliersCount' in stats && stats.outliersCount > (rows.length * 0.05)) {
        healthScore -= 3;
        suggestions.push({
          id: `out_${col.name}`,
          type: 'info',
          title: `Statistical Noise: ${col.name}`,
          description: `Detected ${stats.outliersCount} anomalies in distribution.`,
          impact: 'Outliers can pull the mean away from the true central tendency.',
          actionLabel: 'Trim Outliers'
        });
      }
    });

    return {
      rowCount: rows.length,
      columnCount: columns.length,
      duplicateCount,
      qualityScore: Math.max(0, healthScore),
      suggestions,
      operationHistory: history,
      columns: columnSummary,
      sampleData: rows.slice(0, 5)
    };
  }
}
