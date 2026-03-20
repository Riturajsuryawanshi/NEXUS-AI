export type DataType = 'numeric' | 'categorical' | 'boolean' | 'date' | 'unknown';

export interface ColumnMetadata {
    name: string;
    type: DataType;
    nullCount: number;
    uniqueCount: number;
}

export interface NumericStats {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    outliersCount: number;
    skewness?: 'positive' | 'negative' | 'normal';
}

export interface CategoricalStats {
    topValue: string;
    topValueCount: number;
    entropy?: number;
}

export interface DataSuggestion {
    id: string;
    type: 'warning' | 'info' | 'critical';
    title: string;
    description: string;
    impact: string;
    actionLabel: string;
    timeGranularity?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface OperationLog {
    timestamp: number;
    action: string;
    reason: string;
    details: string;
}

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title: string;
    xKey: string;
    yKey: string;
    data: any[];
}

export interface DashboardConfig {
    kpis: { label: string; value: string | number; trend?: number }[];
    charts: ChartConfig[];
}

export interface Contributor {
    factor: string;
    dimension: string;
    contribution_percentage: number;
    direction: 'increase' | 'decrease';
    absolute_impact: number;
}

export interface RootCauseSummary {
    kpi_name: string;
    total_delta: number;
    total_delta_pct: number;
    top_contributors: Contributor[];
    confidence_score: number;
    analysis_method: string;
}

export interface DataSummary {
    rowCount: number;
    columnCount: number;
    duplicateCount: number;
    qualityScore: number;
    suggestions: DataSuggestion[];
    operationHistory: OperationLog[];
    columns: Record<string, ColumnMetadata & {
        stats?: NumericStats | CategoricalStats;
    }>;
    sampleData: any[];
    rootCause?: RootCauseSummary;
    dashboard?: DashboardConfig;
}

// ============================================
// Legacy / Shared Types
// ============================================

/** User object used by legacy authService */
export interface User {
    id: string;
    email: string;
    name: string;
    plan: string;
    preferences: {
        defaultDateFormat: string;
        numberFormat: string;
        autoCleaning: boolean;
        language: string;
    };
}

/** Cache record for in-memory caching */
export interface CacheRecord {
    key: string;
    summary: DataSummary;
    aiResult?: import('./insights').Brain2Result;
    createdAt: number;
}

// ============================================
// Data Profiling Types
// ============================================

/** Schema produced by the profiling service */
export interface DataSchema {
    columns: string[];
    rowCount: number;
    columnProfiles: ColumnProfile[];
    duplicates: number;
}

/** Column-level statistics produced by profiling */
export interface ColumnProfile {
    name: string;
    type: 'numeric' | 'string' | 'boolean' | 'date' | 'mixed';
    nullCount: number;
    uniqueCount: number;
    outliers: number;
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
}

/** An issue found during data auditing */
export interface AuditIssue {
    column: string;
    severity: 'info' | 'warning' | 'critical';
    type: 'duplicate' | 'missing' | 'outlier' | 'low_variance';
    message: string;
    reason: string;
    suggestedFix: string;
}

/** A step in the auto-generated cleaning plan */
export interface CleaningStep {
    id: string;
    action: string;
    description: string;
    pythonCode: string;
    executed: boolean;
}

// ============================================
// Project / Workflow Types
// ============================================

/** Workflow stages for an analysis project */
export enum WorkflowStep {
    IMPORT = 'import',
    AUDIT = 'audit',
    CLEAN = 'clean',
    ANALYZE = 'analyze',
    DEPLOY = 'deploy',
}

/** A saved analysis project */
export interface AnalysisProject {
    id: string;
    userId: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    activeStep: WorkflowStep;
    dataset: any[] | null;
    rawDataset: any[] | null;
    schema: DataSchema | null;
    auditIssues: AuditIssue[];
    cleaningPlan: CleaningStep[];
    messages: import('./insights').ChatMessage[];
    historyLogs: OperationLog[];
    consoleCode: string;
}

// ============================================
// Media Types (ImageLab / VideoLab)
// ============================================

/** Supported image sizes */
export type ImageSize = '1K' | '2K' | '4K';

/** Supported aspect ratios */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// ============================================
// Analysis Types (DataAnalyst)
// ============================================

/** Result returned by performDataAnalysis */
export interface AnalysisResult {
    summary: string;
    insights: string[];
    chartType: 'bar' | 'line' | 'area' | 'pie';
    chartData: any[];
    columns: string[];
}
