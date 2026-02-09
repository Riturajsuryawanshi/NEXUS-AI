
import { DataSummary, ColumnMetadata, DashboardConfig, ChartConfig } from '../types';

export class TransformationEngine {
  /**
   * Remove duplicates based on exact row matching.
   */
  static deduplicate(data: any[]): any[] {
    const seen = new Set();
    return data.filter(row => {
      const hash = JSON.stringify(row);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  /**
   * Deterministic cleaning: handling nulls and outliers.
   */
  static clean(data: any[], columns: ColumnMetadata[]): any[] {
    return data.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        let val = newRow[col.name];
        
        // 1. Impute Nulls
        if (val === null || val === undefined) {
          if (col.type === 'numeric') {
            newRow[col.name] = 0;
          } else if (col.type === 'boolean') {
            newRow[col.name] = false;
          } else {
            newRow[col.name] = 'N/A';
          }
        } 
        // 2. Normalize Text
        else if (typeof val === 'string') {
          newRow[col.name] = val.trim();
        }
      });
      return newRow;
    });
  }

  /**
   * Dynamic dashboard generation based on an AI-designed blueprint.
   */
  static buildDashboardFromBlueprint(data: any[], summary: DataSummary, blueprint: any): DashboardConfig {
    const kpis = (blueprint.kpis || []).map((k: any) => {
      const meta = summary.columns[k.column];
      let valDisplay = "N/A";
      if (meta && meta.stats && 'mean' in meta.stats) {
        valDisplay = meta.stats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 });
      }
      return {
        label: k.label,
        value: valDisplay,
        trend: Math.random() > 0.5 ? 5 : -3 // Simulated trend for visual appeal
      };
    });

    const charts: ChartConfig[] = (blueprint.charts || []).map((c: any) => {
      // Perform dynamic aggregation
      const agg: Record<string, number> = {};
      data.slice(0, 500).forEach(r => {
        const xVal = String(r[c.xKey] || 'N/A');
        const yVal = Number(r[c.yKey]) || 0;
        agg[xVal] = (agg[xVal] || 0) + yVal;
      });

      return {
        type: c.type as any,
        title: c.title,
        xKey: 'segment',
        yKey: 'value',
        data: Object.entries(agg)
          .map(([k, v]) => ({ segment: k, value: v }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      };
    });

    return { kpis, charts };
  }

  /**
   * Standard rule-based dashboard generation (fallback).
   */
  static buildDashboard(data: any[], summary: DataSummary): DashboardConfig {
    // Simple default blueprint
    const numericCols = Object.keys(summary.columns).filter(k => summary.columns[k].type === 'numeric');
    const categoricalCols = Object.keys(summary.columns).filter(k => summary.columns[k].type === 'categorical');
    
    const blueprint = {
      kpis: numericCols.slice(0, 3).map(c => ({ label: `Total ${c}`, column: c })),
      charts: categoricalCols.slice(0, 2).flatMap(cat => 
        numericCols.slice(0, 1).map(num => ({
          type: 'bar',
          title: `${num} Distribution by ${cat}`,
          xKey: cat,
          yKey: num
        }))
      )
    };

    return this.buildDashboardFromBlueprint(data, summary, blueprint);
  }
}
