
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AI_REASONING = 'AI_REASONING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type DataType = 'numeric' | 'categorical' | 'boolean' | 'date' | 'unknown';
export type PlanType = 'free' | 'pro' | 'enterprise';
export type AuthProvider = 'email' | 'google' | 'both';

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
}

export interface OperationLog {
  timestamp: number;
  action: string;
  reason: string;
  details: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionHint?: string;
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

export interface Brain2Result {
  summary: string;
  key_insights: string[];
  risks_or_anomalies?: string[];
  suggested_kpis: string[];
  learning_notes?: string;
  causal_explanation?: string;
  token_usage?: number;
}

export interface BusinessContext {
  businessType: string;
  primaryGoal: string;
  primaryKPI: string;
  currency: string;
  businessType: string;
  primaryGoal: string;
  primaryKPI: string;
  currency: string;
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  currency: string;
  businessContext: BusinessContext;
  createdAt: number;
  datasetCount?: number;
  lastActiveAt?: number;
}

export interface Opportunity {
  id: string;
  type: 'revenue_gain' | 'cost_leak' | 'optimization';
  title: string;
  affectedKPI: string;
  estimatedImpact: number;
  estimatedCost: number;
  roiScore: number;
  confidence: number;
  description: string;
  actionPlan: string[];
  dimension?: string;
  factor?: string;
  effort?: 'low' | 'medium' | 'high';
}

export interface BusinessDecision {
  id: string;
  title: string;
  whyItMatters: string;
  action: string;
  expectedGain: number;
  confidence: number;
  type: 'top_3' | 'quick_win' | 'high_impact';
  riskLevel: 'low' | 'medium' | 'high';
  timeToImpact: string;
  affectedSegment: string;
}

export interface UserProfile {
  userId: string;
  planType: PlanType;
  dailyFileLimit: number;
  filesProcessedToday: number;
  aiCallsRemaining: number;
  aiTokensUsedToday: number;
  aiTokensLimitDaily: number;
  lastUsageResetAt: number;
  authProvider: AuthProvider;
  displayName?: string;
  avatarUrl?: string;
  avatarUrl?: string;
  activeClientId?: string; // New: Tracks current workspace
  preferences: {
    learningMode: boolean;
  };
}

export interface JobRecord {
  id: string;
  userId: string;
  clientId?: string; // New: Links data to a specific client
  fileName: string;
  fileSize: number;
  status: JobStatus;
  createdAt: number;
  completedAt?: number;
  summary?: DataSummary;
  aiResult?: Brain2Result;
  error?: string;
  isCached?: boolean;
  retryCount?: number;
  maxRetries?: number;
  dataStack: any[][];
  chatHistory: ChatMessage[];
  opportunities?: Opportunity[];
  decisions?: BusinessDecision[];
  metrics?: {
    processingTimeMs: number;
    tokensUsed?: number;
  };
}

// Added missing internal types used by services
export interface ProcessingResult {
  summary: DataSummary;
  cleanedData: any[];
  metrics: {
    processingTimeMs: number;
  };
}

export interface CacheRecord {
  key: string;
  summary: DataSummary;
  aiResult?: Brain2Result;
  createdAt: number;
}
