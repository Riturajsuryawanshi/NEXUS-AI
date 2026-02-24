import { DataSummary } from './data';
import { Brain2Result, ChatMessage, Opportunity, BusinessDecision } from './insights';

export enum JobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    AI_REASONING = 'AI_REASONING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
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
