
import { DataSchema, ColumnProfile, AuditIssue, CleaningStep } from '../types';

/**
 * Stage-1 Deterministic Engine
 * Fast, non-AI based data profiling and auditing.
 */
export const profilingService = {
  profileDataset: (data: any[]): DataSchema => {
    if (data.length === 0) return { columns: [], rowCount: 0, columnProfiles: [], duplicates: 0 };

    const columns = Object.keys(data[0]);
    const rowCount = data.length;
    const profiles: ColumnProfile[] = [];

    // Detect duplicates using JSON stringification for deep comparison
    const uniqueRows = new Set(data.map(r => JSON.stringify(r)));
    const duplicates = rowCount - uniqueRows.size;

    columns.forEach(col => {
      const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      // Fix: values is an array, use .length instead of .size (line 22)
      const nullCount = rowCount - values.length;
      const uniqueValues = new Set(values);
      
      let type: ColumnProfile['type'] = 'mixed';
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      
      if (numericValues.length === values.length) {
        type = 'numeric';
      } else if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
        type = 'boolean';
      } else if (values.every(v => !isNaN(Date.parse(v)))) {
        type = 'date';
      } else if (values.every(v => typeof v === 'string')) {
        type = 'string';
      }

      let profile: ColumnProfile = {
        name: col,
        type,
        nullCount,
        uniqueCount: uniqueValues.size,
        outliers: 0
      };

      if (type === 'numeric') {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        profile.outliers = numericValues.filter(v => v < lowerBound || v > upperBound).length;
        profile.min = sorted[0];
        profile.max = sorted[sorted.length - 1];
        profile.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        profile.std = Math.sqrt(numericValues.map(x => Math.pow(x - (profile.mean || 0), 2)).reduce((a, b) => a + b) / numericValues.length);
      }

      profiles.push(profile);
    });

    return { columns, rowCount, columnProfiles: profiles, duplicates };
  },

  generateAuditIssues: (schema: DataSchema): AuditIssue[] => {
    const issues: AuditIssue[] = [];

    if (schema.duplicates > 0) {
      issues.push({
        column: 'All',
        severity: 'warning',
        type: 'duplicate',
        message: `${schema.duplicates} duplicate records found.`,
        reason: 'Redundant rows can skew aggregation results.',
        suggestedFix: 'Remove duplicate rows while preserving the first occurrence.'
      });
    }

    schema.columnProfiles.forEach(p => {
      if (p.nullCount > 0) {
        const pct = (p.nullCount / schema.rowCount * 100).toFixed(1);
        issues.push({
          column: p.name,
          severity: p.nullCount / schema.rowCount > 0.3 ? 'critical' : 'warning',
          type: 'missing',
          message: `${p.nullCount} missing values (${pct}%).`,
          reason: 'Incomplete data affects predictive model accuracy.',
          suggestedFix: p.type === 'numeric' ? 'Impute with mean/median.' : 'Fill with placeholder "Unknown".'
        });
      }

      if (p.outliers > 0) {
        issues.push({
          column: p.name,
          severity: 'info',
          type: 'outlier',
          message: `${p.outliers} outliers detected via IQR.`,
          reason: 'Extreme values can heavily influence statistical averages.',
          suggestedFix: 'Investigate source or cap values at 1.5x IQR.'
        });
      }

      if (p.uniqueCount === 1) {
        issues.push({
          column: p.name,
          severity: 'info',
          type: 'low_variance',
          message: 'Zero variance column.',
          reason: 'Columns with single values provide no information gain.',
          suggestedFix: 'Exclude column from feature selection.'
        });
      }
    });

    return issues;
  },

  generateCleaningPlan: (issues: AuditIssue[]): CleaningStep[] => {
    return issues.map((issue, idx) => {
      let code = '';
      switch (issue.type) {
        case 'duplicate':
          code = 'df = df.drop_duplicates(keep="first")';
          break;
        case 'missing':
          code = issue.column !== 'All' 
            ? `df["${issue.column}"] = df["${issue.column}"].fillna(df["${issue.column}"].mode()[0])` 
            : '';
          break;
        case 'outlier':
          code = `# IQR Clipping for ${issue.column}\nQ1 = df["${issue.column}"].quantile(0.25)\nQ3 = df["${issue.column}"].quantile(0.75)\nIQR = Q3 - Q1\ndf["${issue.column}"] = df["${issue.column}"].clip(lower=Q1 - 1.5 * IQR, upper=Q3 + 1.5 * IQR)`;
          break;
        case 'low_variance':
          code = `df = df.drop(columns=["${issue.column}"])`;
          break;
      }

      return {
        id: `step_${idx}`,
        action: issue.message,
        description: issue.reason,
        pythonCode: code,
        executed: false
      };
    }).filter(s => s.pythonCode !== '');
  }
};
