
/**
 * Brain 1: Loader
 * Responsibilities: Accept CSV/Excel, basic parsing.
 */
export class Loader {
  static async loadCsv(csvText: string): Promise<{ headers: string[], rows: any[] }> {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) throw new Error("File is empty");

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => {
        const val = values[i]?.trim();
        obj[h] = val === "" ? null : val;
      });
      return obj;
    });

    return { headers, rows };
  }
}
