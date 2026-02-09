
import { JobRecord, JobStatus, Brain2Result } from '../types';
import { StorageService } from './storageService';
import { DataEngine } from './dataEngine';
import { GeminiService } from './geminiService';
import { UserService } from './userService';
import { CacheService } from './cacheService';
import { TransformationEngine } from '../data_engine/transformation';

export class WorkerService {
  static async processTask(jobId: string, filePath: string, cacheKey: string, onUpdate: (job: Partial<JobRecord>) => void): Promise<void> {
    const userId = UserService.getCurrentUserId();
    
    try {
      onUpdate({ status: JobStatus.PROCESSING });

      const rawContent = await StorageService.download(filePath);
      const { summary, cleanedData, metrics } = await DataEngine.processCsv(rawContent);
      
      await StorageService.upload(`processed/${jobId}_summary.json`, JSON.stringify(summary));

      let aiResult: Brain2Result | undefined;
      if (UserService.canUseAi(userId)) {
        onUpdate({ status: JobStatus.AI_REASONING });
        
        // Parallelize Insight and Dashboard Design
        const [insights, blueprint] = await Promise.all([
          GeminiService.generateInsights(summary),
          GeminiService.designDashboard(summary)
        ]);
        
        aiResult = insights;
        
        // Apply AI-designed dashboard immediately
        summary.dashboard = TransformationEngine.buildDashboardFromBlueprint(cleanedData, summary, blueprint);
        
        UserService.useAiCall(userId, aiResult.token_usage || 0);
      } else {
        // Fallback to deterministic dashboard if AI is exhausted
        summary.dashboard = TransformationEngine.buildDashboard(cleanedData, summary);
      }

      onUpdate({
        status: JobStatus.COMPLETED,
        completedAt: Date.now(),
        summary,
        aiResult,
        dataStack: [cleanedData],
        chatHistory: [],
        metrics: {
          processingTimeMs: metrics.processingTimeMs
        }
      });

      CacheService.set(cacheKey, summary, aiResult);
      UserService.trackFileProcessed(userId);

    } catch (err: any) {
      console.error(`[Worker] Job ${jobId} failed:`, err);
      throw err;
    }
  }
}
