
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  preferences?: {
    defaultDateFormat: string;
    numberFormat: string;
    autoCleaning: boolean;
    language: string;
  };
}

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'string' | 'date' | 'boolean' | 'mixed';
  nullCount: number;
  uniqueCount: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  outliers: number;
}

export interface DataSchema {
  columns: string[];
  rowCount: number;
  columnProfiles: ColumnProfile[];
  duplicates: number;
}

export interface AuditIssue {
  column: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  reason: string;
  suggestedFix: string;
  type: 'missing' | 'duplicate' | 'outlier' | 'type_mismatch' | 'low_variance';
}

export interface CleaningStep {
  id: string;
  action: string;
  description: string;
  pythonCode: string;
  executed: boolean;
}

export interface AnalysisResponse {
  type: 'chart' | 'summary';
  title: string;
  explanation: string;
  insights: string[];
  data: any[];
  chartConfig?: {
    xAxis: string;
    yAxis: string[];
  };
}

export interface AnalysisResult {
  chartType: 'bar' | 'line' | 'area' | 'pie';
  chartData: any[];
  columns: string[];
  summary: string;
  insights: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: any[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: AnalysisResponse;
  timestamp: number;
}

export enum WorkflowStep {
  IMPORT = 'IMPORT',
  CLEAN = 'CLEAN',
  ANALYZE = 'ANALYZE'
}

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
  messages: Message[];
  historyLogs: any[];
  consoleCode: string;
}

export enum AppTab {
  DATA_ANALYST = 'DATA_ANALYST',
  PROJECT_LIBRARY = 'PROJECT_LIBRARY',
  ACCOUNT = 'ACCOUNT',
  IMAGE_LAB = 'IMAGE_LAB',
  VIDEO_LAB = 'VIDEO_LAB',
  LIVE_CHAT = 'LIVE_CHAT',
  GENERAL_CHAT = 'GENERAL_CHAT'
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
