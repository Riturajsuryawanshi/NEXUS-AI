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
