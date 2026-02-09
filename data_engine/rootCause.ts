
import { RootCauseSummary, Contributor, ColumnMetadata } from '../types';

export class RootCauseEngine {
  /**
   * Performs deterministic variance decomposition.
   * Splits data into two halves (Baseline vs Current) to identify drivers of change.
   */
  static analyze(rows: any[], columns: ColumnMetadata[]): RootCauseSummary | undefined {
    if (rows.length < 10) return undefined;

    // 1. Identify a numeric KPI (column with highest variance or first numeric)
    const kpiCol = columns.find(c => c.type === 'numeric');
    if (!kpiCol) return undefined;

    // 2. Split data into Baseline (First 50%) and Current (Last 50%)
    const midPoint = Math.floor(rows.length / 2);
    const baseline = rows.slice(0, midPoint);
    const current = rows.slice(midPoint);

    const baselineSum = baseline.reduce((acc, r) => acc + (r[kpiCol.name] || 0), 0);
    const currentSum = current.reduce((acc, r) => acc + (r[kpiCol.name] || 0), 0);
    const totalDelta = currentSum - baselineSum;
    const totalDeltaPct = baselineSum !== 0 ? (totalDelta / baselineSum) * 100 : 0;

    const contributors: Contributor[] = [];

    // 3. For each categorical dimension, calculate contribution to delta
    columns.filter(c => c.type === 'categorical' && c.uniqueCount > 1 && c.uniqueCount < 50).forEach(dim => {
      const dimBaseline: Record<string, number> = {};
      const dimCurrent: Record<string, number> = {};

      baseline.forEach(r => {
        const val = String(r[dim.name]);
        dimBaseline[val] = (dimBaseline[val] || 0) + (r[kpiCol.name] || 0);
      });

      current.forEach(r => {
        const val = String(r[dim.name]);
        dimCurrent[val] = (dimCurrent[val] || 0) + (r[kpiCol.name] || 0);
      });

      // Find which segment within this dimension changed the most
      const allKeys = new Set([...Object.keys(dimBaseline), ...Object.keys(dimCurrent)]);
      allKeys.forEach(key => {
        const bVal = dimBaseline[key] || 0;
        const cVal = dimCurrent[key] || 0;
        const diff = cVal - bVal;
        
        if (Math.abs(diff) > 0) {
          contributors.push({
            factor: key,
            dimension: dim.name,
            absolute_impact: diff,
            contribution_percentage: totalDelta !== 0 ? (diff / Math.abs(totalDelta)) * 100 : 0,
            direction: diff > 0 ? 'increase' : 'decrease'
          });
        }
      });
    });

    // 4. Sort and return top 5 contributors
    const topContributors = contributors
      .sort((a, b) => Math.abs(b.absolute_impact) - Math.abs(a.absolute_impact))
      .slice(0, 6);

    return {
      kpi_name: kpiCol.name,
      total_delta: totalDelta,
      total_delta_pct: totalDeltaPct,
      top_contributors: topContributors,
      confidence_score: Math.min(95, rows.length / 10 + 70), // Proxy for sample size confidence
      analysis_method: "Variance Decomposition (PoP Split)"
    };
  }
}
