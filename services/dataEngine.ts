
import { ProcessingResult, NumericStats, CategoricalStats, OperationLog, DataSummary } from '../types';
import { Loader } from '../data_engine/loader';
import { SchemaDetector } from '../data_engine/schema';
import { CleaningLayer } from '../data_engine/cleaning';
import { AnalyticsEngine } from '../data_engine/analytics';
import { SummaryGenerator } from '../data_engine/summary';
import { RootCauseEngine } from '../data_engine/rootCause';

export class DataEngine {
  /**
   * Main entry point for initial CSV processing.
   */
  static async processCsv(csvText: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    const history: OperationLog[] = [];

    const log = (action: string, reason: string, details: string) => {
      history.push({ timestamp: Date.now(), action, reason, details });
    };

    // 1. Load
    const { headers, rows: rawRows } = await Loader.loadCsv(csvText);
    log("Ingestion", "Initial loading", `Loaded ${rawRows.length} raw rows with ${headers.length} headers.`);

    // 2. Initial Deterministic Cleaning (Always run on first load)
    const { cleaned: deDupedRows, duplicateCount } = CleaningLayer.removeDuplicates(rawRows);
    if (duplicateCount > 0) log("Deduplication", "Data integrity", `Removed ${duplicateCount} redundant records.`);
    
    // 3. Run analysis pipeline
    const { summary, cleanedData } = await this.runAnalysisPipeline(deDupedRows, headers, history, duplicateCount);

    return {
      summary,
      cleanedData,
      metrics: { processingTimeMs: Date.now() - startTime }
    };
  }

  /**
   * Analysis pipeline that can be re-run on any data state (e.g., after interactive cleaning).
   */
  static async runAnalysisPipeline(
    rows: any[], 
    headers: string[], 
    history: OperationLog[] = [],
    duplicateCount: number = 0
  ): Promise<{ summary: DataSummary, cleanedData: any[] }> {
    
    // 1. Schema Detection (Re-detecting ensures stats are fresh)
    const columns = headers.map(h => SchemaDetector.getColumnMetadata(h, rows.map(r => r[h])));

    // 2. Type Coercion
    const cleanedData = CleaningLayer.castAndFill(rows, columns);

    // 3. Analytics
    const statsMap = new Map<string, NumericStats | CategoricalStats>();
    columns.forEach(col => {
      const vals = cleanedData.map(r => r[col.name]).filter(v => v !== null);
      if (col.type === 'numeric') {
        statsMap.set(col.name, AnalyticsEngine.calculateNumericStats(vals));
      } else if (col.type === 'categorical') {
        statsMap.set(col.name, AnalyticsEngine.calculateCategoricalStats(vals));
      }
    });

    // 4. Root Cause Analysis
    const rootCause = RootCauseEngine.analyze(cleanedData, columns);

    // 5. Summary Generation
    const summary = SummaryGenerator.generate(cleanedData, columns, duplicateCount, statsMap, history);
    if (rootCause) summary.rootCause = rootCause;

    return { summary, cleanedData };
  }
}
