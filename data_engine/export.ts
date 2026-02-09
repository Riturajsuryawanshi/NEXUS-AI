
import { DashboardConfig, JobRecord, Client, BusinessContext } from '../types';

/**
 * Brain 1: Export
 * Responsibilities: Generate cleaned output format and dashboard reports.
 */
export class ExportManager {
  static async toCleanedCsv(rows: any[], headers: string[]): Promise<string> {
    if (!rows || rows.length === 0) return headers.join(',');

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of rows) {
      csvRows.push(headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';

        let s = String(val);
        // Handle quotes and commas for CSV safety
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          s = `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generates a structured CSV report specifically for the AI Dashboard.
   * Excel handles this cleanly as a single-sheet summary.
   */
  static async toDashboardReport(config: DashboardConfig): Promise<string> {
    const sections = [];

    // 1. KPI Section
    sections.push("DASHBOARD KPI SUMMARY");
    sections.push("Metric,Value,Trend (%)");
    config.kpis.forEach(k => {
      sections.push(`"${k.label.replace(/"/g, '""')}","${String(k.value).replace(/"/g, '""')}",${k.trend || 0}`);
    });

    sections.push(""); // Spacer
    sections.push(""); // Spacer

    // 2. Charts Data Section
    sections.push("VISUALIZATION DATA AGGREGATES");
    config.charts.forEach(chart => {
      sections.push(`"Chart: ${chart.title.replace(/"/g, '""')}"`);
      sections.push("Dimension,Value");
      chart.data.forEach(item => {
        sections.push(`"${String(item.segment).replace(/"/g, '""')}",${item.value}`);
      });
      sections.push(""); // Spacer between charts
    });

    return sections.join('\n');
  }

  /**
   * Triggers a browser download of the provided content.
   */
  static downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  static async toProofReport(job: JobRecord, client: Client, context: BusinessContext): Promise<string> {
    const lines = [];
    lines.push(`"NEXUS PROOF REPORT"`);
    lines.push(`"Client","${client.name}"`);
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    lines.push(`"Dataset","${job.fileName}"`);
    lines.push("");

    lines.push(`"STRATEGIC DECISIONS (${context.currency})"`);
    lines.push(`"Title","Action","Expected Gain","Confidence"`);

    job.decisions?.forEach(d => {
      lines.push(`"${d.title}","${d.action}",${d.expectedGain},${d.confidence}`);
    });

    lines.push("");
    lines.push(`"OPPORTUNITY AUDIT"`);
    lines.push(`"Title","Impact Score","Effort"`);
    job.opportunities?.forEach(o => {
      lines.push(`"${o.title}",${o.roiScore},"${o.effort}"`);
    });

    return lines.join('\n');
  }
}
